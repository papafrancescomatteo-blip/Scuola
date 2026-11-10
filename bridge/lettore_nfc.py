"""
Lettore NFC per il sito "Laboratorio di Metrologia" (lettore USB ACS ACR122U).

Il lettore ACR122U NON si comporta come una tastiera: e' un lettore "smart card" (PC/SC).
Questo programmino gira sul PC dove e' collegato il lettore, legge il codice (UID) della
tessera/tag e lo manda al sito aperto nel browser (solo su questo PC, indirizzo localhost).

Uso: fai doppio clic su AVVIA_LETTORE.bat e lascia la finestra aperta.
"""
import asyncio
import json
import os
import sys
import urllib.request
import urllib.error

# Se parte in automatico (senza finestra) non c'e' schermo: scrive in un file di testo
if sys.stdout is None or sys.stderr is None:
    try:
        _cartella = os.path.dirname(os.path.abspath(__file__))
        _log = open(os.path.join(_cartella, "lettore_log.txt"), "a", encoding="utf-8", buffering=1)
        sys.stdout = sys.stdout or _log
        sys.stderr = sys.stderr or _log
    except Exception:
        pass

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
# Collegamento diretto con il sito: ogni tessera letta registra ingresso/uscita nel Registro accessi,
# anche se la persona usa il sito dal telefono. Serve la chiave scritta nel file chiave_lettore.txt
# (la stessa messa su Render come NFC_READER_KEY).
SERVER = "https://metrology-lab-api.onrender.com"
CARTELLA = os.path.dirname(os.path.abspath(__file__))


def _leggi_file(nome):
    try:
        with open(os.path.join(CARTELLA, nome), "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return ""


CHIAVE = os.environ.get("NFC_READER_KEY") or _leggi_file("chiave_lettore.txt")
SERVER = (_leggi_file("indirizzo_sito.txt") or SERVER).rstrip("/")


def _chiama(percorso, corpo=None):
    """POST verso il sito. Restituisce (codice_http, dati) oppure (None, messaggio_errore)."""
    dati = json.dumps(corpo or {}).encode("utf-8")
    req = urllib.request.Request(
        SERVER + percorso, data=dati, method="POST",
        headers={"Content-Type": "application/json", "X-Reader-Key": CHIAVE},
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8") or "{}")
        except Exception:
            return e.code, {}
    except Exception as e:
        return None, str(e)


def invia_tessera(uid):
    codice, ris = _chiama("/api/nfc/scan", {"uid": uid})
    if codice == 200 and isinstance(ris, dict):
        print("   Sito:", ris.get("message", "ok"))
    elif codice == 401:
        print("   Sito: chiave del lettore non valida (controlla chiave_lettore.txt)")
    else:
        print("   Sito non raggiungibile:", ris)


def segnale_di_vita():
    _chiama("/api/nfc/heartbeat")


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
            if CHIAVE:
                loop.run_in_executor(None, invia_tessera, uid)
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


async def battito():
    """Ogni 45 secondi dice al sito che il lettore e' acceso (si vede nel Registro accessi)."""
    loop = asyncio.get_running_loop()
    while True:
        if CHIAVE:
            await loop.run_in_executor(None, segnale_di_vita)
        await asyncio.sleep(45)


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
    if CHIAVE:
        print(" Collegato al sito: le tessere registrano ingresso/uscita (anche da telefono).")
    else:
        print(" Chiave del sito non impostata: funziona solo il login dal browser di questo PC.")
    async with websockets.serve(gestisci, "localhost", PORT, origins=ORIGINI_CONSENTITE):
        asyncio.create_task(battito())
        await ciclo_lettura()


if __name__ == "__main__":
    import time
    while True:
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            break
        except OSError as e:
            # porta gia' occupata: il lettore e' gia' attivo in un'altra finestra
            print("Il lettore NFC risulta gia' attivo (porta occupata):", e)
            break
        except Exception as e:
            print("Errore, riprovo tra 5 secondi:", e)
            time.sleep(5)
