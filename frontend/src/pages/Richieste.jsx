import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import Sidebar from "../components/Sidebar";
import { API } from "../App";
import { Inbox, Mail, Phone, Building2, Trash2, RefreshCw, AlertTriangle, CheckCircle, FileText, MessageCircle } from "lucide-react";

const STATUS = {
  nuova: { label: "Nuova", cls: "bg-blue-100 text-blue-700" },
  in_corso: { label: "In corso", cls: "bg-amber-100 text-amber-700" },
  chiusa: { label: "Chiusa", cls: "bg-emerald-100 text-emerald-700" },
};

const fmt = (iso) =>
  new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

export default function Richieste({ user, token, logout }) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const jsonHeaders = useMemo(() => ({ ...headers, "Content-Type": "application/json" }), [headers]);
  const [data, setData] = useState({ items: [], counts: { nuova: 0, in_corso: 0, chiusa: 0 } });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/requests`, { headers, credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setNotes((n) => {
          const next = { ...n };
          d.items.forEach((r) => { if (next[r.request_id] === undefined) next[r.request_id] = r.note || ""; });
          return next;
        });
        setError("");
      } else setError("Impossibile caricare le richieste.");
    } catch (e) {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
      window.dispatchEvent(new Event("requests-changed"));
    }
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const update = async (id, body) => {
    setBusy(id);
    try {
      const res = await fetch(`${API}/requests/${id}`, { method: "PUT", headers: jsonHeaders, credentials: "include", body: JSON.stringify(body) });
      if (!res.ok) setError("Salvataggio non riuscito.");
      await load();
    } finally { setBusy(""); }
  };

  const resend = async (id) => {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`${API}/requests/${id}/resend`, { method: "POST", headers, credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(typeof d.detail === "string" ? `Email non inviata: ${d.detail}` : "Email non inviata.");
      }
      await load();
    } finally { setBusy(""); }
  };

  const remove = async (id) => {
    if (!window.confirm("Eliminare definitivamente questa richiesta?")) return;
    setBusy(id);
    try {
      await fetch(`${API}/requests/${id}`, { method: "DELETE", headers, credentials: "include" });
      await load();
    } finally { setBusy(""); }
  };

  const items = data.items.filter((r) => filter === "all" || r.status === filter);
  const failed = data.items.filter((r) => !r.email_sent).length;
  const total = data.items.length;
  const tabs = [["all", "Tutte", total], ["nuova", "Nuove", data.counts.nuova], ["in_corso", "In corso", data.counts.in_corso], ["chiusa", "Chiuse", data.counts.chiusa]];

  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="richieste" />
      <main className="main-content">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: "Work Sans" }}>Richieste</h1>
              <p className="text-slate-500 mt-1">Preventivi e richieste di informazioni arrivati dalla home pubblica</p>
            </div>
            <Button variant="outline" onClick={load} data-testid="req-refresh"><RefreshCw size={16} className="mr-2" />Aggiorna</Button>
          </div>

          {failed > 0 && (
            <div className="p-3 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{failed} {failed === 1 ? "richiesta non è stata inviata" : "richieste non sono state inviate"} per email, ma {failed === 1 ? "è salvata" : "sono salvate"} qui. Controlla la configurazione dell'invio email (guida: INVIO_EMAIL.md) e usa «Riprova invio».</span>
            </div>
          )}
          {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div className="flex flex-wrap gap-2 mb-5">
            {tabs.map(([id, label, n]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                data-testid={`req-filter-${id}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
              >
                {label} ({n || 0})
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-slate-500">Caricamento...</p>
          ) : items.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-slate-500">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              {total === 0 ? "Nessuna richiesta ricevuta per ora." : "Nessuna richiesta in questa categoria."}
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {items.map((r) => {
                const st = STATUS[r.status] || STATUS.nuova;
                const subject = encodeURIComponent(`Re: richiesta ${r.kind === "preventivo" ? "di preventivo" : "di informazioni"} - Laboratorio di Metrologia`);
                return (
                  <Card key={r.request_id} data-testid="req-card">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={`${r.kind === "preventivo" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"} hover:bg-opacity-100`}>
                          {r.kind === "preventivo" ? <FileText size={13} className="mr-1" /> : <MessageCircle size={13} className="mr-1" />}
                          {r.kind === "preventivo" ? "Preventivo" : "Informazioni"}
                        </Badge>
                        <Badge className={`${st.cls} hover:bg-opacity-100`}>{st.label}</Badge>
                        {r.email_sent
                          ? <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><CheckCircle size={13} />Email inviata</span>
                          : <span className="text-xs text-amber-700 inline-flex items-center gap-1"><AlertTriangle size={13} />Email non inviata</span>}
                        <span className="ml-auto text-xs text-slate-500">{fmt(r.created_at)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{r.name}</h3>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 mt-1">
                        <a className="inline-flex items-center gap-1.5 text-blue-600 hover:underline" href={`mailto:${r.email}?subject=${subject}`}><Mail size={14} />{r.email}</a>
                        {r.phone && <a className="inline-flex items-center gap-1.5" href={`tel:${r.phone}`}><Phone size={14} />{r.phone}</a>}
                        {r.organization && <span className="inline-flex items-center gap-1.5"><Building2 size={14} />{r.organization}</span>}
                      </div>
                      <p className="mt-3 p-3 rounded-lg bg-slate-50 text-slate-800 whitespace-pre-wrap text-[15px]">{r.message}</p>
                      {!r.email_sent && r.email_error && <p className="mt-2 text-xs text-amber-700">Motivo: {r.email_error}</p>}

                      <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-4 items-start">
                        <div>
                          <Textarea
                            rows={2}
                            placeholder="Nota interna (visibile solo a chi gestisce il sito)"
                            value={notes[r.request_id] ?? ""}
                            onChange={(e) => setNotes((n) => ({ ...n, [r.request_id]: e.target.value }))}
                          />
                          {(notes[r.request_id] ?? "") !== (r.note || "") && (
                            <Button size="sm" className="mt-2" disabled={busy === r.request_id} onClick={() => update(r.request_id, { note: notes[r.request_id] })}>Salva nota</Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {Object.entries(STATUS).filter(([k]) => k !== r.status).map(([k, v]) => (
                            <Button key={k} size="sm" variant="outline" disabled={busy === r.request_id} onClick={() => update(r.request_id, { status: k })} data-testid={`req-set-${k}`}>
                              Segna «{v.label.toLowerCase()}»
                            </Button>
                          ))}
                          <Button size="sm" variant="outline" asChild>
                            <a href={`mailto:${r.email}?subject=${subject}`}><Mail size={14} className="mr-1.5" />Rispondi</a>
                          </Button>
                          {!r.email_sent && (
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600" disabled={busy === r.request_id} onClick={() => resend(r.request_id)} data-testid="req-resend">Riprova invio</Button>
                          )}
                          {user?.role === "admin" && (
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" disabled={busy === r.request_id} onClick={() => remove(r.request_id)} aria-label="Elimina richiesta"><Trash2 size={16} /></Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
