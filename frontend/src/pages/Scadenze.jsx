import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { API } from "../App";
import { AlertTriangle, CheckCircle, CalendarClock, Clock, HelpCircle, ChevronRight } from "lucide-react";

const STATE = {
  expired:  { label: "Scaduta",     card: "border-red-200 bg-red-50",       text: "text-red-700",    badge: "bg-red-100 text-red-700 hover:bg-red-100",       icon: AlertTriangle },
  expiring: { label: "In scadenza", card: "border-amber-200 bg-amber-50",   text: "text-amber-700",  badge: "bg-amber-100 text-amber-800 hover:bg-amber-100", icon: Clock },
  ok:       { label: "Valida",      card: "border-green-200 bg-green-50",   text: "text-green-700",  badge: "bg-green-100 text-green-700 hover:bg-green-100", icon: CheckCircle },
  missing:  { label: "Senza data",  card: "border-slate-200 bg-slate-50",   text: "text-slate-600",  badge: "bg-slate-100 text-slate-600 hover:bg-slate-100", icon: HelpCircle },
};

const fmtDate = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = String(iso).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const leftText = (n) => {
  if (n === null || n === undefined) return "-";
  if (n < 0) return `scaduta da ${Math.abs(n)} ${Math.abs(n) === 1 ? "giorno" : "giorni"}`;
  if (n === 0) return "scade oggi";
  if (n === 1) return "scade domani";
  return `tra ${n} giorni`;
};

export default function Scadenze({ user, token, logout }) {
  const [days, setDays] = useState(30);
  const [filter, setFilter] = useState("attention"); // attention | all | expired | expiring | ok | missing
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/instruments/calibration-deadlines?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("http");
      setData(await res.json());
      setError("");
    } catch (e) {
      setError("Impossibile caricare le scadenze. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.items;
    if (filter === "attention") return data.items.filter((i) => i.state === "expired" || i.state === "expiring");
    return data.items.filter((i) => i.state === filter);
  }, [data, filter]);

  const summary = data?.summary || { expired: 0, expiring: 0, ok: 0, missing: 0 };
  const attention = summary.expired + summary.expiring;

  const Tile = ({ id, count, label }) => {
    const st = STATE[id];
    const Icon = st.icon;
    const active = filter === id;
    return (
      <button
        type="button"
        onClick={() => setFilter(filter === id ? "attention" : id)}
        className={`text-left rounded-xl border p-4 transition-shadow hover:shadow-md ${st.card} ${active ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
        data-testid={`scadenze-tile-${id}`}
      >
        <div className={`flex items-center gap-2 text-sm font-medium ${st.text}`}>
          <Icon size={16} /> {label}
        </div>
        <div className={`mt-1 text-3xl font-semibold ${st.text}`} style={{ fontFamily: "Work Sans" }}>{count}</div>
      </button>
    );
  };

  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="scadenze" />

      <main className="main-content">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: "Work Sans" }}>
                Scadenze tarature
              </h1>
              <p className="text-slate-500 mt-1">
                Strumenti con la taratura scaduta o in scadenza. Apri uno strumento per vedere l'errore trovato in taratura.
              </p>
            </div>
            <label className="text-sm text-slate-600 flex items-center gap-2">
              Avvisa entro
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                data-testid="scadenze-days"
              >
                {[15, 30, 60, 90, 180].map((d) => <option key={d} value={d}>{d} giorni</option>)}
              </select>
            </label>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {data && attention > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3" data-testid="scadenze-alert">
              <CalendarClock className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm">
                <strong>{attention} {attention === 1 ? "strumento richiede" : "strumenti richiedono"} attenzione</strong>
                {summary.expired > 0 && <>: {summary.expired} con taratura scaduta</>}
                {summary.expired > 0 && summary.expiring > 0 && <> e</>}
                {summary.expiring > 0 && <> {summary.expiring} in scadenza entro {data.warning_days} giorni</>}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Tile id="expired" count={summary.expired} label="Scadute" />
            <Tile id="expiring" count={summary.expiring} label={`In scadenza (${days} gg)`} />
            <Tile id="ok" count={summary.ok} label="Valide" />
            <Tile id="missing" count={summary.missing} label="Senza data" />
          </div>

          <div className="flex gap-2 mb-3 text-sm">
            {[["attention", "Da controllare"], ["all", "Tutti"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`px-3 py-1.5 rounded-full border ${filter === id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
                data-testid={`scadenze-filter-${id}`}
              >
                {label}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              {loading && !data ? (
                <p className="p-6 text-slate-500">Caricamento...</p>
              ) : items.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <CheckCircle className="mx-auto mb-2 text-green-600" size={28} />
                  {filter === "attention" ? "Nessuna taratura scaduta o in scadenza." : "Nessuno strumento in questa categoria."}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100" data-testid="scadenze-list">
                  {items.map((i) => {
                    const st = STATE[i.state];
                    return (
                      <li key={i.instrument_id}>
                        <Link
                          to={`/instrument/${i.instrument_id}`}
                          className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 hover:bg-slate-50"
                          data-testid={`scadenza-${i.instrument_id}`}
                        >
                          <div className="min-w-0 flex-1" style={{ minWidth: 220 }}>
                            <p className="font-medium text-slate-900 truncate">{i.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              Matricola {i.matricola}{i.category ? ` · ${i.category}` : ""}{i.location ? ` · ${i.location}` : ""}
                            </p>
                          </div>
                          <div className="text-sm" style={{ width: 110 }}>
                            <p className="text-xs uppercase tracking-wider text-slate-400">Scadenza</p>
                            <p className="font-medium text-slate-900">{fmtDate(i.calibration_expiry)}</p>
                          </div>
                          <div className="text-sm" style={{ width: 120 }}>
                            <p className="text-xs uppercase tracking-wider text-slate-400">Errore</p>
                            <p className="font-medium text-slate-900">
                              {i.calibration_error ? `${i.calibration_error} ${i.calibration_error_unit || ""}`.trim() : "-"}
                            </p>
                          </div>
                          <div className="text-sm text-right" style={{ width: 150 }}>
                            <Badge className={st.badge}>{st.label}</Badge>
                            <p className={`text-xs mt-1 ${st.text}`}>{leftText(i.days_left)}</p>
                          </div>
                          <ChevronRight size={18} className="text-slate-300" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
