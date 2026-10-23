import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import Sidebar from "../components/Sidebar";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Users, 
  Shield, 
  User,
  Search,
  MapPin,
  Hash
} from "lucide-react";
import { API } from "../App";

export default function AdminPanel({ user, token, logout }) {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState([]);
  const [users, setUsers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Instrument Dialog State
  const [showInstrumentDialog, setShowInstrumentDialog] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [instrumentForm, setInstrumentForm] = useState({
    barcode: "",
    matricola: "",
    name: "",
    description: "",
    image_url: "",
    location: "",
    calibration_date: "",
    calibration_expiry: "",
    category: ""
  });
  const [instrumentLoading, setInstrumentLoading] = useState(false);
  
  // User Dialog State
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", role: "" });
  const [userLoading, setUserLoading] = useState(false);

  // Destination Dialog State
  const [showDestinationDialog, setShowDestinationDialog] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);
  const [destinationForm, setDestinationForm] = useState({ name: "", description: "" });
  const [destinationLoading, setDestinationLoading] = useState(false);

  // Delete Dialog State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState("");

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [instrumentsRes, usersRes, destinationsRes] = await Promise.all([
        fetch(`${API}/instruments`, { headers, credentials: "include" }),
        fetch(`${API}/users`, { headers, credentials: "include" }),
        fetch(`${API}/destinations`, { headers, credentials: "include" })
      ]);

      if (instrumentsRes.ok) {
        const data = await instrumentsRes.json();
        setInstruments(data);
      }
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
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
  }, [token]);

  // Instrument CRUD
  const handleSaveInstrument = async () => {
    setInstrumentLoading(true);
    try {
      const url = editingInstrument 
        ? `${API}/instruments/${editingInstrument.instrument_id}`
        : `${API}/instruments`;
      
      const method = editingInstrument ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(instrumentForm),
        credentials: "include"
      });

      if (response.ok) {
        setShowInstrumentDialog(false);
        setEditingInstrument(null);
        setInstrumentForm({
          barcode: "",
          matricola: "",
          name: "",
          description: "",
          image_url: "",
          location: "",
          calibration_date: "",
          calibration_expiry: "",
          category: ""
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setInstrumentLoading(false);
    }
  };

  const openEditInstrument = (instrument) => {
    setEditingInstrument(instrument);
    setInstrumentForm({
      barcode: instrument.barcode || "",
      matricola: instrument.matricola || "",
      name: instrument.name || "",
      description: instrument.description || "",
      image_url: instrument.image_url || "",
      location: instrument.location || "",
      calibration_date: instrument.calibration_date || "",
      calibration_expiry: instrument.calibration_expiry || "",
      category: instrument.category || ""
    });
    setShowInstrumentDialog(true);
  };

  const openNewInstrument = () => {
    setEditingInstrument(null);
    setInstrumentForm({
      barcode: "",
      matricola: "",
      name: "",
      description: "",
      image_url: "",
      location: "",
      calibration_date: "",
      calibration_expiry: "",
      category: ""
    });
    setShowInstrumentDialog(true);
  };

  // User CRUD
  const handleSaveUser = async () => {
    setUserLoading(true);
    try {
      const response = await fetch(`${API}/users/${editingUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userForm),
        credentials: "include"
      });

      if (response.ok) {
        setShowUserDialog(false);
        setEditingUser(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUserLoading(false);
    }
  };

  const openEditUser = (userItem) => {
    setEditingUser(userItem);
    setUserForm({
      name: userItem.name || "",
      role: userItem.role || "operator"
    });
    setShowUserDialog(true);
  };

  // Destination CRUD
  const handleSaveDestination = async () => {
    setDestinationLoading(true);
    try {
      const url = editingDestination 
        ? `${API}/destinations/${editingDestination.destination_id}`
        : `${API}/destinations`;
      
      const method = editingDestination ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(destinationForm),
        credentials: "include"
      });

      if (response.ok) {
        setShowDestinationDialog(false);
        setEditingDestination(null);
        setDestinationForm({ name: "", description: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDestinationLoading(false);
    }
  };

  const openEditDestination = (dest) => {
    setEditingDestination(dest);
    setDestinationForm({
      name: dest.name || "",
      description: dest.description || ""
    });
    setShowDestinationDialog(true);
  };

  const openNewDestination = () => {
    setEditingDestination(null);
    setDestinationForm({ name: "", description: "" });
    setShowDestinationDialog(true);
  };

  // Delete handlers
  const handleDelete = async () => {
    try {
      let url = "";
      if (deleteType === "instrument") {
        url = `${API}/instruments/${deleteTarget.instrument_id}`;
      } else if (deleteType === "user") {
        url = `${API}/users/${deleteTarget.user_id}`;
      } else if (deleteType === "destination") {
        url = `${API}/destinations/${deleteTarget.destination_id}`;
      }
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setDeleteTarget(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const confirmDelete = (item, type) => {
    setDeleteTarget(item);
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const filteredInstruments = instruments.filter((inst) =>
    inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.matricola?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
          <Shield size={12} className="mr-1" />
          Amministratore
        </Badge>
      );
    }
    if (role === "technician") {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Package size={12} className="mr-1" />
          Tecnico
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
        <User size={12} className="mr-1" />
        Operatore
      </Badge>
    );
  };

  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="admin" />
      
      <main className="main-content">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: 'Work Sans' }}>
              {user?.role === "technician" ? "Gestione Strumenti" : "Pannello Amministrazione"}
            </h1>
            <p className="text-slate-500 mt-1">
              {user?.role === "technician" 
                ? "Aggiungi e modifica gli strumenti del laboratorio"
                : "Gestisci strumenti, utenti e destinazioni"
              }
            </p>
          </div>

          <Tabs defaultValue="instruments" className="space-y-6">
            {user?.role === "admin" ? (
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="instruments" data-testid="instruments-tab">
                  <Package size={16} className="mr-2" />
                  Strumenti
                </TabsTrigger>
                <TabsTrigger value="destinations" data-testid="destinations-tab">
                  <MapPin size={16} className="mr-2" />
                  Destinazioni
                </TabsTrigger>
                <TabsTrigger value="users" data-testid="users-tab">
                  <Users size={16} className="mr-2" />
                  Utenti
                </TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full max-w-xs grid-cols-1">
                <TabsTrigger value="instruments" data-testid="instruments-tab">
                  <Package size={16} className="mr-2" />
                  Strumenti
                </TabsTrigger>
              </TabsList>
            )}

            {/* Instruments Tab */}
            <TabsContent value="instruments">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle style={{ fontFamily: 'Work Sans' }}>Gestione Strumenti</CardTitle>
                      <CardDescription>
                        Codice a barre = tipo strumento, Matricola = identificativo univoco
                      </CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Cerca..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-64"
                          data-testid="admin-search-input"
                        />
                      </div>
                      <Button 
                        onClick={openNewInstrument}
                        className="bg-blue-600 hover:bg-blue-700 btn-animate"
                        data-testid="add-instrument-btn"
                      >
                        <Plus size={18} className="mr-2" />
                        Nuovo Strumento
                      </Button>
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
                        Nessuno strumento
                      </h3>
                      <p className="text-slate-500 mb-4">
                        Aggiungi il primo strumento al catalogo
                      </p>
                      <Button onClick={openNewInstrument}>
                        <Plus size={18} className="mr-2" />
                        Aggiungi Strumento
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Codice a Barre</TableHead>
                            <TableHead>Matricola</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInstruments.map((instrument) => (
                            <TableRow key={instrument.instrument_id} className="table-row-hover">
                              <TableCell className="font-mono text-sm">
                                {instrument.barcode}
                              </TableCell>
                              <TableCell className="font-mono text-sm font-medium text-blue-600">
                                {instrument.matricola}
                              </TableCell>
                              <TableCell className="font-medium">
                                {instrument.name}
                              </TableCell>
                              <TableCell className="text-slate-500">
                                {instrument.category || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={
                                    instrument.status === "available" 
                                      ? "bg-emerald-100 text-emerald-700" 
                                      : "bg-amber-100 text-amber-700"
                                  }
                                >
                                  {instrument.status === "available" ? "Disponibile" : "In uso"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openEditInstrument(instrument)}
                                    data-testid={`edit-instrument-${instrument.instrument_id}`}
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => confirmDelete(instrument, "instrument")}
                                    data-testid={`delete-instrument-${instrument.instrument_id}`}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Destinations Tab */}
            <TabsContent value="destinations">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle style={{ fontFamily: 'Work Sans' }}>Gestione Destinazioni</CardTitle>
                      <CardDescription>
                        Definisci i luoghi dove gli strumenti possono essere prelevati
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={openNewDestination}
                      className="bg-blue-600 hover:bg-blue-700 btn-animate"
                      data-testid="add-destination-btn"
                    >
                      <Plus size={18} className="mr-2" />
                      Nuova Destinazione
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {destinations.length === 0 ? (
                    <div className="empty-state py-12">
                      <div className="empty-state-icon">
                        <MapPin className="h-12 w-12 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1">
                        Nessuna destinazione
                      </h3>
                      <p className="text-slate-500 mb-4">
                        Aggiungi le destinazioni per i prelievi (es. Laboratorio 1, Aula 12)
                      </p>
                      <Button onClick={openNewDestination}>
                        <Plus size={18} className="mr-2" />
                        Aggiungi Destinazione
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {destinations.map((dest) => (
                        <Card key={dest.destination_id} className="card-hover">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin size={18} className="text-blue-600" />
                                  <h3 className="font-medium text-slate-900">{dest.name}</h3>
                                </div>
                                {dest.description && (
                                  <p className="text-sm text-slate-500">{dest.description}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openEditDestination(dest)}
                                  data-testid={`edit-destination-${dest.destination_id}`}
                                >
                                  <Pencil size={14} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => confirmDelete(dest, "destination")}
                                  data-testid={`delete-destination-${dest.destination_id}`}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'Work Sans' }}>Gestione Utenti</CardTitle>
                  <CardDescription>
                    Modifica i ruoli degli utenti registrati nel sistema
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Ruolo</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((userItem) => (
                            <TableRow key={userItem.user_id} className="table-row-hover">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  {userItem.picture ? (
                                    <img 
                                      src={userItem.picture} 
                                      alt={userItem.name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                      <User size={16} className="text-slate-500" />
                                    </div>
                                  )}
                                  {userItem.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-500">
                                {userItem.email}
                              </TableCell>
                              <TableCell>
                                {getRoleBadge(userItem.role)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openEditUser(userItem)}
                                    data-testid={`edit-user-${userItem.user_id}`}
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                  {userItem.user_id !== user.user_id && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => confirmDelete(userItem, "user")}
                                      data-testid={`delete-user-${userItem.user_id}`}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Instrument Dialog */}
        <Dialog open={showInstrumentDialog} onOpenChange={setShowInstrumentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Work Sans' }}>
                {editingInstrument ? "Modifica Strumento" : "Nuovo Strumento"}
              </DialogTitle>
              <DialogDescription>
                Il codice a barre identifica il tipo, la matricola è unica per ogni unità
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Codice a Barre *</Label>
                  <Input
                    id="barcode"
                    value={instrumentForm.barcode}
                    onChange={(e) => setInstrumentForm({...instrumentForm, barcode: e.target.value})}
                    placeholder="123456789"
                    className="font-mono"
                    data-testid="instrument-barcode-input"
                  />
                  <p className="text-xs text-slate-500">Stesso per strumenti simili</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matricola">Matricola *</Label>
                  <Input
                    id="matricola"
                    value={instrumentForm.matricola}
                    onChange={(e) => setInstrumentForm({...instrumentForm, matricola: e.target.value})}
                    placeholder="SN-001-2024"
                    className="font-mono"
                    data-testid="instrument-matricola-input"
                  />
                  <p className="text-xs text-slate-500">Unica per ogni unità</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={instrumentForm.name}
                  onChange={(e) => setInstrumentForm({...instrumentForm, name: e.target.value})}
                  placeholder="Calibro digitale"
                  data-testid="instrument-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={instrumentForm.description}
                  onChange={(e) => setInstrumentForm({...instrumentForm, description: e.target.value})}
                  placeholder="Descrizione dello strumento..."
                  data-testid="instrument-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={instrumentForm.category}
                    onChange={(e) => setInstrumentForm({...instrumentForm, category: e.target.value})}
                    placeholder="Misura lunghezza"
                    data-testid="instrument-category-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Posizione</Label>
                  <Input
                    id="location"
                    value={instrumentForm.location}
                    onChange={(e) => setInstrumentForm({...instrumentForm, location: e.target.value})}
                    placeholder="Armadio A, Ripiano 3"
                    data-testid="instrument-location-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calibration_date">Data Calibrazione</Label>
                  <Input
                    id="calibration_date"
                    type="date"
                    value={instrumentForm.calibration_date}
                    onChange={(e) => setInstrumentForm({...instrumentForm, calibration_date: e.target.value})}
                    data-testid="instrument-calibration-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calibration_expiry">Scadenza Calibrazione</Label>
                  <Input
                    id="calibration_expiry"
                    type="date"
                    value={instrumentForm.calibration_expiry}
                    onChange={(e) => setInstrumentForm({...instrumentForm, calibration_expiry: e.target.value})}
                    data-testid="instrument-calibration-expiry-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL Immagine</Label>
                <Input
                  id="image_url"
                  value={instrumentForm.image_url}
                  onChange={(e) => setInstrumentForm({...instrumentForm, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  data-testid="instrument-image-url-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInstrumentDialog(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handleSaveInstrument}
                disabled={!instrumentForm.barcode || !instrumentForm.matricola || !instrumentForm.name || instrumentLoading}
                data-testid="save-instrument-btn"
              >
                {instrumentLoading ? "Salvataggio..." : "Salva"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Work Sans' }}>Modifica Utente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Nome</Label>
                <Input
                  id="userName"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  data-testid="user-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userRole">Ruolo</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(value) => setUserForm({...userForm, role: value})}
                >
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Amministratore</SelectItem>
                    <SelectItem value="technician">Tecnico</SelectItem>
                    <SelectItem value="operator">Operatore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handleSaveUser}
                disabled={userLoading}
                data-testid="save-user-btn"
              >
                {userLoading ? "Salvataggio..." : "Salva"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Destination Dialog */}
        <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Work Sans' }}>
                {editingDestination ? "Modifica Destinazione" : "Nuova Destinazione"}
              </DialogTitle>
              <DialogDescription>
                Definisci un luogo dove gli strumenti possono essere prelevati
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="destName">Nome Destinazione *</Label>
                <Input
                  id="destName"
                  value={destinationForm.name}
                  onChange={(e) => setDestinationForm({...destinationForm, name: e.target.value})}
                  placeholder="Es: Laboratorio 1, Aula 12, Officina..."
                  data-testid="destination-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destDescription">Descrizione (opzionale)</Label>
                <Textarea
                  id="destDescription"
                  value={destinationForm.description}
                  onChange={(e) => setDestinationForm({...destinationForm, description: e.target.value})}
                  placeholder="Descrizione del luogo..."
                  data-testid="destination-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDestinationDialog(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handleSaveDestination}
                disabled={!destinationForm.name || destinationLoading}
                data-testid="save-destination-btn"
              >
                {destinationLoading ? "Salvataggio..." : "Salva"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Work Sans' }}>Conferma Eliminazione</DialogTitle>
              <DialogDescription>
                {deleteType === "instrument" && `Sei sicuro di voler eliminare lo strumento "${deleteTarget?.name}" (Matricola: ${deleteTarget?.matricola})?`}
                {deleteType === "user" && `Sei sicuro di voler eliminare l'utente "${deleteTarget?.name}"?`}
                {deleteType === "destination" && `Sei sicuro di voler eliminare la destinazione "${deleteTarget?.name}"?`}
                {" "}Questa azione non può essere annullata.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annulla
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                data-testid="confirm-delete-btn"
              >
                Elimina
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
