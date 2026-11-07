import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, Send, FileText, MessageCircle, Loader2 } from "lucide-react";
import { API } from "../App";

const NAVY = "#0B1530";
const fieldCls = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function Richiedi({ user }) {
  const [params] = useSearchParams();
  const [kind, setKind] = useState(params.get("tipo") === "info" ? "info" : "preventivo");
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "", message: "", website: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch(`${API}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = data.detail;
        setError(typeof d === "string" ? d : "Controlla i dati inseriti (la email deve essere corretta).");
      } else {
        setDone(true);
      }
    } catch (err) {
      setError("Errore di connessione. Riprova tra poco.");
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { id: "preventivo", label: "Preventivo", icon: FileText, hint: "Vuoi un sito come questo per il tuo laboratorio o la tua scuola?" },
    { id: "info", label: "Maggiori informazioni", icon: MessageCircle, hint: "Hai domande sul laboratorio o sul progetto?" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      <header style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-metrologia.svg" alt="Logo Metrologia Lab" className="h-9 w-9" />
            <span className="text-white font-bold" style={{ fontFamily: "Work Sans, sans-serif" }}>Metrologia Lab</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16} /> Home</Link>
            <Link to={user ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: "#F59E0B", color: NAVY }}>
              {user ? "Vai alla dashboard" : "Entra nel sito"} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {done ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center" data-testid="request-done">
            <CheckCircle size={64} className="mx-auto text-emerald-500 mb-5" />
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Work Sans, sans-serif" }}>Richiesta inviata!</h1>
            <p className="mt-3 text-lg text-slate-600">Grazie {form.name.split(" ")[0]}, abbiamo ricevuto il tuo messaggio. Ti risponderemo all'indirizzo <b>{form.email}</b>.</p>
            <Link to="/" className="inline-flex items-center gap-2 mt-8 rounded-full px-7 py-3 font-semibold text-white" style={{ background: NAVY }}>
              <ArrowLeft size={18} /> Torna alla home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "Work Sans, sans-serif" }}>Scrivici</h1>
            <p className="mt-2 text-lg text-slate-600">Compila il modulo: la tua richiesta arriva subito al laboratorio.</p>

            <div className="mt-8 grid sm:grid-cols-2 gap-3" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={kind === t.id}
                  onClick={() => setKind(t.id)}
                  data-testid={`kind-${t.id}`}
                  className={`text-left rounded-2xl border-2 p-4 transition-colors ${kind === t.id ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-2 font-bold" style={{ fontFamily: "Work Sans, sans-serif", color: kind === t.id ? "#1D4ED8" : "#0F172A" }}>
                    <t.icon size={20} /> {t.label}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{t.hint}</div>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Nome e cognome *</span>
                  <input className={fieldCls} value={form.name} onChange={set("name")} required maxLength={100} autoComplete="name" data-testid="req-name" />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Email *</span>
                  <input className={fieldCls} type="email" value={form.email} onChange={set("email")} required autoComplete="email" data-testid="req-email" />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Telefono <span className="font-normal text-slate-400">(facoltativo)</span></span>
                  <input className={fieldCls} type="tel" value={form.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Scuola o azienda <span className="font-normal text-slate-400">(facoltativo)</span></span>
                  <input className={fieldCls} value={form.organization} onChange={set("organization")} maxLength={120} autoComplete="organization" />
                </label>
              </div>
              <label className="block">
                <span className="block text-sm font-semibold mb-1.5">{kind === "preventivo" ? "Cosa ti serve? *" : "La tua domanda *"}</span>
                <textarea
                  className={fieldCls}
                  rows={6}
                  value={form.message}
                  onChange={set("message")}
                  required
                  maxLength={4000}
                  placeholder={kind === "preventivo" ? "Es. Vorremmo gestire gli strumenti del nostro laboratorio con un sito come questo..." : "Scrivi qui la tua domanda..."}
                  data-testid="req-message"
                />
              </label>

              {/* Campo trappola per i robot: le persone non lo vedono */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
                <label>Sito web<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label>
              </div>

              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700" role="alert">{error}</div>}

              <button
                type="submit"
                disabled={sending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white disabled:opacity-60"
                style={{ background: "#2563EB" }}
                data-testid="req-submit"
              >
                {sending ? <><Loader2 size={19} className="animate-spin" /> Invio in corso...</> : <><Send size={19} /> Invia la richiesta</>}
              </button>
              <p className="text-xs text-slate-500 text-center">Usiamo i tuoi dati solo per risponderti. Non li condividiamo con nessuno.</p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
