"""
Lettore NFC per il sito "Laboratorio di Metrologia" (lettore USB ACS ACR122U).

Il lettore ACR122U NON si comporta come una tastiera: e' un lettore "smart card" (PC/SC).
Questo programmino gira sul PC dove e' collegato il lettore, legge il codice (UID) della
tessera/tag e lo manda al sito aperto nel browser (solo su questo PC, indirizzo localhost).

Uso: fai doppio clic su AVVIA_LETTORE.bat e lascia la finestra aperta.
"""
import asyncio
import json
import sys

try:
    from smartcard.System import readers
    from smartcard.Exceptions import NoCardException, CardConnectionException
    import websockets
except ImportError:
    print("Mancano dei componenti. Usa AVVIA_LETTORE.bat oppure esegui:")
    print("   pip install pyscard websockets")
    sys.exit(1)

PORT = 8765
# Il sito puo' collegarsi solo da queste pagine (cosi' altri siti non possono leggere le tessere)
ORIGINI_CONSENTITE = [
    "https://metrology-lab-web.onrender.com",
    "http://localhost:3000",
]
GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]  # comando standard PC/SC: restituisce l'UID

clienti = set()


def leggi_uid():
    """Restituisce l'UID (stringa esadecimale) se una tessera e' appoggiata, altrimenti None."""
    try:
        lista = readers()
    except Exception:
        return None
    if not lista:
        return None
    for lettore in lista:
        try:
            conn = lettore.createConnection()
            conn.connect()
            data, sw1, sw2 = conn.transmit(GET_UID)
            conn.disconnect()
            if (sw1, sw2) == (0x90, 0x00) and data:
                return "".join("%02X" % b for b in data)
        except (NoCardException, CardConnectionException):
            continue
        except Exception:
            continue
    return None


async def ciclo_lettura():
    ultimo = None
    loop = asyncio.get_running_loop()
    avvisato_nessun_lettore = False
    while True:
        uid = await loop.run_in_executor(None, leggi_uid)
        if uid and uid != ultimo:
            print("Tessera letta:", uid)
            messaggio = json.dumps({"uid": uid})
            for c in list(clienti):
                try:
                    await c.send(messaggio)
                except Exception:
                    clienti.discard(c)
        if uid is None:
            try:
                if not readers() and not avvisato_nessun_lettore:
                    print("Nessun lettore trovato: controlla che sia collegato via USB.")
                    avvisato_nessun_lettore = True
                elif readers():
                    avvisato_nessun_lettore = False
            except Exception:
                pass
        ultimo = uid  # si rimanda il codice solo quando la tessera viene tolta e riappoggiata
        await asyncio.sleep(0.35)


async def gestisci(ws):
    clienti.add(ws)
    try:
        await ws.wait_closed()
    finally:
        clienti.discard(ws)


async def main():
    print("=" * 56)
    print(" Lettore NFC - Laboratorio di Metrologia")
    print(" Lascia questa finestra aperta e apri il sito nel browser.")
    print(" Passa una tessera sul lettore: il codice arriva al sito.")
    print("=" * 56)
    async with websockets.serve(gestisci, "localhost", PORT, origins=ORIGINI_CONSENTITE):
        await ciclo_lettura()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
