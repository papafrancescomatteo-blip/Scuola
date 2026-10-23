import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  Barcode, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_lab-inventory-13/artifacts/qkvfmo8i_cropped-MALIGNANI_logo-ISIS-pittogramma.png";

export default function Sidebar({ user, logout, activePage }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
    </>
  );
}
