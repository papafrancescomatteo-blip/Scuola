import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { ClipboardCheck, AlertTriangle } from "lucide-react";
import { API } from "../App";

const DISMISS_KEY = "lab_prompt_dismissed";

// Finestra "Registro accessi" che compare appena si entra nel sito
export default function LabAccessGate({ user, token }) {
  const [open, setOpen] = useState(false);
  const [cognome, setCognome] = useState("");
  const [nome, setNome] = useState("");
  const [kind, setKind] = useState("studente"); // "prof" | "studente"
  const [classe, setClasse] = useState("");
  const [activity, setActivity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`${API}/lab/status`, { headers, credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.inside) return;

        const parts = (user.name || "").trim().split(/\s+/);
        const last = data.last;
        setNome(last?.nome || parts[0] || "");
        setCognome(last?.cognome || parts.slice(1).join(" "));
        if (last?.class_name === "Prof.") {
          setKind("prof");
        } else if (last?.class_name) {
          setKind("studente");
          setClasse(last.class_name);
        }

        let dismissed = false;
        try {
          dismissed = sessionStorage.getItem(DISMISS_KEY) === user.user_id;
        } catch (e) {
          dismissed = false;
        }
        if (!dismissed) {
          setNow(new Date());
          setOpen(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [user.user_id, token]);

  // Il pulsante "Ingresso in laboratorio" nella barra laterale riapre la finestra
  useEffect(() => {
    const reopen = () => {
      setNow(new Date());
      setError("");
      setOpen(true);
    };
    window.addEventListener("lab-open-entry", reopen);
    return () => window.removeEventListener("lab-open-entry", reopen);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, user.user_id);
    } catch (e) {
      /* niente */
    }
    setOpen(false);
  };

  const className = kind === "prof" ? "Prof." : classe.trim().toUpperCase();
  const canSave = cognome.trim() && nome.trim() && className && activity.trim() && !saving;

  const confirmEntry = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/lab/entry`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cognome: cognome.trim(),
          nome: nome.trim(),
          class_name: className,
          activity: activity.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.detail === "string" ? data.detail : "Impossibile registrare l'ingresso");
        return;
      }
      setActivity("");
      setOpen(false);
      window.dispatchEvent(new Event("lab-status-changed"));
    } catch (e) {
      setError("Errore di connessione. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const time = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
  const date = now.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" });

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) dismiss(); }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Work Sans" }}>
            <ClipboardCheck className="inline mr-2 h-5 w-5 text-blue-600" />
            Registro accessi – Laboratorio di Metrologia
          </DialogTitle>
          <DialogDescription>
            Confermi di essere entrato in laboratorio? Compila e firma l'ingresso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="lab-cognome">Cognome</Label>
              <Input id="lab-cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} data-testid="lab-cognome" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lab-nome">Nome</Label>
              <Input id="lab-nome" value={nome} onChange={(e) => setNome(e.target.value)} data-testid="lab-nome" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sei</Label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="lab-kind" checked={kind === "prof"} onChange={() => setKind("prof")} />
                Professore
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="lab-kind" checked={kind === "studente"} onChange={() => setKind("studente")} />
                Studente
              </label>
            </div>
            {kind === "studente" && (
              <Input
                placeholder="Classe (es. 4A MEC)"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                data-testid="lab-classe"
              />
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="lab-activity">Attività svolta</Label>
            <Textarea
              id="lab-activity"
              rows={3}
              placeholder="Es. Misure con calibro e micrometro"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              data-testid="lab-activity"
            />
          </div>

          <p className="text-xs text-slate-500">
            Data {date} · Ora ingresso {time}. Premendo il pulsante firmi digitalmente l'ingresso come {user.name}.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="inline mr-2 h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={dismiss} data-testid="lab-skip-btn">
            Non sono in laboratorio
          </Button>
          <Button onClick={confirmEntry} disabled={!canSave} className="bg-blue-600 hover:bg-blue-700" data-testid="lab-confirm-btn">
            {saving ? "Registrazione..." : "Conferma ingresso e firma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
