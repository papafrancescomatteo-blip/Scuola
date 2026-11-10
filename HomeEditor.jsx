import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Trash2, Plus, Upload, ExternalLink, UserRound } from "lucide-react";
import { API, resolveImage } from "../App";

export default function HomeEditor({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };
  const [team, setTeam] = useState([]);
  const [foto, setFoto] = useState([]);
  const [info, setInfo] = useState({ aula: "", sede: "", indirizzo: "", map_query: "", orari: "" });
  const [caption, setCaption] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch(`${API}/site`);
      if (res.ok) {
        const d = await res.json();
        setTeam(d.responsabili || []);
        setFoto(d.foto || []);
        setInfo((i) => ({ ...i, ...(d.info || {}) }));
      }
    } catch (e) { /* niente */ }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setError(""); setTimeout(() => setMsg(""), 4000); };
  const fail = (m) => { setError(m); setMsg(""); };

  const saveTeam = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/site/responsabili`, { method: "PUT", headers: jsonHeaders, credentials: "include", body: JSON.stringify({ items: team.map(({ name, role, photo }) => ({ name, role, photo })) }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return fail(typeof d.detail === "string" ? d.detail : "Salvataggio non riuscito");
      setTeam(d.responsabili);
      flash("Responsabili salvati: sono già visibili nella home.");
    } catch (e) { fail("Errore di connessione"); } finally { setBusy(false); }
  };

  const personPhoto = async (idx, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/site/person-photo`, { method: "POST", headers, credentials: "include", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return fail(typeof d.detail === "string" ? d.detail : "Foto non caricata");
      setTeam((t) => t.map((p, i) => (i === idx ? { ...p, photo: d.url } : p)));
    } catch (e) { fail("Errore di connessione"); }
  };

  const addPhoto = async (file) => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("caption", caption);
    try {
      const res = await fetch(`${API}/site/photos`, { method: "POST", headers, credentials: "include", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return fail(typeof d.detail === "string" ? d.detail : "Foto non caricata");
      setFoto((f) => [...f, d]);
      setCaption("");
      flash("Foto aggiunta alla home.");
    } catch (e) { fail("Errore di connessione"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const delPhoto = async (id) => {
    if (!window.confirm("Eliminare questa foto dalla home?")) return;
    const res = await fetch(`${API}/site/photos/${id}`, { method: "DELETE", headers, credentials: "include" });
    if (res.ok) setFoto((f) => f.filter((x) => x.photo_id !== id));
    else fail("Impossibile eliminare la foto");
  };

  const saveInfo = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/site/info`, { method: "PUT", headers: jsonHeaders, credentials: "include", body: JSON.stringify(info) });
      if (!res.ok) return fail("Salvataggio non riuscito");
      flash("Informazioni salvate.");
    } catch (e) { fail("Errore di connessione"); } finally { setBusy(false); }
  };

  const setP = (i, k, v) => setTeam((t) => t.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-600">Qui modifichi la pagina pubblica che si vede senza fare il login.</p>
        <Button variant="outline" asChild><a href="/" target="_blank" rel="noreferrer" data-testid="open-home"><ExternalLink size={16} className="mr-2" />Apri la home</a></Button>
      </div>
      {msg && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{msg}</div>}
      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: "Work Sans" }}>Responsabili e team</CardTitle>
          <CardDescription>Nome, ruolo e foto (facoltativa) di chi compare nella home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {team.map((p, i) => (
            <div key={p.id || i} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <label className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer" title="Cambia foto">
                {p.photo ? <img src={resolveImage(p.photo)} alt="" className="h-full w-full object-cover" /> : <UserRound className="text-slate-400" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => personPhoto(i, e.target.files?.[0])} />
              </label>
              <Input className="flex-1 min-w-[160px]" placeholder="Nome e cognome" value={p.name} onChange={(e) => setP(i, "name", e.target.value)} />
              <Input className="flex-1 min-w-[160px]" placeholder="Ruolo (es. Responsabile del laboratorio)" value={p.role} onChange={(e) => setP(i, "role", e.target.value)} />
              <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setTeam((t) => t.filter((_, j) => j !== i))} aria-label="Rimuovi"><Trash2 size={16} /></Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setTeam((t) => [...t, { id: `new_${Date.now()}`, name: "", role: "", photo: null }])} data-testid="team-add"><Plus size={16} className="mr-2" />Aggiungi persona</Button>
            <Button onClick={saveTeam} disabled={busy} className="bg-blue-600 hover:bg-blue-700" data-testid="team-save">Salva responsabili</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: "Work Sans" }}>Foto del laboratorio</CardTitle>
          <CardDescription>Compaiono nella home in una galleria. Puoi caricare foto dal telefono o dal computer (max 24).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="photo-caption">Didascalia (facoltativa)</Label>
              <Input id="photo-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Es. Il banco di misura" maxLength={140} />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" id="photo-file" onChange={(e) => addPhoto(e.target.files?.[0])} />
            <Button asChild disabled={busy} className="bg-blue-600 hover:bg-blue-700">
              <label htmlFor="photo-file" className="cursor-pointer" data-testid="photo-upload"><Upload size={16} className="mr-2" />Carica foto</label>
            </Button>
          </div>
          {foto.length === 0 ? (
            <p className="text-sm text-slate-500">Nessuna foto ancora: la sezione «Il laboratorio» comparirà nella home appena ne carichi una.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {foto.map((f) => (
                <div key={f.photo_id} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={resolveImage(f.url)} alt={f.caption || "Foto"} className="w-full aspect-[4/3] object-cover" />
                  {f.caption && <div className="px-2 py-1 text-xs text-slate-600 truncate">{f.caption}</div>}
                  <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow" onClick={() => delPhoto(f.photo_id)} aria-label="Elimina foto"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: "Work Sans" }}>Dove si trova</CardTitle>
          <CardDescription>Aula, sede e indirizzo mostrati nella home, con la mappa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Aula / laboratorio</Label><Input value={info.aula} onChange={(e) => setInfo({ ...info, aula: e.target.value })} placeholder="F.0.01 · MEC LAB" /></div>
            <div><Label>Sede</Label><Input value={info.sede} onChange={(e) => setInfo({ ...info, sede: e.target.value })} placeholder="ISIS A. Malignani, Udine" /></div>
            <div><Label>Indirizzo</Label><Input value={info.indirizzo} onChange={(e) => setInfo({ ...info, indirizzo: e.target.value })} placeholder="Via ..., Udine" /></div>
            <div><Label>Orari (facoltativo)</Label><Input value={info.orari} onChange={(e) => setInfo({ ...info, orari: e.target.value })} placeholder="Lun-Ven 8:00-14:00" /></div>
            <div className="md:col-span-2"><Label>Cosa cercare sulla mappa</Label><Input value={info.map_query} onChange={(e) => setInfo({ ...info, map_query: e.target.value })} placeholder="ISIS Arturo Malignani Udine" /></div>
          </div>
          <Button onClick={saveInfo} disabled={busy} className="bg-blue-600 hover:bg-blue-700" data-testid="info-save">Salva</Button>
        </CardContent>
      </Card>
    </div>
  );
}
