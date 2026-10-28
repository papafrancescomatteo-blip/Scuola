import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Megaphone, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { API } from "../App";

export default function NewsManager({ token }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [important, setImportant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const res = await fetch(`${API}/news?limit=50`, { headers, credentials: "include" });
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [token]);

  const publish = async () => {
    setError("");
    setDone("");
    setSaving(true);
    try {
      const res = await fetch(`${API}/news`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, body, important })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.detail === "string" ? data.detail : "Impossibile pubblicare la news");
      } else {
        setTitle("");
        setBody("");
        setImportant(false);
        setDone("News pubblicata: compare nella home di tutti gli utenti.");
        load();
      }
    } catch (e) {
      setError("Errore di connessione. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Eliminare la news "${item.title}"?`)) return;
    try {
      const res = await fetch(`${API}/news/${item.news_id}`, {
        method: "DELETE",
        headers,
        credentials: "include"
      });
      if (res.ok) load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: "Work Sans" }}>
            <Megaphone className="inline mr-2 h-5 w-5" />
            Pubblica una news
          </CardTitle>
          <CardDescription>La news compare nella home (Dashboard) di tutti gli utenti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="news-title">Titolo</Label>
            <Input
              id="news-title"
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Laboratorio chiuso venerdì"
              data-testid="news-title-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="news-body">Testo</Label>
            <Textarea
              id="news-body"
              value={body}
              maxLength={3000}
              rows={4}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Scrivi il messaggio..."
              data-testid="news-body-input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            Segna come importante (evidenziata in giallo)
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="inline mr-2 h-4 w-4" />
              {error}
            </div>
          )}
          {done && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle className="inline mr-2 h-4 w-4" />
              {done}
            </div>
          )}

          <Button
            onClick={publish}
            disabled={saving || !title.trim() || !body.trim()}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="publish-news-btn"
          >
            {saving ? "Pubblicazione..." : "Pubblica news"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: "Work Sans" }}>News pubblicate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && <p className="text-sm text-slate-500">Nessuna news pubblicata.</p>}
          {items.map((item) => (
            <div
              key={item.news_id}
              className={`p-4 rounded-lg border ${item.important ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {item.title}{" "}
                    {item.important && <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-200 ml-1">Importante</Badge>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(item.created_at).toLocaleString("it-IT")} · {item.author_name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => remove(item)}
                  title="Elimina"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{item.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
