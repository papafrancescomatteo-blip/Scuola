import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Barcode, Camera, CreditCard, ClipboardCheck, Printer, ShieldCheck, MapPin, Mail, Ruler, Users, Clock, ExternalLink,
} from "lucide-react";
import { API, resolveImage } from "../App";

const NAVY = "#0B1530";
const FAMILIES = ["Micrometri", "Calibri", "Comparatori", "Goniometri", "Blocchetti di riscontro", "Livelle", "Truschini", "Squadrette", "Righe di controllo", "Dischi"];
const FEATURES = [
  { icon: Barcode, title: "Inventario e ricerca", text: "Ogni strumento ha il suo codice: lo trovi per nome, matricola, marca o famiglia.", color: "#2563EB" },
  { icon: Camera, title: "Scansione con il telefono", text: "Inquadri il codice a barre e si apre subito la scheda dello strumento.", color: "#0EA5E9" },
  { icon: CreditCard, title: "Accesso con la tessera", text: "Basta passare il badge sul lettore NFC per entrare nel sito.", color: "#7C3AED" },
  { icon: ClipboardCheck, title: "Registro accessi digitale", text: "Ingressi e uscite si firmano dal sito e il registro si scarica già in Word.", color: "#F59E0B" },
  { icon: Printer, title: "Magazzino filamenti 3D", text: "Bobine chiuse e aperte, scorta minima e lista di riordino in Excel.", color: "#10B981" },
  { icon: ShieldCheck, title: "Tutto tracciato", text: "Chi ha preso cosa e quando: ogni azione finisce nel registro eventi.", color: "#F43F5E" },
];
const SHOTS = [
  { src: "/img/sito-dashboard.jpg", title: "Dashboard", text: "Numeri in tempo reale e tutti gli strumenti, divisi per famiglia." },
  { src: "/img/sito-ricerca.jpg", title: "Ricerca per codice", text: "Fotocamera, lettore o codice scritto a mano." },
  { src: "/img/sito-gestione.jpg", title: "Gestione strumenti", text: "Famiglia, marca e importazione da Excel." },
];

const initials = (n) => (n || "").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

export default function Home({ user }) {
  const [site, setSite] = useState(null);

  useEffect(() => {
    fetch(`${API}/site`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSite(d))
      .catch(() => {});
  }, []);

  const enterTo = user ? "/dashboard" : "/login";
  const enterLabel = user ? "Vai alla dashboard" : "Entra nel sito";
  const info = site?.info || { aula: "F.0.01 · MEC LAB", sede: "ISIS A. Malignani, Udine", indirizzo: "", map_query: "ISIS Arturo Malignani Udine", orari: "" };
  const team = site?.responsabili || [];
  const foto = site?.foto || [];
  const strumenti = site?.stats?.strumenti;
  const [aulaCode, ...aulaRest] = (info.aula || "").split(/\s*[·\-–]\s*/);

  const EnterBtn = ({ className = "", big = false }) => (
    <Link
      to={enterTo}
      data-testid="enter-site-btn"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ${big ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm"} ${className}`}
      style={{ background: "#F59E0B", color: NAVY }}
    >
      {enterLabel} <ArrowRight size={big ? 20 : 17} />
    </Link>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Barra in alto, con il tasto per entrare nel sito */}
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background: "rgba(11,21,48,.94)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <a href="#top" className="flex items-center gap-3 shrink-0">
            <img src="/logo-metrologia.svg" alt="Logo Metrologia Lab" className="h-9 w-9" />
            <div className="leading-tight hidden sm:block">
              <div className="text-white font-bold" style={{ fontFamily: "Work Sans, sans-serif" }}>Metrologia Lab</div>
              <div className="text-[11px] text-slate-400">ISIS Malignani · Udine</div>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-6 ml-8 text-sm text-slate-300">
            <a href="#laboratorio" className="hover:text-white">Il laboratorio</a>
            <a href="#sito" className="hover:text-white">Il sito</a>
            <a href="#team" className="hover:text-white">Chi siamo</a>
            <a href="#dove" className="hover:text-white">Dove siamo</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/richiedi" className="hidden md:inline text-sm font-medium text-slate-200 hover:text-white" data-testid="nav-richiedi">Preventivi e info</Link>
            <EnterBtn />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #14275e 60%, #1E40AF 100%)` }}>
        <svg className="absolute -right-40 -top-40 opacity-[.07]" width="900" height="900" viewBox="0 0 512 512" aria-hidden="true">
          {Array.from({ length: 37 }).map((_, i) => {
            const a = ((135 + (270 * i) / 36) * Math.PI) / 180;
            const maj = i % 6 === 0;
            const r1 = 240, r2 = r1 - (maj ? 46 : 26);
            return <line key={i} x1={256 + r1 * Math.cos(a)} y1={256 + r1 * Math.sin(a)} x2={256 + r2 * Math.cos(a)} y2={256 + r2 * Math.sin(a)} stroke="#fff" strokeWidth={maj ? 12 : 7} strokeLinecap="round" />;
          })}
        </svg>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.25fr_1fr] gap-12 items-center">
          <div>
            <div className="text-xs font-semibold tracking-[.25em] text-sky-300 mb-5">ISIS A. MALIGNANI · UDINE</div>
            <h1 className="text-white font-extrabold leading-[1.05] text-5xl sm:text-6xl" style={{ fontFamily: "Work Sans, sans-serif", letterSpacing: "-0.02em" }}>
              Laboratorio di<br />Metrologia
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl">
              Dove la misura diventa precisione. Strumenti, accessi e materiali del laboratorio, gestiti in un unico sito, online da qualsiasi dispositivo.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <EnterBtn big />
              <Link to="/richiedi" className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors" data-testid="hero-richiedi">
                <Mail size={19} /> Richiedi un preventivo
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-300">
              {strumenti > 0 && <span><b className="text-white text-xl" style={{ fontFamily: "Work Sans" }}>{strumenti}</b> strumenti catalogati</span>}
              <span><b className="text-white text-xl" style={{ fontFamily: "Work Sans" }}>3</b> ruoli utente</span>
              <span><b className="text-white text-xl" style={{ fontFamily: "Work Sans" }}>NFC</b> accesso con tessera</span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <img src="/logo-metrologia.svg" alt="" className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-2xl" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold shadow-lg" style={{ background: "#fff", color: NAVY }}>
                <MapPin size={15} className="inline -mt-0.5 mr-1.5 text-blue-600" />{info.aula}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cos'è */}
      <section id="laboratorio" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-12 items-start">
        <div>
          <div className="text-xs font-semibold tracking-[.2em] text-blue-600 mb-3">IL LABORATORIO</div>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "Work Sans, sans-serif" }}>Cos'è il Laboratorio di Metrologia</h2>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed">
            La metrologia è la scienza della misura. Nel nostro laboratorio gli studenti imparano a misurare con precisione pezzi meccanici, usando strumenti come micrometri, calibri e comparatori, e a prendersene cura nel tempo.
          </p>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Per tenere in ordine tutta l'attrezzatura abbiamo costruito un sito: sai sempre dov'è ogni strumento, chi lo ha preso e quando va controllato.
          </p>
        </div>
        <div className="rounded-3xl p-7 sm:p-8" style={{ background: "#F1F5F9" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "#2563EB" }}><Ruler size={20} color="#fff" /></div>
            <h3 className="text-xl font-bold" style={{ fontFamily: "Work Sans, sans-serif" }}>Gli strumenti che trovi</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {FAMILIES.map((f) => (
              <span key={f} className="px-3.5 py-1.5 rounded-full bg-white text-sm font-medium text-slate-700 shadow-sm border border-slate-200">{f}</span>
            ))}
            <span className="px-3.5 py-1.5 rounded-full text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100">e molti altri…</span>
          </div>
        </div>
      </section>

      {/* Il sito */}
      <section id="sito" style={{ background: "#F8FAFC" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-xs font-semibold tracking-[.2em] text-blue-600 mb-3">IL SITO</div>
          <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl" style={{ fontFamily: "Work Sans, sans-serif" }}>Tutto il laboratorio in un solo sito</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4" style={{ background: f.color }}><f.icon size={22} color="#fff" /></div>
                <h3 className="text-lg font-bold mb-1.5" style={{ fontFamily: "Work Sans, sans-serif" }}>{f.title}</h3>
                <p className="text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {SHOTS.map((s) => (
              <figure key={s.src} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <img src={s.src} alt={`Schermata: ${s.title}`} loading="lazy" className="w-full aspect-[16/10] object-cover object-left-top border-b border-slate-200" />
                <figcaption className="p-4">
                  <div className="font-bold" style={{ fontFamily: "Work Sans, sans-serif" }}>{s.title}</div>
                  <div className="text-sm text-slate-600">{s.text}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 flex justify-center"><EnterBtn big /></div>
        </div>
      </section>

      {/* Foto del laboratorio (compaiono solo se caricate dal pannello Amministrazione) */}
      {foto.length > 0 && (
        <section id="foto" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-xs font-semibold tracking-[.2em] text-blue-600 mb-3">LE FOTO</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-10" style={{ fontFamily: "Work Sans, sans-serif" }}>Il laboratorio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {foto.map((f, i) => (
              <figure key={f.photo_id} className={`relative overflow-hidden rounded-2xl bg-slate-100 ${i === 0 && foto.length > 2 ? "col-span-2 row-span-2" : ""}`}>
                <img src={resolveImage(f.url)} alt={f.caption || "Foto del laboratorio"} loading="lazy" className="w-full h-full object-cover aspect-[4/3]" style={i === 0 && foto.length > 2 ? { aspectRatio: "auto", minHeight: "100%" } : undefined} />
                {f.caption && <figcaption className="absolute left-0 right-0 bottom-0 p-3 text-sm text-white" style={{ background: "linear-gradient(transparent, rgba(11,21,48,.85))" }}>{f.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section id="team" style={{ background: foto.length > 0 ? "#F8FAFC" : "#fff" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="text-xs font-semibold tracking-[.2em] text-blue-600 mb-3">CHI SIAMO</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-10" style={{ fontFamily: "Work Sans, sans-serif" }}><Users className="inline -mt-1.5 mr-2 text-blue-600" size={32} />Responsabili e team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {team.map((p) => (
                <div key={p.id} className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  {p.photo ? (
                    <img src={resolveImage(p.photo)} alt={p.name} className="h-16 w-16 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,#2563EB,#0B1530)" }}>{initials(p.name)}</div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-lg leading-tight" style={{ fontFamily: "Work Sans, sans-serif" }}>{p.name}</div>
                    {p.role && <div className="text-sm text-slate-500 mt-0.5">{p.role}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dove siamo */}
      <section id="dove" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-xs font-semibold tracking-[.2em] text-blue-600 mb-3">DOVE SIAMO</div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-10" style={{ fontFamily: "Work Sans, sans-serif" }}>Vieni a trovarci</h2>
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
          <div className="rounded-3xl p-8 text-white flex flex-col justify-between" style={{ background: `linear-gradient(135deg, ${NAVY}, #1E40AF)` }}>
            <div>
              <div className="text-xs tracking-[.25em] text-sky-300 font-semibold mb-3">AULA</div>
              <div className="text-6xl sm:text-7xl font-extrabold leading-none" style={{ fontFamily: "Work Sans, sans-serif" }} data-testid="aula-code">{aulaCode}</div>
              {aulaRest.length > 0 && <div className="mt-2 text-2xl font-semibold text-amber-400">{aulaRest.join(" · ")}</div>}
            </div>
            <div className="mt-8 space-y-2 text-slate-200">
              <div className="flex gap-2"><MapPin size={18} className="mt-1 shrink-0 text-sky-300" /><span>{info.sede}{info.indirizzo ? <><br />{info.indirizzo}</> : null}</span></div>
              {info.orari && <div className="flex gap-2"><Clock size={18} className="mt-1 shrink-0 text-sky-300" /><span>{info.orari}</span></div>}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.map_query || info.sede)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-white underline underline-offset-4">
                Apri in Google Maps <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-slate-200 min-h-[320px] bg-slate-100">
            <iframe title="Mappa" className="w-full h-full min-h-[320px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(info.map_query || info.sede)}&output=embed`} />
          </div>
        </div>
      </section>

      {/* Richieste */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E40AF 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "Work Sans, sans-serif" }}>Ti interessa il progetto?</h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Vuoi un sito così per il tuo laboratorio o la tua scuola? Chiedici un preventivo o più informazioni: ti rispondiamo via email.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/richiedi?tipo=preventivo" className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold" style={{ background: "#F59E0B", color: NAVY }} data-testid="cta-preventivo">
              Richiedi un preventivo <ArrowRight size={19} />
            </Link>
            <Link to="/richiedi?tipo=info" className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white border border-white/30 hover:bg-white/10" data-testid="cta-info">
              Chiedi maggiori informazioni
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-1"><img src="/logo-metrologia.svg" alt="" className="h-6 w-6" /><b className="text-slate-700">Laboratorio di Metrologia</b></div>
        ISIS A. Malignani · Udine · Sito realizzato da Francesco Matteo Papa, David Giacuzzo e Federico Busato
      </footer>
    </div>
  );
}
