import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import "@/App.css";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import InstrumentDetail from "./pages/InstrumentDetail";
import AdminPanel from "./pages/AdminPanel";
import SearchPage from "./pages/SearchPage";

const configuredBackendUrl = process.env.REACT_APP_BACKEND_URL || "";
const BACKEND_URL = configuredBackendUrl
  ? `${/^https?:\/\//i.test(configuredBackendUrl) ? "" : "https://"}${configuredBackendUrl}`.replace(/\/+$/, "")
  : "";
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          const response = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
            credentials: "include"
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(savedToken);
          } else {
            localStorage.removeItem("token");
            setToken(null);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return { user, token, loading, login, logout, setUser };
};

// Protected Route
const ProtectedRoute = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin or Technician Route
const AdminRoute = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== "admin" && user.role !== "technician") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Auth Callback for Google OAuth
const AuthCallback = ({ login }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash;
    const sessionIdMatch = hash.match(/session_id=([^&]+)/);
    
    if (sessionIdMatch) {
      const sessionId = sessionIdMatch[1];
      
      fetch(`${API}/auth/google-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            login(data.user, data.token || "google-oauth");
            navigate("/dashboard", { replace: true, state: { user: data.user } });
          } else {
            navigate("/login", { replace: true });
          }
        })
        .catch(err => {
          console.error("OAuth callback error:", err);
          navigate("/login", { replace: true });
        });
    }
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-600">Autenticazione in corso...</p>
      </div>
    </div>
  );
};

// App Router Component
function AppRouter() {
  const { user, token, loading, login, logout, setUser } = useAuth();
  const location = useLocation();

  // Check for session_id in URL hash (Google OAuth callback)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback login={login} />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage login={login} />
        } 
      />
      <Route 
        path="/register" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <RegisterPage login={login} />
        } 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <Dashboard user={user} token={token} logout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <SearchPage user={user} token={token} logout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instrument/:id"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <InstrumentDetail user={user} token={token} logout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute user={user} loading={loading}>
            <AdminPanel user={user} token={token} logout={logout} />
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
