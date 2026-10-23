import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Sidebar from "../components/Sidebar";
import { Search, Package, CheckCircle, Clock, Users, Activity, Barcode } from "lucide-react";
import { API } from "../App";

export default function Dashboard({ user, token, logout }) {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [instrumentsRes, statsRes, categoriesRes] = await Promise.all([
        fetch(`${API}/instruments`, { headers, credentials: "include" }),
        fetch(`${API}/stats`, { headers, credentials: "include" }),
        fetch(`${API}/categories`, { headers, credentials: "include" })
      ]);

      if (instrumentsRes.ok) {
        const data = await instrumentsRes.json();
        setInstruments(data);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filteredInstruments = instruments.filter((inst) => {
    const matchesSearch = 
      inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || inst.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
            <CheckCircle size={12} className="mr-1" />
            Disponibile
          </Badge>
        );
      case "in_use":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
            <Clock size={12} className="mr-1" />
            In uso
          </Badge>
        );
      case "maintenance":
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200">
            Manutenzione
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="dashboard" />
      
      <main className="main-content">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: 'Work Sans' }}>
                Dashboard
              </h1>
              <p className="text-slate-500 mt-1">
                Panoramica del laboratorio di metrologia
              </p>
            </div>
            <Button 
              onClick={() => navigate("/search")}
              className="bg-blue-600 hover:bg-blue-700 btn-animate"
              data-testid="search-barcode-btn"
            >
              <Barcode size={18} className="mr-2" />
              Cerca per Codice a Barre
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-hover" data-testid="stat-total-instruments">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Totale Strumenti</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {stats.total_instruments || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover" data-testid="stat-available">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-100">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Disponibili</p>
                    <p className="text-2xl font-semibold text-emerald-600">
                      {stats.available || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover" data-testid="stat-in-use">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-100">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">In Uso</p>
                    <p className="text-2xl font-semibold text-amber-600">
                      {stats.in_use || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover" data-testid="stat-movements">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Movimenti</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {stats.total_movements || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instruments Table */}
          <Card data-testid="instruments-table-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle style={{ fontFamily: 'Work Sans' }}>Elenco Strumenti</CardTitle>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cerca strumenti..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                      data-testid="search-input"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40" data-testid="status-filter">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="available">Disponibile</SelectItem>
                      <SelectItem value="in_use">In uso</SelectItem>
                      <SelectItem value="maintenance">Manutenzione</SelectItem>
                    </SelectContent>
                  </Select>

                  {categories.length > 0 && (
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-40" data-testid="category-filter">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              ) : filteredInstruments.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <Package className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">
                    Nessuno strumento trovato
                  </h3>
                  <p className="text-slate-500">
                    {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                      ? "Prova a modificare i filtri di ricerca"
                      : "Aggiungi il primo strumento dal pannello admin"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codice</TableHead>
                        <TableHead>Matricola</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Categoria</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInstruments.map((instrument) => (
                        <TableRow 
                          key={instrument.instrument_id}
                          className="table-row-hover cursor-pointer"
                          onClick={() => navigate(`/instrument/${instrument.instrument_id}`)}
                          data-testid={`instrument-row-${instrument.instrument_id}`}
                        >
                          <TableCell className="font-mono text-sm">
                            {instrument.barcode}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium text-blue-600">
                            {instrument.matricola || "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {instrument.name}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-slate-500">
                            {instrument.category || "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(instrument.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/instrument/${instrument.instrument_id}`);
                              }}
                              data-testid={`view-instrument-${instrument.instrument_id}`}
                            >
                              Dettagli
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile FAB */}
        <button
          className="fab md:hidden"
          onClick={() => navigate("/search")}
          data-testid="mobile-search-fab"
        >
          <Barcode size={24} />
        </button>
      </main>
    </div>
  );
}
