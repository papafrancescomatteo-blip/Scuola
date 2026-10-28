import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ClipboardCheck, Download, Search, RefreshCw, Trash2, FileText } from "lucide-react";
import { API } from "../App";

const PAGE = 100;
const timeOf = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }) : "";
const dateOf = (iso) => new Date(iso).toLocaleDateString("it-IT", { timeZone: "Europe/Rome" });

export default function LabAccessViewer({ token, canDelete }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ search: "", dateFrom: "", dateTo: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const params = () => {
    const p = new URLSearchParams();
    if (applied.search) p.set("search", applied.search);
    if (applied.dateFrom) p.set("date_from", applied.dateFrom);
    if (applied.dateTo) p.set("date_to", applied.dateTo);
    return p;
  };

  const load = useCallback(
    async (reset = true) => {
      setLoading(true);
      setError("");
      try {
        const p = params();
        p.set("limit", String(PAGE));
        p.set("skip", String(reset ? 0 : items.length));
        const res = await fetch(`${API}/lab/access?${p.toString()}`, { headers, credentials: "include" });
        if (!res.ok) throw new Error("load");
        const data = await res.json();
        setItems(reset ? data.items : [...items, ...data.items]);
        setTotal(data.total);
      } catch (e) {
        setError("Impossibile caricare il registro accessi.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line
    [token, applied, items.length]
  );

  useEffect(() => {
    load(true);
    // eslint-disable-next-line
  }, [token, applied]);

  // Aggiorna da solo ogni 30 secondi, così le nuove firme compaiono subito
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    const timer = setInterval(() => loadRef.current(true), 30000);
    return () => clearInterval(timer);
  }, []);

  const isoDay = (d) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const applyRange = (kind) => {
    const today = new Date();
    let from = isoDay(today);
    if (kind === "week") {
      const d = new Date(today);
      const dow = (d.getDay() + 6) % 7; // lunedì = 0
      d.setDate(d.getDate() - dow);
      from = isoDay(d);
    } else if (kind === "month") {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      from = isoDay(d);
    }
    const to = isoDay(today);
    setDateFrom(from);
    setDateTo(to);
    setApplied({ search: search.trim(), dateFrom: from, dateTo: to });
  };

  const downloadWord = async () => {
    try {
      const res = await fetch(`${API}/lab/access/export-docx?${params().toString()}`, { headers, credentials: "include" });
      if (!res.ok) throw new Error("export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "registro_accessi_laboratorio.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Impossibile scaricare il registro in Word.");
    }
  };

  const exportExcel = async () => {
    try {
      const res = await fetch(`${API}/lab/access/export?${params().toString()}`, { headers, credentials: "include" });
      if (!res.ok) throw new Error("export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "registro_accessi_laboratorio.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Impossibile esportare il registro accessi.");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Eliminare la riga di ${item.cognome} ${item.nome} del ${dateOf(item.entry_time)}?`)) return;
    try {
      const res = await fetch(`${API}/lab/access/${item.access_id}`, { method: "DELETE", headers, credentials: "include" });
      if (res.ok) load(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle style={{ fontFamily: "Work Sans" }}>
              <ClipboardCheck className="inline mr-2 h-5 w-5" />
              Registro accessi al laboratorio
            </CardTitle>
            <CardDescription>
              Ingressi e uscite firmati da chi entra in laboratorio. Il Word scaricato è il modulo del registro, già compilato.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadWord} className="bg-blue-600 hover:bg-blue-700" data-testid="export-word-btn">
              <FileText size={16} className="mr-2" />
              Scarica Word
            </Button>
            <Button variant="outline" onClick={exportExcel} data-testid="export-access-btn">
              <Download size={16} className="mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-col lg:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ search: search.trim(), dateFrom, dateTo });
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cerca per cognome, nome, classe o attività..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Dal
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            al
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
          <Button type="submit" variant="outline">Filtra</Button>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => applyRange("today")}>Oggi</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => applyRange("week")}>Settimana</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => applyRange("month")}>Mese</Button>
          </div>
          <Button type="button" variant="ghost" onClick={() => load(true)} title="Aggiorna">
            <RefreshCw size={16} />
          </Button>
        </form>

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <p className="text-sm text-slate-500">{total} {total === 1 ? "riga" : "righe"}</p>

        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Ingresso</TableHead>
                <TableHead>Uscita</TableHead>
                <TableHead>Attività svolta</TableHead>
                <TableHead>Firma</TableHead>
                {canDelete && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.access_id}>
                  <TableCell className="whitespace-nowrap text-sm">{dateOf(it.entry_time)}</TableCell>
                  <TableCell>{it.cognome}</TableCell>
                  <TableCell>{it.nome}</TableCell>
                  <TableCell>{it.class_name}</TableCell>
                  <TableCell>{timeOf(it.entry_time)}</TableCell>
                  <TableCell>
                    {it.exit_time ? (
                      timeOf(it.exit_time)
                    ) : it.exit_missing ? (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Non registrata</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Dentro</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-xs">{it.activity}</TableCell>
                  <TableCell className="text-xs text-slate-500">{it.signed_by}</TableCell>
                  {canDelete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => remove(it)}
                        title="Elimina riga"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canDelete ? 9 : 8} className="text-center text-slate-500 py-8">
                    Nessun accesso registrato.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {items.length < total && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => load(false)} disabled={loading}>
              {loading ? "Caricamento..." : `Carica altre (${total - items.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
