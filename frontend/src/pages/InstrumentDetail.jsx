import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Sidebar from "../components/Sidebar";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Package, 
  MapPin, 
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  User,
  Hash,
  Barcode
} from "lucide-react";
import { API } from "../App";

export default function InstrumentDetail({ user, token, logout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState(null);
  const [movements, setMovements] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrelievoDialog, setShowPrelievoDialog] = useState(false);
  const [showDepositoDialog, setShowDepositoDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [instrumentRes, movementsRes, destinationsRes] = await Promise.all([
        fetch(`${API}/instruments/${id}`, { headers, credentials: "include" }),
        fetch(`${API}/movements/instrument/${id}`, { headers, credentials: "include" }),
        fetch(`${API}/destinations`, { headers, credentials: "include" })
      ]);

      if (instrumentRes.ok) {
        const data = await instrumentRes.json();
        setInstrument(data);
      } else {
        navigate("/dashboard");
      }

      if (movementsRes.ok) {
        const data = await movementsRes.json();
        setMovements(data);
      }

      if (destinationsRes.ok) {
        const data = await destinationsRes.json();
        setDestinations(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const handlePrelievo = async () => {
    if (!selectedDestination) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          instrument_id: id,
          movement_type: "prelievo",
          destination: selectedDestination,
          notes: notes.trim() || null
        }),
        credentials: "include"
      });

      if (response.ok) {
        setShowPrelievoDialog(false);
        setSelectedDestination("");
        setNotes("");
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeposito = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          instrument_id: id,
          movement_type: "deposito",
          notes: notes.trim() || null
        }),
        credentials: "include"
      });

      if (response.ok) {
        setShowDepositoDialog(false);
        setNotes("");
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-3 py-1">
            <CheckCircle size={14} className="mr-1" />
            Disponibile
          </Badge>
        );
      case "in_use":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-sm px-3 py-1">
            <Clock size={14} className="mr-1" />
            In uso
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="layout-sidebar">
        <Sidebar user={user} logout={logout} activePage="" />
        <main className="main-content flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </main>
      </div>
    );
  }

  if (!instrument) {
    return null;
  }

  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="" />
      
      <main className="main-content">
        <div className="p-6 md:p-8">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mb-6"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft size={18} className="mr-2" />
            Torna alla Dashboard
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Image & Quick Actions */}
            <div className="space-y-6">
              {/* Image Card */}
              <Card>
                <CardContent className="pt-6">
                  {instrument.image_url ? (
                    <img 
                      src={instrument.image_url} 
                      alt={instrument.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: 'Work Sans' }}>
                    Azioni Rapide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {instrument.status === "available" ? (
                    <Button 
                      className="w-full bg-amber-500 hover:bg-amber-600 btn-animate"
                      onClick={() => setShowPrelievoDialog(true)}
                      data-testid="prelievo-btn"
                    >
                      <ArrowUpFromLine size={18} className="mr-2" />
                      Registra Prelievo
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-emerald-500 hover:bg-emerald-600 btn-animate"
                      onClick={() => setShowDepositoDialog(true)}
                      data-testid="deposito-btn"
                    >
                      <ArrowDownToLine size={18} className="mr-2" />
                      Registra Deposito
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Details & History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Details Card */}
              <Card data-testid="instrument-details-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl" style={{ fontFamily: 'Work Sans' }}>
                        {instrument.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <CardDescription className="flex items-center gap-1 font-mono text-base bg-slate-100 px-2 py-1 rounded">
                          <Barcode size={14} />
                          {instrument.barcode}
                        </CardDescription>
                        <CardDescription className="flex items-center gap-1 font-mono text-base bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          <Hash size={14} />
                          Matricola: {instrument.matricola}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(instrument.status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {instrument.description && (
                    <p className="text-slate-600 mb-6">{instrument.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {instrument.category && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Categoria</p>
                        <p className="text-slate-900 font-medium">{instrument.category}</p>
                      </div>
                    )}
                    {instrument.location && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                          <MapPin size={12} className="inline mr-1" />
                          Posizione
                        </p>
                        <p className="text-slate-900 font-medium">{instrument.location}</p>
                      </div>
                    )}
                    {instrument.calibration_date && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                          <Calendar size={12} className="inline mr-1" />
                          Data Calibrazione
                        </p>
                        <p className="text-slate-900 font-medium">{instrument.calibration_date}</p>
                      </div>
                    )}
                    {instrument.calibration_expiry && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Scadenza</p>
                        <p className="text-slate-900 font-medium">{instrument.calibration_expiry}</p>
                      </div>
                    )}
                  </div>

                  {instrument.status === "in_use" && instrument.current_destination && (
                    <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-sm text-amber-800">
                        <strong>Attualmente presso:</strong> {instrument.current_destination}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* History Card */}
              <Card data-testid="movement-history-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: 'Work Sans' }}>
                    <History size={20} />
                    Storico Movimenti
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {movements.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nessun movimento registrato</p>
                    </div>
                  ) : (
                    <div className="movement-timeline">
                      {movements.map((movement, index) => (
                        <div 
                          key={movement.movement_id} 
                          className={`movement-item ${movement.movement_type}`}
                          data-testid={`movement-${movement.movement_id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {movement.movement_type === "prelievo" ? (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                    <ArrowUpFromLine size={12} className="mr-1" />
                                    Prelievo
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    <ArrowDownToLine size={12} className="mr-1" />
                                    Deposito
                                  </Badge>
                                )}
                                {movement.instrument_matricola && (
                                  <span className="text-xs font-mono text-slate-500">
                                    Matricola: {movement.instrument_matricola}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <User size={14} />
                                {movement.user_name || "Utente"}
                              </div>
                              {movement.destination && (
                                <p className="text-sm text-slate-600 mt-1">
                                  <MapPin size={14} className="inline mr-1" />
                                  {movement.destination}
                                </p>
                              )}
                              {movement.notes && (
                                <p className="text-sm text-slate-500 mt-1 italic">
                                  "{movement.notes}"
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatDate(movement.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Prelievo Dialog */}
        <Dialog open={showPrelievoDialog} onOpenChange={setShowPrelievoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Work Sans' }}>Registra Prelievo</DialogTitle>
              <DialogDescription>
                Strumento: <strong>{instrument.name}</strong> - Matricola: <strong>{instrument.matricola}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Hash size={14} className="inline mr-1" />
                  Matricola: <strong className="font-mono">{instrument.matricola}</strong>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination">Destinazione *</Label>
                {destinations.length > 0 ? (
                  <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                    <SelectTrigger data-testid="prelievo-destination-select">
                      <SelectValue placeholder="Seleziona destinazione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((dest) => (
                        <SelectItem key={dest.destination_id} value={dest.name}>
                          {dest.name}
                          {dest.description && ` - ${dest.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                    Nessuna destinazione configurata. Chiedi all'amministratore di aggiungere le destinazioni.
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Note (opzionale)</Label>
                <Textarea
                  id="notes"
                  placeholder="Eventuali note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="prelievo-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrelievoDialog(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handlePrelievo}
                disabled={!selectedDestination || actionLoading}
                className="bg-amber-500 hover:bg-amber-600"
                data-testid="confirm-prelievo-btn"
              >
                {actionLoading ? "Salvataggio..." : "Conferma Prelievo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deposito Dialog */}
        <Dialog open={showDepositoDialog} onOpenChange={setShowDepositoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Work Sans' }}>Registra Deposito</DialogTitle>
              <DialogDescription>
                Strumento: <strong>{instrument.name}</strong> - Matricola: <strong>{instrument.matricola}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-600">
                  Lo strumento <strong>{instrument.name}</strong> (Matricola: <strong className="font-mono">{instrument.matricola}</strong>) verrà riportato come disponibile.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositoNotes">Note (opzionale)</Label>
                <Textarea
                  id="depositoNotes"
                  placeholder="Eventuali note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="deposito-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDepositoDialog(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handleDeposito}
                disabled={actionLoading}
                className="bg-emerald-500 hover:bg-emerald-600"
                data-testid="confirm-deposito-btn"
              >
                {actionLoading ? "Salvataggio..." : "Conferma Deposito"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
