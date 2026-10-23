import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Sidebar from "../components/Sidebar";
import { 
  Search, 
  Barcode, 
  Package, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  Camera,
  CameraOff,
  Hash,
  ScanLine,
  Keyboard
} from "lucide-react";
import { API } from "../App";

export default function SearchPage({ user, token, logout }) {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanMode, setScanMode] = useState(null); // null, 'camera', 'reader'
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const inputRef = useRef(null);
  const lastInputTime = useRef(0);
  const inputBuffer = useRef("");

  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Auto-focus input quando si seleziona il lettore esterno
  useEffect(() => {
    if (scanMode === 'reader' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const startCameraScanner = async () => {
    setScannerError("");
    setScannerActive(true);
    setScanMode('camera');
    setResults([]);
    setError("");

    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode("barcode-scanner");
      }

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 150 },
        aspectRatio: 1.7777778,
        formatsToSupport: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
      };

      await html5QrcodeRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          setBarcode(decodedText);
          stopCameraScanner();
          searchByBarcode(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setScannerError(
        err.message?.includes("Permission") 
          ? "Permesso fotocamera negato. Abilita la fotocamera nelle impostazioni del browser."
          : "Errore nell'avvio dello scanner. Verifica che il browser supporti l'accesso alla fotocamera."
      );
      setScannerActive(false);
      setScanMode(null);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScannerActive(false);
  };

  const startReaderMode = () => {
    setScanMode('reader');
    setResults([]);
    setError("");
    setBarcode("");
    // Focus sul campo input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const stopReaderMode = () => {
    setScanMode(null);
    setBarcode("");
  };

  // Gestisce input da lettore barcode esterno
  // I lettori barcode inviano caratteri molto velocemente e poi "Enter"
  const handleBarcodeInput = (e) => {
    const value = e.target.value;
    setBarcode(value);
    
    const now = Date.now();
    const timeDiff = now - lastInputTime.current;
    
    // Se i caratteri arrivano molto velocemente (< 50ms), è probabilmente un lettore
    if (timeDiff < 50) {
      inputBuffer.current = value;
    } else {
      inputBuffer.current = value;
    }
    
    lastInputTime.current = now;
  };

  // Quando premi Enter (il lettore barcode lo fa automaticamente)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      searchByBarcode(barcode.trim());
    }
  };

  const searchByBarcode = async (code) => {
    const searchCode = code || barcode.trim();
    if (!searchCode) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(`${API}/instruments/barcode/${searchCode}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else if (response.status === 404) {
        setError("Nessuno strumento trovato con questo codice a barre");
      } else {
        setError("Errore durante la ricerca");
      }
    } catch (err) {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    searchByBarcode();
  };

  const resetSearch = () => {
    setScanMode(null);
    setScannerActive(false);
    setBarcode("");
    setResults([]);
    setError("");
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      html5QrcodeRef.current.stop().catch(console.error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle size={14} className="mr-1" />
            Disponibile
          </Badge>
        );
      case "in_use":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock size={14} className="mr-1" />
            In uso
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="search" />
      
      <main className="main-content">
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Barcode className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: 'Work Sans' }}>
              Ricerca per Codice a Barre
            </h1>
            <p className="text-slate-500 mt-2">
              Scegli come vuoi scansionare il codice a barre
            </p>
          </div>

          {/* Selezione Modalità - Mostrato solo se non è attiva nessuna modalità */}
          {!scanMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Opzione Fotocamera */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-400"
                onClick={startCameraScanner}
                data-testid="select-camera-mode"
              >
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Fotocamera
                  </h3>
                  <p className="text-sm text-slate-500">
                    Usa la fotocamera del dispositivo per scansionare il codice a barre
                  </p>
                </CardContent>
              </Card>

              {/* Opzione Lettore Esterno */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-400"
                onClick={startReaderMode}
                data-testid="select-reader-mode"
              >
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <ScanLine className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Lettore Barcode
                  </h3>
                  <p className="text-sm text-slate-500">
                    Usa un lettore di codici a barre USB o Bluetooth collegato
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scanner Fotocamera */}
          {scanMode === 'camera' && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" style={{ fontFamily: 'Work Sans' }}>
                    <Camera className="inline mr-2 h-5 w-5" />
                    Scanner Fotocamera
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetSearch}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    data-testid="stop-scanner-btn"
                  >
                    <CameraOff size={16} className="mr-2" />
                    Chiudi
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {scannerError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                    <AlertCircle className="inline mr-2 h-4 w-4" />
                    {scannerError}
                  </div>
                )}
                
                {scannerActive && (
                  <div className="relative">
                    <div 
                      id="barcode-scanner" 
                      ref={scannerRef}
                      className="rounded-lg overflow-hidden bg-black"
                      style={{ minHeight: "280px" }}
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="border-2 border-blue-400 rounded-lg w-72 h-24 opacity-50" />
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-3">
                      Inquadra il codice a barre nello spazio evidenziato
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lettore Barcode Esterno */}
          {scanMode === 'reader' && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" style={{ fontFamily: 'Work Sans' }}>
                    <ScanLine className="inline mr-2 h-5 w-5" />
                    Lettore Barcode Esterno
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetSearch}
                    data-testid="stop-reader-btn"
                  >
                    Chiudi
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-pulse">
                    <ScanLine className="h-10 w-10 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-900 mb-2">
                    Pronto per la scansione
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    Scansiona il codice a barre con il lettore. Il codice apparirà automaticamente.
                  </p>
                  
                  <div className="max-w-md mx-auto">
                    <div className="relative">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="In attesa del codice a barre..."
                        value={barcode}
                        onChange={handleBarcodeInput}
                        onKeyDown={handleKeyDown}
                        className="pl-10 h-14 text-xl font-mono text-center border-2 border-green-300 focus:border-green-500"
                        data-testid="barcode-reader-input"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Puoi anche digitare manualmente e premere Invio
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ricerca Manuale - Sempre visibile */}
          {!scanMode && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ fontFamily: 'Work Sans' }}>
                  <Keyboard className="inline mr-2 h-5 w-5" />
                  Ricerca Manuale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Inserisci codice a barre..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="pl-10 h-12 text-lg font-mono"
                      data-testid="barcode-search-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700 btn-animate"
                    disabled={loading || !barcode.trim()}
                    data-testid="barcode-search-btn"
                  >
                    {loading ? (
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      "Cerca"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50 mb-6" data-testid="search-error">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetSearch}>
                    Nuova ricerca
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Work Sans' }}>
                  Strumenti trovati ({results.length})
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    Codice: {barcode}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={resetSearch}>
                    Nuova ricerca
                  </Button>
                </div>
              </div>
              
              {results.map((instrument) => (
                <Card 
                  key={instrument.instrument_id} 
                  className="card-hover cursor-pointer"
                  onClick={() => navigate(`/instrument/${instrument.instrument_id}`)}
                  data-testid={`result-${instrument.instrument_id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-slate-900">
                            {instrument.name}
                          </h3>
                          {getStatusBadge(instrument.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                          <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 py-1 rounded">
                            <Hash size={14} />
                            Matricola: <strong className="text-slate-700">{instrument.matricola}</strong>
                          </span>
                          {instrument.category && (
                            <span>{instrument.category}</span>
                          )}
                          {instrument.location && (
                            <span>📍 {instrument.location}</span>
                          )}
                        </div>

                        {instrument.status === "in_use" && instrument.current_destination && (
                          <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg inline-block">
                            Attualmente presso: <strong>{instrument.current_destination}</strong>
                          </div>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <ArrowRight size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!scanMode && results.length === 0 && !error && !loading && (
            <div className="text-center py-12 text-slate-400">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Seleziona un metodo di scansione o inserisci un codice manualmente</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
