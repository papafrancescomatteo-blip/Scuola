import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { CreditCard, Smartphone, Monitor, CheckCircle, XCircle, LogOut } from "lucide-react";
import { API } from "../App";
import { phoneNfcSupported, startPhoneNfc } from "../lib/phoneNfc";

const ago = (iso) => {
  if (!iso) return "";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} s fa`;
  if (s < 3600) return `${Math.round(s / 60)} min fa`;
  return `${Math.round(s / 3600)} h fa`;
};

// Stato del lettore del PC + lettura delle tessere dal telefono (solo admin/tecnico).
export default function NfcPanel({ token, onChange }) {
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const stopRef = useRef(null);
  const lastScanRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/nfc/status`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setStatus(d);
      const at = d.last_scan?.at || null;
      if (lastScanRef.current !== null && at !== lastScanRef.current) onChange && onChange();
      lastScanRef.current = at;
    } catch (e) { /* niente */ }
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    loadStatus();
    const t = setInterval(loadStatus, 10000);
    return () => clearInterval(t);
  }, [loadStatus]);

  useEffect(() => () => { if (stopRef.current) stopRef.current(); }, []);

  const send = async (uid) => {
    try {
      const res = await fetch(`${API}/nfc/scan`, { method: "POST", headers, credentials: "include", body: JSON.stringify({ uid }) });
      const d = await res.json().catch(() => ({}));
      const item = res.ok
        ? { ok: d.ok, action: d.action, text: d.message, at: new Date().toISOString() }
        : { ok: false, action: "error", text: typeof d.detail === "string" ? d.detail : "Errore", at: new Date().toISOString() };
      setResults((r) => [item, ...r].slice(0, 5));
      onChange && onChange();
    } catch (e) {
      setResults((r) => [{ ok: false, action: "error", text: "Sito non raggiungibile", at: new Date().toISOString() }, ...r].slice(0, 5));
    }
  };

  const toggle = async () => {
    setError("");
    if (scanning) {
      if (stopRef.current) stopRef.current();
      stopRef.current = null;
      setScanning(false);
      return;
    }
    try {
      stopRef.current = await startPhoneNfc(send, setError);
      setScanning(true);
    } catch (e) {
      setError(e?.name === "NotAllowedError" ? "Permesso NFC negato: consentilo nelle impostazioni del browser." : e.message || "NFC non disponibile");
    }
  };

  const supported = phoneNfcSupported();

  return (
    <Card className="mb-6" data-testid="nfc-panel">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-slate-900" style={{ fontFamily: "Work Sans" }}>
          <CreditCard size={18} className="text-blue-600" /> Ingresso con la tessera
        </div>
        <p className="text-sm text-slate-600">Passa la tessera sul lettore: registra l'ingresso, la volta dopo l'uscita. Vale anche se la persona usa il sito dal telefono.</p>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3 flex items-start gap-3">
            <Monitor size={20} className={status?.pc_online ? "text-emerald-600" : "text-slate-400"} />
            <div className="text-sm">
              <div className="font-medium">Lettore del PC del laboratorio</div>
              {!status ? <span className="text-slate-500">Controllo...</span>
                : !status.configured ? <span className="text-amber-700">Non ancora configurato sul sito (manca NFC_READER_KEY su Render).</span>
                : status.pc_online ? <span className="text-emerald-700">Acceso e collegato · visto {ago(status.pc_last_seen)}</span>
                : <span className="text-red-600">Spento o non collegato{status.pc_last_seen ? ` · ultimo segnale ${ago(status.pc_last_seen)}` : ""}. Controlla che il PC sia acceso e il programma del lettore attivo.</span>}
              {status?.last_scan && <div className="text-slate-500 mt-1">Ultimo passaggio: {status.last_scan.text} ({ago(status.last_scan.at)})</div>}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 flex items-start gap-3">
            <Smartphone size={20} className={scanning ? "text-emerald-600" : "text-slate-400"} />
            <div className="text-sm flex-1">
              <div className="font-medium">Questo telefono come lettore</div>
              {supported ? (
                <>
                  <p className="text-slate-500 mb-2">{scanning ? "In ascolto: appoggia la tessera sul retro del telefono." : "Attiva la lettura e appoggia la tessera sul retro del telefono."}</p>
                  <Button size="sm" variant={scanning ? "outline" : "default"} onClick={toggle} data-testid="phone-nfc-toggle" className={scanning ? "" : "bg-blue-600 hover:bg-blue-700"}>
                    {scanning ? "Ferma la lettura" : "Leggi tessere con questo telefono"}
                  </Button>
                </>
              ) : (
                <p className="text-slate-500">Questo dispositivo non legge le tessere dal sito (serve Chrome su Android). Usa il lettore del PC.</p>
              )}
              {error && <p className="text-red-600 mt-2">{error}</p>}
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <ul className="space-y-1.5" aria-live="polite">
            {results.map((r, i) => (
              <li key={r.at + i} className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${r.ok ? (r.action === "exit" ? "bg-sky-50 text-sky-800" : "bg-emerald-50 text-emerald-800") : "bg-red-50 text-red-700"}`}>
                {r.ok ? (r.action === "exit" ? <LogOut size={16} /> : <CheckCircle size={16} />) : <XCircle size={16} />}
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
