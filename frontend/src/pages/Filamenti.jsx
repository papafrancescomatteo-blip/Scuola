import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import Sidebar from "../components/Sidebar";
import { API } from "../App";
import {
  Plus, Search, Printer, PackageCheck, PackageOpen, AlertTriangle, Download, Trash2, Pencil, ChevronDown, ChevronUp, CheckCircle,
} from "lucide-react";

const EMPTY_FORM = { material: "", color_name: "", color_hex: "#3b82f6", spool_size_g: 1000, min_stock: 1, brand: "Bambu Lab", sealed_count: 1 };

export default function Filamenti({ user, token, logout }) {
  const canEdit = user?.role === "admin" || user?.role === "technician";
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const jsonHeaders = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  const [data, setData] = useState({ products: [], summary: {} });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all"); // all | reorder
  const [group, setGroup] = useState("all");
  const [expanded, setExpanded] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API}/filaments`, { headers, credentials: "include" }),
        fetch(`${API}/filaments/catalog`, { headers, credentials: "include" }),
      ]);
      if (r1.ok) setData(await r1.json());
      if (r2.ok) setCatalog(await r2.json());
      setError("");
    } catch (e) {
      setError("Impossibile caricare i filamenti. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const call = async (url, method, body) => {
    const res = await fetch(`${API}${url}`, {
      method, headers: jsonHeaders, credentials: "include", body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(typeof d.detail === "string" ? d.detail : "Operazione non riuscita");
    }
    return res.json().catch(() => ({}));
  };
  const run = async (fn) => {
    try { await fn(); await load(); } catch (e) { setError(e.message); }
  };

  const groupOf = (material) => {
    const g = catalog.find((c) => c.materials.includes(material));
    return g ? g.group : "Altro";
  };

  const products = data.products.filter((p) => {
    const q = search.toLowerCase();
    const okSearch = !q || p.material.toLowerCase().includes(q) || p.color_name.toLowerCase().includes(q);
    const okView = view === "all" || p.low;
    const okGroup = group === "all" || groupOf(p.material) === group;
    return okSearch && okView && okGroup;
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...EMPTY_FORM, material: p.material, color_name: p.color_name, color_hex: p.color_hex || "#9ca3af", spool_size_g: p.spool_size_g, min_stock: p.min_stock, brand: p.brand || "Bambu Lab", sealed_count: 0 });
    setFormError("");
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError("");
    try {
      const body = {
        material: form.material, color_name: form.color_name, color_hex: form.color_hex, brand: form.brand,
        spool_size_g: Number(form.spool_size_g) || 1000, min_stock: Number(form.min_stock) || 0,
      };
      if (editing) {
        await call(`/filaments/${editing.product_id}`, "PUT", body);
      } else {
        const created = await call("/filaments", "POST", body);
        const n = Number(form.sealed_count) || 0;
        if (n > 0) await call(`/filaments/${created.product_id}/spools`, "POST", { count: n, state: "sealed" });
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const exportXlsx = async (onlyReorder) => {
    const res = await fetch(`${API}/filaments/export/xlsx?only_reorder=${onlyReorder}`, { headers, credentials: "include" });
    if (!res.ok) { setError("Esportazione non riuscita"); return; }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = onlyReorder ? "filamenti_da_riordinare.xlsx" : "magazzino_filamenti.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const openOne = (p) => {
    const sealed = p.spools.find((s) => s.state === "sealed");
    if (sealed) run(() => call(`/filaments/spools/${sealed.spool_id}`, "PUT", { state: "open" }));
  };

  const summary = data.summary || {};
  const cards = [
    { label: "Filamenti", value: summary.products, icon: Printer, bg: "bg-blue-100", fg: "text-blue-600" },
    { label: "Bobine chiuse", value: summary.sealed, icon: PackageCheck, bg: "bg-emerald-100", fg: "text-emerald-600" },
    { label: "Bobine aperte", value: summary.open, icon: PackageOpen, bg: "bg-amber-100", fg: "text-amber-600" },
    { label: "Da riordinare", value: summary.to_reorder, icon: AlertTriangle, bg: "bg-rose-100", fg: "text-rose-600" },
  ];

  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="filamenti" />
      <main className="main-content">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: "Work Sans" }}>Filamenti 3D</h1>
              <p className="text-slate-500 mt-1">Magazzino filamenti Bambu Lab: bobine chiuse, aperte e riordino</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportXlsx(false)} data-testid="fil-export-all"><Download size={16} className="mr-2" />Esporta Excel</Button>
              <Button variant="outline" onClick={() => exportXlsx(true)} data-testid="fil-export-reorder"><Download size={16} className="mr-2" />Lista riordino</Button>
              {canEdit && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={openNew} data-testid="fil-add-btn"><Plus size={16} className="mr-2" />Nuovo filamento</Button>
              )}
            </div>
          </div>

          {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`h-5 w-5 ${c.fg}`} /></div>
                  <div>
                    <p className="text-xs text-slate-500">{c.label}</p>
                    <p className="text-xl font-semibold text-slate-900 leading-tight">{c.value || 0}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
              {[["all", "Tutti"], ["reorder", `Da riordinare (${summary.to_reorder || 0})`]].map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} data-testid={`fil-view-${k}`}
                  className={`px-4 py-2 text-sm ${view === k ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{l}</button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cerca materiale o colore..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" data-testid="fil-search" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {["all", ...catalog.map((c) => c.group)].map((g) => (
              <button key={g} onClick={() => setGroup(g)}
                className={`px-3 py-1.5 rounded-full text-sm border ${group === g ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
                {g === "all" ? "Tutte le famiglie" : g}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
          ) : products.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-slate-500">
              {data.products.length === 0
                ? (canEdit ? "Nessun filamento. Aggiungi il primo con “Nuovo filamento”." : "Nessun filamento in magazzino.")
                : "Nessun filamento corrisponde ai filtri."}
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {products.map((p) => {
                const open = !!expanded[p.product_id];
                return (
                  <Card key={p.product_id} className={p.low ? "border-rose-300" : ""} data-testid={`fil-card-${p.product_id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full border-2 border-white shadow ring-1 ring-slate-300 shrink-0" style={{ background: p.color_hex || "#e2e8f0" }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{p.material}</p>
                          <p className="text-sm text-slate-500 truncate">{p.color_name} · {p.brand} · {p.spool_size_g} g</p>
                        </div>
                        {p.low ? (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Riordina {p.to_reorder}</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle size={12} className="mr-1" />OK</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="rounded-lg bg-emerald-50 py-2"><p className="text-xl font-semibold text-emerald-700">{p.sealed}</p><p className="text-xs text-slate-500">Chiuse</p></div>
                        <div className="rounded-lg bg-amber-50 py-2"><p className="text-xl font-semibold text-amber-700">{p.open}</p><p className="text-xs text-slate-500">Aperte</p></div>
                        <div className="rounded-lg bg-slate-50 py-2"><p className="text-xl font-semibold text-slate-700">{(p.total_g / 1000).toFixed(2)} kg</p><p className="text-xs text-slate-500">Totale · min {p.min_stock}</p></div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {canEdit && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => run(() => call(`/filaments/${p.product_id}/spools`, "POST", { count: 1, state: "sealed" }))} data-testid={`fil-add-sealed-${p.product_id}`}>
                              <Plus size={14} className="mr-1" />Bobina chiusa
                            </Button>
                            <Button size="sm" variant="outline" disabled={p.sealed === 0} onClick={() => openOne(p)} data-testid={`fil-open-${p.product_id}`}>
                              <PackageOpen size={14} className="mr-1" />Apri una bobina
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(p)}><Trash2 size={14} /></Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setExpanded({ ...expanded, [p.product_id]: !open })}>
                          Bobine ({p.spools.length}) {open ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                        </Button>
                      </div>

                      {open && (
                        <div className="mt-3 space-y-2">
                          {p.spools.length === 0 && <p className="text-sm text-slate-400">Nessuna bobina.</p>}
                          {p.spools.map((s) => (
                            <div key={s.spool_id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-200 text-sm">
                              <Badge className={s.state === "sealed" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                                {s.state === "sealed" ? "Chiusa" : "Aperta"}
                              </Badge>
                              {s.state === "open" ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-24 h-2 rounded bg-slate-200 overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, Math.round(((s.remaining_g || 0) / (p.spool_size_g || 1000)) * 100))}%` }} />
                                  </div>
                                  {canEdit ? (
                                    <Input type="number" min="0" defaultValue={s.remaining_g} className="h-8 w-20"
                                      onBlur={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v !== s.remaining_g) run(() => call(`/filaments/spools/${s.spool_id}`, "PUT", { remaining_g: v })); }} />
                                  ) : <span>{s.remaining_g}</span>}
                                  <span className="text-slate-500">g</span>
                                </div>
                              ) : <span className="text-slate-500">{p.spool_size_g} g sigillata</span>}
                              {s.location && <span className="text-slate-400">· {s.location}</span>}
                              {canEdit && (
                                <div className="ml-auto flex gap-1">
                                  {s.state === "sealed" && <Button size="sm" variant="ghost" onClick={() => run(() => call(`/filaments/spools/${s.spool_id}`, "PUT", { state: "open" }))}>Apri</Button>}
                                  {s.state === "open" && <Button size="sm" variant="ghost" onClick={() => run(() => call(`/filaments/spools/${s.spool_id}`, "PUT", { state: "finished" }))}>Finita</Button>}
                                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => run(() => call(`/filaments/spools/${s.spool_id}`, "DELETE"))}><Trash2 size={14} /></Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Work Sans" }}>{editing ? "Modifica filamento" : "Nuovo filamento"}</DialogTitle>
            <DialogDescription>Scegli il materiale dal catalogo Bambu Lab (o scrivine uno) e il colore.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fil-material">Materiale</Label>
              <Input id="fil-material" list="fil-materials" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="PLA Basic" data-testid="fil-material-input" />
              <datalist id="fil-materials">
                {catalog.flatMap((c) => c.materials).map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <Label htmlFor="fil-color">Colore</Label>
                <Input id="fil-color" value={form.color_name} onChange={(e) => setForm({ ...form, color_name: e.target.value })} placeholder="Nero, Bianco, Rosso..." data-testid="fil-color-input" />
              </div>
              <input type="color" value={form.color_hex || "#9ca3af"} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} className="h-10 w-14 rounded border border-slate-200" aria-label="Tinta" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Bobina (g)</Label><Input type="number" min="100" value={form.spool_size_g} onChange={(e) => setForm({ ...form, spool_size_g: e.target.value })} /></div>
              <div className="space-y-2"><Label>Scorta minima</Label><Input type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} data-testid="fil-min-input" /></div>
              {!editing && <div className="space-y-2"><Label>Chiuse ora</Label><Input type="number" min="0" value={form.sealed_count} onChange={(e) => setForm({ ...form, sealed_count: e.target.value })} data-testid="fil-count-input" /></div>}
            </div>
            <p className="text-xs text-slate-500">La scorta minima è il numero di bobine chiuse da tenere sempre in magazzino: sotto quel numero il filamento finisce in “Da riordinare”.</p>
            {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
            <Button onClick={save} disabled={saving || !form.material.trim() || !form.color_name.trim()} className="bg-blue-600 hover:bg-blue-700" data-testid="fil-save-btn">{saving ? "Salvataggio..." : "Salva"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Eliminare il filamento?</DialogTitle>
            <DialogDescription>{toDelete ? `${toDelete.material} – ${toDelete.color_name}` : ""} e tutte le sue bobine verranno rimossi.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)}>Annulla</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={async () => { const p = toDelete; setToDelete(null); await run(() => call(`/filaments/${p.product_id}`, "DELETE")); }}>Elimina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
