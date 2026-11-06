// Collegamento con il lettore NFC USB (ACR122U) tramite il piccolo programma "lettore_nfc.py"
// che gira sul PC del laboratorio e ascolta su ws://localhost:8765.
// Il programma legge il codice (UID) della tessera/tag e lo manda al sito.
const URL = "ws://localhost:8765";
const codeListeners = new Set();
const statusListeners = new Set();
let ws = null;
let connected = false;
let timer = null;

function setConnected(v) {
  if (connected === v) return;
  connected = v;
  statusListeners.forEach((f) => f(v));
}

function connect() {
  if (ws || typeof WebSocket === "undefined") return;
  try {
    ws = new WebSocket(URL);
  } catch (e) {
    ws = null;
    schedule();
    return;
  }
  ws.onopen = () => setConnected(true);
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg && typeof msg.uid === "string" && msg.uid.length >= 4) {
        codeListeners.forEach((f) => f(msg.uid));
      }
    } catch (e) {
      /* messaggio non valido: ignorato */
    }
  };
  ws.onclose = () => {
    ws = null;
    setConnected(false);
    schedule();
  };
  ws.onerror = () => {
    try { ws && ws.close(); } catch (e) { /* niente */ }
  };
}

function schedule() {
  if (timer || (codeListeners.size === 0 && statusListeners.size === 0)) return;
  timer = setTimeout(() => {
    timer = null;
    connect();
  }, 3000);
}

function ensure() {
  if (!ws) connect();
}

// Chiama cb(uid) ogni volta che una tessera viene letta. Restituisce la funzione per smettere.
export function subscribeNfc(cb) {
  codeListeners.add(cb);
  ensure();
  return () => codeListeners.delete(cb);
}

// Chiama cb(true/false) quando il programma del lettore si collega/scollega.
export function subscribeNfcStatus(cb) {
  statusListeners.add(cb);
  cb(connected);
  ensure();
  return () => statusListeners.delete(cb);
}
