import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { API } from "../App";

const ENTITIES = [
  { id: "strumenti", label: "Strumenti", hint: "nome, matricola, marca, ubicazione, date e errore di taratura, foto..." },
  { id: "filamenti", label: "Filamenti", hint: "materiale, colore, marca, grammi, scorta minima, note" },
  { id: "destinazioni", label: "Destinazioni", hint: "nome e descrizione (solo amministratore)", adminOnly: true },
];

export default function BulkEditDialog({ open, onOpenChange, token, isAdmin, onDone }) {
  const [entity, setEntity] = useState("strumenti");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError("");
    setResult(null);
    setLoading(false);
  };

  const close = (value) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const pickEntity = (id) => {
    setEntity(id);
    reset();
  };

  const download = async () => {
    setError("");
    try {
      const res = await fetch(`${API}/bulk-edit/${entity}/export`, { headers, credentials: "include" });
      if (!res.ok) throw new Error("export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `modifica_${entity}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Impossibile scaricare il file. Riprova.");
    }
  };

  const send = async (path, theFile) => {
    const formData = new FormData();
    formData.append("file", theFile);
    const res = await fetch(`${API}/bulk-edit/${entity}/${path}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Operazione non riuscita");
    return data;
  };

  const onFile = async (e) => {
    const chosen = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!chosen) return;
    reset();
    setFile(chosen);
    setLoading(true);
    try {
      setPreview(await send("preview", chosen));
    } catch (err) {
      setError(err.message || "Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await send("confirm", file);
      setResult(data);
      setPreview(null);
      if (onDone) onDone();
    } catch (err) {
      setError(err.message || "Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const show = (v) => (v === "" || v === null || v === undefined ? <em className="text-slate-400">vuoto</em> : v);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Work Sans" }}>
            <FileSpreadsheet className="inline mr-2 h-5 w-5" />
            Modifica da Excel
          </DialogTitle>
          <DialogDescription>
            Scarica i dati in Excel, cambia quello che vuoi e ricaricalo: vedi tutte le modifiche prima di applicarle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100" role="group" aria-label="Cosa modificare" data-testid="bulk-entity">
            {ENTITIES.filter((x) => !x.adminOnly || isAdmin).map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => pickEntity(x.id)}
                className={`rounded-md py-1.5 text-sm font-medium transition-colors ${entity === x.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
                data-testid={`bulk-entity-${x.id}`}
              >
                {x.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Puoi modificare: {ENTITIES.find((x) => x.id === entity)?.hint}.</p>

          <ol className="text-sm text-slate-600 list-decimal pl-5 space-y-1">
            <li>Scarica il file: contiene tutti i dati attuali, uno per riga.</li>
            <li>In Excel cambia le celle che vuoi (svuota una cella per cancellare quel dato). Non toccare la colonna ID grigia.</li>
            <li>Salva e carica il file qui: vedrai ogni modifica (prima → dopo) e poi confermi.</li>
          </ol>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={download} data-testid="bulk-download-btn">
              <Download size={16} className="mr-2" />
              Scarica Excel con i dati attuali
            </Button>
            <label>
              <input type="file" accept=".xlsx" className="hidden" onChange={onFile} data-testid="bulk-file-input" />
              <span className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer">
                <Upload size={16} className="mr-2" />
                Carica file modificato
              </span>
            </label>
          </div>

          {file && <p className="text-sm text-slate-500">File: {file.name}</p>}
          {loading && <p className="text-sm text-slate-600">Elaborazione in corso...</p>}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="bulk-error">
              <AlertTriangle className="inline mr-2 h-4 w-4" />
              {error}
            </div>
          )}

          {result && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm" data-testid="bulk-success">
              <CheckCircle className="inline mr-2 h-4 w-4" />
              Fatto: {result.updated} {result.updated === 1 ? "riga modificata" : "righe modificate"} ({result.fields} campi)
              {result.skipped > 0 ? `, ${result.skipped} saltate per errori` : ""}.
            </div>
          )}

          {preview && (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{preview.counts.changed} righe da modificare ({preview.counts.fields} campi)</Badge>
                <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">{preview.counts.unchanged} senza modifiche</Badge>
                {preview.counts.error + preview.counts.not_found > 0 && (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    {preview.counts.error + preview.counts.not_found} da correggere
                  </Badge>
                )}
              </div>

              {preview.rows.length === 0 ? (
                <p className="text-sm text-slate-500">Nel file non c'è nessuna modifica rispetto ai dati del sito.</p>
              ) : (
                <div className="border rounded-lg max-h-80 overflow-auto divide-y" data-testid="bulk-preview">
                  {preview.rows.map((r) => (
                    <div key={`${r.row}-${r.id}`} className={`p-3 text-sm ${r.status === "changed" ? "" : "bg-red-50"}`}>
                      <p className="font-medium text-slate-900">
                        <span className="text-xs text-slate-400 mr-2">Riga {r.row}</span>
                        {r.name || r.id || "-"}
                      </p>
                      {r.status === "changed" ? (
                        <ul className="mt-1 space-y-0.5">
                          {r.changes.map((c) => (
                            <li key={c.field} className="text-xs text-slate-600 flex flex-wrap items-center gap-1">
                              <span className="font-medium text-slate-700">{c.label}:</span>
                              <span className="line-through decoration-slate-300">{show(c.old)}</span>
                              <ArrowRight size={12} className="text-slate-400" />
                              <span className="text-green-700 font-medium">{show(c.new)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-red-700">{r.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {preview.truncated && <p className="text-xs text-slate-500">Mostro le prime 1000 righe; verranno applicate tutte.</p>}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => close(false)}>Annulla</Button>
                <Button
                  onClick={confirm}
                  disabled={loading || preview.counts.changed === 0}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="bulk-confirm-btn"
                >
                  Applica {preview.counts.changed} {preview.counts.changed === 1 ? "modifica" : "modifiche"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
