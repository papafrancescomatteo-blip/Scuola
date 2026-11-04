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
import { Search, Package, CheckCircle, Clock, Activity, Barcode, Megaphone, ChevronLeft, ChevronRight, Layers } from "lucide-react";
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
  const [news, setNews] = useState([]);
  const [showAllNews, setShowAllNews] = useState(false);
  const [families, setFamilies] = useState({ families: [], without_family: 0 });
  const [familyFilter, setFamilyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      fetch(`${API}/news?limit=5`, { headers, credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then(setNews)
        .catch(() => {});

      fetch(`${API}/families`, { headers, credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setFamilies(d))
        .catch(() => {});

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
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      inst.name?.toLowerCase().includes(q) ||
      inst.barcode?.toLowerCase().includes(q) ||
      inst.matricola?.toLowerCase().includes(q) ||
      inst.brand?.toLowerCase().includes(q) ||
      inst.family?.toLowerCase().includes(q) ||
      inst.description?.toLowerCase().includes(q);
    const matchesFamily =
      familyFilter === "all" ||
      (familyFilter === "__none" ? !inst.family : inst.family === familyFilter);
    
    const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || inst.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesFamily;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInstruments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedInstruments = filteredInstruments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, categoryFilter, familyFilter]);

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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

          {/* News */}
          {news.length > 0 && (
            <Card className="mb-6" data-testid="news-section">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ fontFamily: 'Work Sans' }}>
                  <Megaphone className="inline mr-2 h-5 w-5 text-blue-600" />
                  News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(showAllNews ? news : news.slice(0, 2)).map((item) => (
                  <div
                    key={item.news_id}
                    className={`p-4 rounded-lg border ${item.important ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      {item.important && (
                        <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-200">Importante</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString("it-IT")} · {item.author_name}
                    </p>
                    <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{item.body}</p>
                  </div>
                ))}
                {news.length > 2 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllNews(!showAllNews)} data-testid="toggle-news-btn">
                    {showAllNews ? "Mostra meno" : `Mostra tutte le news (${news.length})`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { id: "stat-total-instruments", label: "Totale strumenti", value: stats.total_instruments, icon: Package, bg: "bg-blue-100", fg: "text-blue-600", num: "text-slate-900" },
              { id: "stat-available", label: "Disponibili", value: stats.available, icon: CheckCircle, bg: "bg-emerald-100", fg: "text-emerald-600", num: "text-emerald-600" },
              { id: "stat-in-use", label: "In uso", value: stats.in_use, icon: Clock, bg: "bg-amber-100", fg: "text-amber-600", num: "text-amber-600" },
              { id: "stat-movements", label: "Movimenti", value: stats.total_movements, icon: Activity, bg: "bg-purple-100", fg: "text-purple-600", num: "text-slate-900" },
            ].map((c) => (
              <Card key={c.id} data-testid={c.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <c.icon className={`h-5 w-5 ${c.fg}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">{c.label}</p>
                    <p className={`text-xl font-semibold leading-tight ${c.num}`}>{c.value || 0}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Famiglie */}
          {families.families.length > 0 && (
            <div className="mb-4" data-testid="families-bar">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Layers size={16} /> Famiglie di strumenti
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ key: "all", label: "Tutte", count: stats.total_instruments ?? instruments.length },
                  ...families.families.map((f) => ({ key: f.name, label: f.name, count: f.count })),
                  ...(families.without_family > 0 ? [{ key: "__none", label: "Senza famiglia", count: families.without_family }] : []),
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFamilyFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      familyFilter === f.key
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                    data-testid={`family-chip-${f.key}`}
                  >
                    {f.label} <span className={familyFilter === f.key ? "text-blue-100" : "text-slate-400"}>({f.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instruments Table */}
          <Card data-testid="instruments-table-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle style={{ fontFamily: 'Work Sans' }}>Elenco Strumenti</CardTitle>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cerca nome, matricola, marca..."
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
                    {searchQuery || statusFilter !== "all" || categoryFilter !== "all" || familyFilter !== "all"
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
                        <TableHead className="hidden md:table-cell">Marca</TableHead>
                        <TableHead className="hidden lg:table-cell">Famiglia</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedInstruments.map((instrument) => (
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
                            {instrument.brand || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-slate-500">
                            {instrument.family || "-"}
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
              {!loading && filteredInstruments.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4 text-sm text-slate-500" data-testid="pagination">
                  <span>
                    {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredInstruments.length)} di {filteredInstruments.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} data-testid="page-prev">
                      <ChevronLeft size={16} />
                    </Button>
                    <span>Pagina {currentPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} data-testid="page-next">
                      <ChevronRight size={16} />
                    </Button>
                  </div>
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
