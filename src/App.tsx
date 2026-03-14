import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { normalizeAddress, generateSearchSummary } from './services/gemini';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { 
  Search, 
  Phone, 
  User as UserIcon, 
  MapPin, 
  CreditCard, 
  Network, 
  ExternalLink, 
  ShieldCheck, 
  Zap,
  MessageCircle,
  Loader2,
  AlertCircle,
  History,
  Star,
  FileSpreadsheet,
  Download,
  Settings,
  ShieldAlert,
  CheckCircle,
  Lock,
  LogOut,
  Trash2, 
  Navigation, 
  Printer, 
  RotateCcw, 
  Bookmark, 
  Eye, 
  Share2,
  Send,
  Landmark,
  Compass
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { generateInvestigationReport } from './utils/pdfGenerator';
import { useAppStore } from './store';
import AdminPanel from './components/AdminPanel';
import BulkSearch from './components/BulkSearch';
import { HistoryPanel, FavoritesPanel } from './components/HistoryFavs';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from './lib/utils';

// Fix Leaflet marker icon issue
// @ts-ignore
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface SimData {
  name?: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  cnic?: string;
  nic?: string;
  address?: string;
  location?: string;
  network?: string;
  operator?: string;
  city?: string;
  status?: string;
}

// Component to update map view
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

const getOperator = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  const prefix = clean.startsWith('92') ? '0' + clean.slice(2, 5) : clean.substring(0, 4);
  
  if (prefix.startsWith('030') || prefix.startsWith('032')) return { name: 'JAZZ', color: 'text-amber-500', bg: 'bg-amber-500/10' };
  if (prefix.startsWith('034')) return { name: 'TELENOR', color: 'text-sky-500', bg: 'bg-sky-500/10' };
  if (prefix.startsWith('031')) return { name: 'ZONG', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (prefix.startsWith('033')) return { name: 'UFONE', color: 'text-orange-500', bg: 'bg-orange-500/10' };
  return { name: 'LWS NETWORK', color: 'text-purple-500', bg: 'bg-purple-500/10' };
};

function SecurityShield() {
  const [isThreatDetected, setIsThreatDetected] = useState(false);
  const { appConfig } = useAppStore();

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        setIsThreatDetected(true);
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    const interval = setInterval(() => {
        const start = new Date().getTime();
        (function() { return false; })['constructor']('debugger')(); 
        const end = new Date().getTime();
        if (end - start > 50) {
            setIsThreatDetected(true);
        }
    }, 2000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  if (isThreatDetected) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
        >
            <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-pulse">
                <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter text-white uppercase italic">Access Blocked</h1>
            <p className="text-white/60 mb-10 max-w-sm font-bold text-sm tracking-wide leading-relaxed">
                Source Code Protection Active. <br/>
                <span className="text-white text-lg block my-4 border-y border-white/10 py-4">
                  {appConfig.scraperMessage || "Thanks for trying! Now contact Mr Sami for buying the VIP source code."}
                </span>
            </p>
            <a 
                href={appConfig.scraperContact || appConfig.contactInfo || "#"} 
                target="_blank"
                className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-white/10"
            >
                Contact Developer
            </a>
            <button 
                onClick={() => window.location.reload()}
                className="mt-8 text-[9px] text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors"
            >
                Return to Dashboard
            </button>
        </motion.div>
      </div>
    );
  }

  return null;
}

export default function App() {
  const { 
    addHistory, maintenance, blockedIPs, 
    visitorCount, incrementVisitors,
    user, setUser, appConfig, isVipUser
  } = useAppStore();
  
  const WHATSAPP_CHANNEL = appConfig.channelLink;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  
  const isVip = isVipUser(user?.email || '');

  useEffect(() => {
    incrementVisitors();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) return;

    if (blockedIPs.includes(user?.email || '') || blockedIPs.includes('Detected')) {
      toast.error('ACCESS DENIED: Your account or IP has been blacklisted by administrator.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const endpoint = appConfig.apiEndpoint || "/api/lookup";
      let searchPhone = phoneNumber.trim();
      let response = await axios.get(`${endpoint}?phone=${searchPhone}`);
      let data = response.data;
      
      if ((!data || !data.success || !data.result || data.result.length === 0) && searchPhone.startsWith('0')) {
        const altPhone = searchPhone.substring(1);
        const altResponse = await axios.get(`${endpoint}?phone=${altPhone}`);
        if (altResponse.data && altResponse.data.success && altResponse.data.result && altResponse.data.result.length > 0) {
          data = altResponse.data;
        }
      }

      if (data && data.success === true && Array.isArray(data.result) && data.result.length > 0) {
        setResults(data.result);
        addHistory(searchPhone, data.result);

        try {
          const brief = await generateSearchSummary(data.result);
          setSummary(brief);
        } catch (sErr) {
          console.error("Summary failed");
        }
      } else {
        setError('No record found for this number or CNIC.');
      }
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    await generateInvestigationReport(results, appConfig, getOperator);
  };

  const selectHistoryItem = (query: string) => {
    setPhoneNumber(query);
    setTimeout(() => {
      document.getElementById('search-form-btn')?.click();
    }, 100);
  };

  const selectFavItem = (record: SimData) => {
    setPhoneNumber(record.mobile || record.phone || '');
    setTimeout(() => {
      document.getElementById('search-form-btn')?.click();
    }, 100);
  };

  const handleLoginSuccess = (credentialResponse: any) => {
    const decoded: any = jwtDecode(credentialResponse.credential);
    setUser({
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture
    });
    toast.success(`Welcome, ${decoded.name}!`);
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  if (maintenance && !showAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Temporarily Unavailable</h1>
        <p className="text-white/60 mb-8 max-w-md">Our database nodes are currently undergoing scheduled maintenance to upgrade security and performance. Please try again shortly.</p>
        <button onDoubleClick={() => setShowAdmin(true)} className="text-[10px] text-white/5 uppercase tracking-widest cursor-default">System Access</button>
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      </div>
    );
  }

  if (!user && !showAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
        >
          <div 
            onDoubleClick={() => setShowAdmin(true)}
            className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 cursor-default active:scale-95 transition-transform"
          >
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-white/40 text-sm mb-8">Please sign in with Google to access the LWS SIM tracking database.</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => toast.error('Login Failed')}
              theme="filled_black"
              shape="pill"
            />
          </div>
          <p className="mt-12 text-[8px] text-white/5 uppercase tracking-[0.4em] font-black">Official Security Portal</p>
        </motion.div>
      </div>
    );
  }

  const primaryColor = appConfig.primaryColor || "#9333ea";
  const secondaryColor = appConfig.secondaryColor || "#3b82f6";

  return (
    <div className={cn("min-h-screen bg-[#050505] text-white selection:bg-purple-500/30", appConfig.fontStyle)}>
      <SecurityShield />
      <style>{`
        :root {
          --primary: ${primaryColor};
          --secondary: ${secondaryColor};
        }
      `}</style>
      
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

      {appConfig.announcement && (
        <div className="relative z-[60] bg-black/60 backdrop-blur-md border-b border-white/5 h-10 flex items-center overflow-hidden font-sans">
          <div className="absolute left-0 top-0 bottom-0 bg-red-600 px-4 flex items-center z-10 border-r border-white/10 shadow-[5px_0_15px_rgba(220,38,38,0.2)]">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Breaking</span>
          </div>
          <div className="animate-marquee whitespace-nowrap pl-[140px] flex gap-12">
             <span className="text-[11px] font-bold text-white/80 tracking-[0.1em] uppercase">
               {appConfig.announcement} &bull; {appConfig.announcement} &bull; {appConfig.announcement}
             </span>
             <span className="text-[11px] font-bold text-white/80 tracking-[0.1em] uppercase">
               {appConfig.announcement} &bull; {appConfig.announcement} &bull; {appConfig.announcement}
             </span>
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-20" style={{ backgroundColor: primaryColor }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-20" style={{ backgroundColor: secondaryColor }} />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3" onDoubleClick={() => setShowAdmin(true)}>
            {appConfig.logoUrl ? (
              <img src={appConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {appConfig.toolName.split(' ')[0]} <span style={{ color: primaryColor }}>{appConfig.toolName.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">VIP SIM TRACKER PRO</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end pr-2 border-r border-white/10">
              <p className="text-xs font-bold text-white/80">{user?.name}</p>
              <p className={cn("text-[9px] font-bold uppercase tracking-widest", isVip ? "text-emerald-500" : "text-purple-500")}>
                {isVip ? "VIP MEMBER" : "FREE MEMBER"}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => setShowHistory(true)} className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"><History className="w-5 h-5" /></button>
              <button onClick={() => setShowFavs(true)} className="p-2 text-amber-500/80 hover:text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"><Star className="w-5 h-5" /></button>
              <button onClick={() => setShowBulk(true)} className="p-2 text-blue-500/80 hover:text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors"><FileSpreadsheet className="w-5 h-5" /></button>
            </div>

            <button onClick={handleLogout} className="p-2 text-red-500/60 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className={cn("inline-block px-4 py-1.5 rounded-full border mb-6 text-[10px] font-black uppercase tracking-[0.3em]", isVip ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20")}>
              {isVip ? "VIP UNLOCKED ACCESS" : "PREMIUM ACCESS ENABLED"}
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter mb-6 leading-tight">Search Any Number <br /><span className="text-white/40">With Precision.</span></h2>
          </motion.div>

          <motion.form onSubmit={handleSearch} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20" />
              <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl">
                <input 
                  type="text" 
                  placeholder="Enter phone number or CNIC"
                  className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-lg font-medium"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <button id="search-form-btn" type="submit" disabled={loading} className="text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.form>
        </div>

        <AnimatePresence mode="wait">
          {error && <motion.div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 mb-8"><AlertCircle className="w-5 h-5" /><p className="text-sm font-medium">{error}</p></motion.div>}

          {results && results.length > 0 && (
            <div className="space-y-6">
              <div className="mb-8 p-4 border rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: `${primaryColor}1a`, borderColor: `${primaryColor}33` }}>
                <p className="text-[11px] text-white/80 italic">"{summary || "Deep analysis generated."}"</p>
                <button onClick={downloadReport} className="shrink-0 flex items-center gap-2 px-5 py-3 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95">
                  <Download className="w-4 h-4" /> Investigation Report
                </button>
              </div>

              <div className="space-y-12">
                {results.map((res, index) => (
                  <RecordCard data={res} index={index + 1} key={index} />
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} onSelect={selectHistoryItem} />}
      {showFavs && <FavoritesPanel onClose={() => setShowFavs(false)} onSelect={selectFavItem} />}
      {showBulk && <BulkSearch onClose={() => setShowBulk(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      <footer className="relative z-10 border-t border-white/5 py-12 mt-20 text-center">
        <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">&copy; 2024 LWS DATABASE &bull; ALL RIGHTS RESERVED</p>
        <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-purple-600/10 border border-purple-500/20 rounded-full text-purple-400 font-bold hover:bg-purple-600 hover:text-white transition-all">Learn With Sami | LWS</a>
      </footer>
    </div>
  );
}

function RecordCard({ data, index }: { data: SimData, index: number }) {
  const { appConfig, favorites, toggleFavorite, user, isVipUser } = useAppStore();
  const [center, setCenter] = useState<[number, number]>([33.6844, 73.0479]); 
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [copied, setCopied] = useState(false);

  const name = data.name || data.full_name || 'N/A';
  const rawAddress = data.address || data.location || 'N/A';
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawAddress)}`;
  const isFav = favorites.some(f => (f.mobile === data.mobile || f.phone === data.phone) && (f.cnic === data.cnic || f.nic === data.nic));
  const isPaid = appConfig.paidSystem && !isVipUser(user?.email || '');

  useEffect(() => {
    if (rawAddress !== 'N/A' && !isPaid) {
      setGeoStatus('loading');
      axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawAddress + ', Pakistan')}`)
        .then(res => {
          if (res.data && res.data[0]) {
            setCenter([parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)]);
            setGeoStatus('success');
          } else {
            setGeoStatus('failed');
          }
        })
        .catch(() => setGeoStatus('failed'));
    }
  }, [rawAddress, isPaid]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${name} | ${data.mobile || data.phone} | ${data.cnic || data.nic} | ${rawAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Record copied to clipboard');
  };

  const shareOnWhatsApp = () => {
    const text = `*SIM RECORD FOUND*\n\n*Name:* ${name}\n*Phone:* ${data.mobile || data.phone}\n*CNIC:* ${data.cnic || data.nic}\n*Address:* ${rawAddress}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <UserIcon className="w-6 h-6 text-purple-500" />
             </div>
             <div>
                <h3 className="text-xl font-bold tracking-tight">{name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">RECORD IDENTIFIED #{index}</p>
             </div>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", isPaid ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}>
             {isPaid ? "ENCRYPTED" : "VERIFIED"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 border border-white/5 rounded-2xl overflow-hidden bg-black/20">
           <DataRow label="IDENTITY" value={isPaid ? "XXXXXXXXXXXXX" : (data.cnic || data.nic || 'N/A')} />
           <DataRow label="CONTACT" value={data.mobile || data.phone || 'N/A'} />
           <DataRow label="NETWORK" value={getOperator(data.mobile || data.phone || "").name} />
           <DataRow label="ADDRESS" value={isPaid ? "REDACTED FOR PREMIUM USERS" : rawAddress} />
        </div>
      </div>

      {!isPaid && (
        <div className="p-4 bg-black/60">
          <div className="relative h-[250px] rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
             {geoStatus === 'loading' ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div> : (
               <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full z-0" attributionControl={false}>
                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                 <ChangeView center={center} />
                 <Marker position={center}><Popup>{name}</Popup></Marker>
               </MapContainer>
             )}
          </div>
        </div>
      )}

      {isPaid && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm text-center">
            <Lock className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase">Premium Access Required</h3>
            <p className="text-white/40 text-xs mb-8">This identity record is locked behind the VIP protocol. Upgrade to view full intelligence details and address mapping.</p>
            <a href={appConfig.contactInfo} target="_blank" className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">Upgrade to VIP</a>
        </div>
      )}

      <div className="p-4 pt-0 grid grid-cols-2 gap-2 bg-black/60 relative z-10">
        <button onClick={() => toggleFavorite(data)} disabled={isPaid} className="py-3 bg-[#111] hover:bg-[#222] text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"><Star className={cn("w-4 h-4", isFav && "fill-amber-500")} /> {isFav ? "SAVED" : "SAVE"}</button>
        <button onClick={shareOnWhatsApp} disabled={isPaid} className="py-3 bg-[#111] hover:bg-[#222] text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"><Send className="w-4 h-4" /> SHARE</button>
        <a href={isPaid ? "#" : googleMapsUrl} target="_blank" className="py-3 bg-[#111] hover:bg-[#222] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center justify-center">LOCATION</a>
        <button onClick={copyToClipboard} disabled={isPaid} className="py-3 bg-[#111] hover:bg-[#222] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center justify-center">{copied ? "COPIED" : "COPY"}</button>
      </div>
    </motion.div>
  );
}

function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center px-6 py-4 transition-colors hover:bg-white/[0.03]">
      <div className="w-1/3 text-[11px] font-black tracking-tighter uppercase text-white/40">{label}</div>
      <div className="w-2/3 text-sm font-semibold tracking-tight text-white">{value || "N/A"}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] transition-colors">
      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-emerald-500" /></div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}
