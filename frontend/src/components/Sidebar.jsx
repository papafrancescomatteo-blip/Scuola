import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { API } from "../App";
import { 
  LayoutDashboard, 
  Barcode, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  DoorClosed,
  ClipboardCheck
} from "lucide-react";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_lab-inventory-13/artifacts/qkvfmo8i_cropped-MALIGNANI_logo-ISIS-pittogramma.png";

export default function Sidebar({ user, logout, activePage }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Stato "dentro il laboratorio" (registro accessi)
  const [labEntry, setLabEntry] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitThenLogout, setExitThenLogout] = useState(false);
  const [exitSaving, setExitSaving] = useState(false);
  const [exitError, setExitError] = useState("");

  const labHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const loadLabStatus = async () => {
    try {
      const res = await fetch(`${API}/lab/status`, { headers: labHeaders(), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLabEntry(data.inside ? data.entry : null);
      }
    } catch (e) {
      /* niente */
    }
  };

  useEffect(() => {
    loadLabStatus();
    const onChange = () => loadLabStatus();
    window.addEventListener("lab-status-changed", onChange);
    return () => window.removeEventListener("lab-status-changed", onChange);
    // eslint-disable-next-line
  }, []);

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleLogout = async () => {
    if (labEntry) {
      setExitThenLogout(true);
      setExitError("");
      setExitOpen(true);
      return;
    }
    await doLogout();
  };

  const openExitDialog = () => {
    setExitThenLogout(false);
    setExitError("");
    setExitOpen(true);
  };

  const confirmExit = async () => {
    setExitSaving(true);
    setExitError("");
    try {
      const res = await fetch(`${API}/lab/exit`, { method: "POST", headers: labHeaders(), credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExitError(typeof data.detail === "string" ? data.detail : "Impossibile registrare l'uscita");
        return;
      }
      setLabEntry(null);
      setExitOpen(false);
      window.dispatchEvent(new Event("lab-status-changed"));
      if (exitThenLogout) await doLogout();
    } catch (e) {
      setExitError("Errore di connessione. Riprova.");
    } finally {
      setExitSaving(false);
    }
  };

  const navItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      path: "/dashboard" 
    },
    { 
      id: "search", 
      label: "Ricerca", 
      icon: Barcode, 
      path: "/search" 
    }
  ];

  if (user?.role === "admin" || user?.role === "technician") {
    navItems.push({
      id: "registro",
      label: "Registro accessi",
      icon: ClipboardCheck,
      path: "/registro-accessi"
    });
    navItems.push({ 
      id: "admin", 
      label: user?.role === "admin" ? "Amministrazione" : "Gestione Strumenti", 
      icon: Settings, 
      path: "/admin" 
    });
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={`p-4 border-b border-slate-700 ${collapsed ? 'flex justify-center' : ''}`}>
        <Link to="/dashboard" className="flex items-center gap-3">
          <img 
            src={SCHOOL_LOGO} 
            alt="ISIS Malignani" 
            className="h-10 w-10 object-contain"
          />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-semibold text-white" style={{ fontFamily: 'Work Sans' }}>
                ISIS Malignani
              </h1>
              <p className="text-xs text-slate-400">Metrologia Lab</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activePage === item.id
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            } ${collapsed ? 'justify-center' : ''}`}
            onClick={() => setMobileOpen(false)}
            data-testid={`nav-${item.id}`}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-4">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        
        {labEntry ? (
          <Button
            className={`w-full mb-2 bg-amber-500 hover:bg-amber-600 text-white ${collapsed ? 'px-2' : ''}`}
            onClick={openExitDialog}
            data-testid="lab-exit-btn"
          >
            <DoorClosed size={18} className={collapsed ? '' : 'mr-2'} />
            {!collapsed && "Uscita dal laboratorio"}
          </Button>
        ) : (
          <Button
            variant="outline"
            className={`w-full mb-2 bg-transparent border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 ${collapsed ? 'px-2' : ''}`}
            onClick={() => window.dispatchEvent(new Event("lab-open-entry"))}
            data-testid="lab-entry-btn"
          >
            <DoorOpen size={18} className={collapsed ? '' : 'mr-2'} />
            {!collapsed && "Ingresso in laboratorio"}
          </Button>
        )}

        <Button
          variant="ghost"
          className={`w-full text-slate-300 hover:text-white hover:bg-slate-700 ${collapsed ? 'px-2' : ''}`}
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut size={18} className={collapsed ? '' : 'mr-2'} />
          {!collapsed && "Esci"}
        </Button>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-slate-700 rounded-full items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        data-testid="mobile-menu-btn"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'open' : ''} relative`}
        data-testid="sidebar"
      >
        <NavContent />
      </aside>

      {/* Firma uscita dal laboratorio */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Work Sans' }}>Uscita dal laboratorio</DialogTitle>
            <DialogDescription>
              {labEntry
                ? `Sei entrato alle ${new Date(labEntry.entry_time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })} (${labEntry.activity}). Confermando firmi digitalmente l'uscita.`
                : "Confermando firmi digitalmente l'uscita."}
            </DialogDescription>
          </DialogHeader>
          {exitError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{exitError}</div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExitOpen(false)}>Annulla</Button>
            {exitThenLogout && (
              <Button variant="outline" onClick={doLogout} data-testid="logout-without-exit-btn">
                Esci senza firmare
              </Button>
            )}
            <Button
              onClick={confirmExit}
              disabled={exitSaving}
              className="bg-amber-500 hover:bg-amber-600"
              data-testid="confirm-exit-btn"
            >
              {exitSaving ? "Registrazione..." : exitThenLogout ? "Firma uscita ed esci dal sito" : "Conferma uscita e firma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
