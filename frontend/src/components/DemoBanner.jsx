import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { API } from "../App";

// Fascia arancione visibile a tutti quando la modalità demo è attiva.
export default function DemoBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`${API}/demo/status`, { credentials: "include" });
        if (r.ok && !stop) setActive(!!(await r.json()).active);
      } catch (e) { /* niente */ }
    };
    load();
    const t = setInterval(load, 20000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  if (!active) return null;
  return (
    <div
      data-testid="demo-banner"
      style={{
        position: "fixed", left: "50%", bottom: 16, transform: "translateX(-50%)", zIndex: 9999,
        display: "flex", alignItems: "center", gap: 10, maxWidth: "calc(100vw - 24px)",
        background: "#f59e0b", color: "#1f1300", padding: "10px 18px", borderRadius: 999,
        boxShadow: "0 8px 30px rgba(0,0,0,.25)", fontSize: 14, fontWeight: 600,
      }}
    >
      <FlaskConical size={18} />
      <span><b>MODALITÀ DEMO</b> · prova pure tutto: le modifiche non vengono salvate</span>
    </div>
  );
}
