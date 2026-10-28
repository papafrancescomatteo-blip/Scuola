import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollText, Download, Search, RefreshCw } from "lucide-react";
import { API } from "../App";

const CATEGORIES = [
  ["all", "Tutte le categorie"],
  ["accessi", "Accessi"],
  ["strumenti", "Strumenti"],
  ["movimenti", "Prelievi e depositi"],
  ["destinazioni", "Destinazioni"],
  ["utenti", "Utenti e tessere"],
  ["news", "News"],
  ["registro", "Registro"]
];

const PAGE = 100;

const categoryColor = (c) => {
  switch (c) {
    case "accessi": return "bg-blue-100 text-blue-700";
    case "strumenti": return "bg-emerald-100 text-emerald-700";
    case "movimenti": return "bg-amber-100 text-amber-700";
    case "destinazioni": return "bg-purple-100 text-purple-700";
    case "utenti": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

export default function LogsViewer({ token }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const buildQuery = (skip) => {
    const params = new URLSearchParams();
    if (appliedSearch) params.set("search", appliedSearch);
    if (category !== "all") params.set("category", category);
    params.set("limit", String(PAGE));
    params.set("skip", String(skip));
    return params.toString();
  };

  const load = useCallback(
    async (reset = true) => {
      setLoading(true);
      setError("");
      try {
        const skip = reset ? 0 : items.length;
        const res = await fetch(`${API}/logs?${buildQuery(skip)}`, { headers, credentials: "include" });
        if (!res.ok) throw new Error("load");
        const data = await res.json();
        setItems(reset ? data.items : [...items, ...data.items]);
        setTotal(data.total);
      } catch (e) {
        setError("Impossibile caricare il registro.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line
    [token, appliedSearch, category, items.length]
  );

  useEffect(() => {
    load(true);
    // eslint-disable-next-line
  }, [token, appliedSearch, category]);

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.set("search", appliedSearch);
      if (category !== "all") params.set("category", category);
      const res = await fetch(`${API}/logs/export?${params.toString()}`, { headers, credentials: "include" });
      if (!res.ok) throw new Error("export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "registro_attivita.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Impossibile esportare il registro.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle style={{ fontFamily: "Work Sans" }}>
              <ScrollText className="inline mr-2 h-5 w-5" />
              Registro attività
            </CardTitle>
            <CardDescription>
              Tutto quello che succede nel sito: accessi, strumenti, prelievi, utenti, news. Sola lettura.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={exportExcel} data-testid="export-logs-btn">
            <Download size={16} className="mr-2" />
            Esporta Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form
            className="relative flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedSearch(search.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cerca per persona, azione o dettaglio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="logs-search-input"
              />
            </div>
            <Button type="submit" variant="outline">Cerca</Button>
          </form>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => load(true)} title="Aggiorna">
            <RefreshCw size={16} />
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <p className="text-sm text-slate-500">
          {total} {total === 1 ? "registrazione" : "registrazioni"}
        </p>

        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data e ora</TableHead>
                <TableHead>Utente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Azione</TableHead>
                <TableHead>Dettagli</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.log_id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(it.timestamp).toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {it.user_name || "-"}
                    {it.user_email && <div className="text-xs text-slate-400">{it.user_email}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${categoryColor(it.category)} hover:${categoryColor(it.category).split(" ")[0]}`}>
                      {it.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{it.action}</TableCell>
                  <TableCell className="text-sm text-slate-600">{it.details}</TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    Nessuna registrazione trovata.
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
