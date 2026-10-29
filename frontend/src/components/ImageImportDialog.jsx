import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Download, Upload, ImageIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { API } from "../App";

export default function ImageImportDialog({ open, onOpenChange, token, onDone }) {
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

  const downloadTemplate = async () => {
    setError("");
    try {
      const res = await fetch(`${API}/instruments/import-images/template`, { headers, credentials: "include" });
      if (!res.ok) throw new Error("template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modello_foto_strumenti.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Impossibile scaricare il modello. Riprova.");
    }
  };

  const send = async (path, theFile) => {
    const formData = new FormData();
    formData.append("file", theFile);
    const res = await fetch(`${API}/instruments/import-images/${path}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Operazione non riuscita");
    return data;
  };

  const onFile = async (e) => {
    const chosen = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!chosen) return;
    setError("");
    setResult(null);
    setPreview(null);
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

  const statusCell = (r) => {
    if (r.status === "ok") {
      return <span className="text-green-700">{r.replaces ? "Sostituisce la foto attuale" : "Nuova foto"}</span>;
    }
    return <span className={r.status === "no_image" ? "text-slate-500" : "text-red-700"}>{r.message}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Work Sans" }}>
            <ImageIcon className="inline mr-2 h-5 w-5" />
            Importa foto da Excel
          </DialogTitle>
          <DialogDescription>
            Ogni foto viene collegata allo strumento tramite la sua matricola. Le foto vengono salvate solo dopo la tua conferma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ol className="text-sm text-slate-600 list-decimal pl-5 space-y-1">
            <li>Scarica il modello: contiene già le matricole di tutti gli strumenti.</li>
            <li>
              In Excel inserisci la foto di ogni strumento nella sua riga (<em>Inserisci → Immagini → Posiziona sopra le celle</em>,
              oppure incolla la foto), oppure scrivi l'indirizzo web della foto nella colonna URL.
            </li>
            <li>Salva il file e caricalo qui: vedrai l'anteprima prima di confermare.</li>
          </ol>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadTemplate} data-testid="download-image-template-btn">
              <Download size={16} className="mr-2" />
              Scarica modello Excel
            </Button>
            <label>
              <input type="file" accept=".xlsx" className="hidden" onChange={onFile} data-testid="image-import-file-input" />
              <span className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer">
                <Upload size={16} className="mr-2" />
                Scegli file Excel
              </span>
            </label>
          </div>

          {file && <p className="text-sm text-slate-500">File: {file.name}</p>}

          {loading && (
            <p className="text-sm text-slate-600">
              Elaborazione in corso... con molte foto può richiedere circa un minuto, non chiudere la finestra.
            </p>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="image-import-error">
              <AlertTriangle className="inline mr-2 h-4 w-4" />
              {error}
            </div>
          )}

          {result && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm" data-testid="image-import-success">
              <CheckCircle className="inline mr-2 h-4 w-4" />
              Importate {result.imported} foto{result.failed > 0 ? ` (${result.failed} non riuscite)` : ""}.
            </div>
          )}

          {preview && (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{preview.counts.ok} pronte</Badge>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{preview.counts.no_image} senza foto</Badge>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  {preview.counts.not_found + preview.counts.error} da correggere
                </Badge>
              </div>

              <div className="border rounded-lg max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Riga</TableHead>
                      <TableHead>Foto</TableHead>
                      <TableHead>Matricola</TableHead>
                      <TableHead>Strumento</TableHead>
                      <TableHead>Esito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((r) => (
                      <TableRow key={r.row} className={r.status === "ok" ? "" : "bg-slate-50"}>
                        <TableCell>{r.row}</TableCell>
                        <TableCell>
                          {r.thumb ? (
                            <img src={r.thumb} alt="" className="h-10 w-10 object-cover rounded border" />
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.matricola || "-"}</TableCell>
                        <TableCell className="text-sm">{r.name || "-"}</TableCell>
                        <TableCell className="text-xs">{statusCell(r)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {result ? "Chiudi" : "Annulla"}
          </Button>
          {preview && (
            <Button
              onClick={confirm}
              disabled={loading || preview.counts.ok === 0}
              className="bg-green-600 hover:bg-green-700"
              data-testid="confirm-image-import-btn"
            >
              {loading ? "Importazione..." : `Conferma e importa ${preview.counts.ok} foto`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
