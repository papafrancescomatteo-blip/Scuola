// Lettura delle tessere NFC direttamente dal telefono (Web NFC: solo Chrome su Android, sito in HTTPS).
// Restituisce il codice (UID) della tessera. Su iPhone non e' disponibile.
export const phoneNfcSupported = () => typeof window !== "undefined" && "NDEFReader" in window;

// Avvia l'ascolto. onUid(uid) viene chiamata a ogni tessera letta. Restituisce una funzione per fermarsi.
export async function startPhoneNfc(onUid, onError) {
  if (!phoneNfcSupported()) throw new Error("Questo telefono o browser non legge le tessere NFC");
  const controller = new AbortController();
  const reader = new window.NDEFReader();
  await reader.scan({ signal: controller.signal });
  reader.onreading = (ev) => {
    const uid = (ev.serialNumber || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
    if (uid.length >= 4) onUid(uid);
  };
  reader.onreadingerror = () => onError && onError("Tessera non letta: riprova, appoggiandola al retro del telefono");
  return () => controller.abort();
}
