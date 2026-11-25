import { useEffect, useState } from "react";
import { FlaskConical, RotateCcw, Power } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { API } from "../App";

// Scheda per l'amministratore: attiva / disattiva la modalità demo.
export default function DemoModeCard({ token }) {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const r = await fetch(`${API}/demo/status`, { credentials: "include" });
      if (r.ok) setSt(await r.json());
    } catch (e) { /* niente */ }
  };
  useEffect(() => { load(); }, []);

  const call = async (action, ok) => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`${API}/demo/${action}`, { method: "POST", headers, credentials: "include" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg(d.detail || "Operazione non riuscita");
      else setMsg(ok);
    } catch (e) {
      setMsg("Errore di connessione. Riprova.");
    } finally {
      setBusy(false); load();
    }
  };

  const enable = () => {
    if (window.confirm("Attivare la modalità demo?\n\nIl sito fa una copia dei dati: chi lo prova può cambiare e cancellare quello che vuole, e quando la spegni torna tutto com'era. Le email non vengono inviate.")) {
      call("enable", "Modalità demo attiva: i dati di ora sono al sicuro.");
    }
  };
  const disable = () => {
    if (window.confirm("Disattivare la demo?\n\nTutto quello che è stato fatto durante la demo verrà annullato e i dati torneranno com'erano all'attivazione.")) {
      call("disable", "Demo disattivata: i dati sono tornati come prima.");
    }
  };
  const reset = () => {
    if (window.confirm("Ripristinare i dati della demo?\n\nLa demo resta attiva, ma tutte le prove fatte finora vengono cancellate.")) {
      call("reset", "Dati della demo ripristinati.");
    }
  };

  if (!st) return null;
  const active = !!st.active;
  return (
    <Card className={`mb-6 ${active ? "border-amber-400 bg-amber-50" : ""}`} data-testid="demo-card">
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <FlaskConical className={active ? "text-amber-600" : "text-slate-500"} size={22} />
          <div>
            <div className="font-semibold text-slate-900">
              Modalità demo {active ? "ATTIVA" : "spenta"}
            </div>
            <p className="text-sm text-slate-600">
              {active
                ? `Le modifiche fatte ora non restano: quando la spegni torna tutto come prima.${st.since ? " Attiva dal " + new Date(st.since).toLocaleString("it-IT") + "." : ""}`
                : "Per far provare il sito allo stand: attiva e chiunque potrà modificare tutto senza rischi."}
            </p>
            {msg && <p className="text-sm mt-1 text-slate-800" data-testid="demo-msg">{msg}</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {active ? (
            <>
              <Button variant="outline" onClick={reset} disabled={busy} data-testid="demo-reset-btn">
                <RotateCcw size={16} className="mr-2" /> Ripristina dati demo
              </Button>
              <Button onClick={disable} disabled={busy} className="bg-amber-500 hover:bg-amber-600 text-black" data-testid="demo-disable-btn">
                <Power size={16} className="mr-2" /> {busy ? "Attendi..." : "Disattiva e ripristina"}
              </Button>
            </>
          ) : (
            <Button onClick={enable} disabled={busy} data-testid="demo-enable-btn">
              <Power size={16} className="mr-2" /> {busy ? "Attendi..." : "Attiva demo"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
