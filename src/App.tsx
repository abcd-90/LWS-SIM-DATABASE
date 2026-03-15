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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppStore } from './store';
import AdminPanel from './components/AdminPanel';
import BulkSearch from './components/BulkSearch';
import { HistoryPanel, FavoritesPanel } from './components/HistoryFavs';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from './lib/utils';

// Fix Leaflet marker icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

const WHATSAPP_CHANNEL = "https://www.whatsapp.com/channel/0029Vb688BZ6GcGO9OwJc621";

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
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center font-sans font-sans">
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
  const [scammerAlert, setScammerAlert] = useState<{phone: string, note: string} | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isVip = isVipUser(user?.email || '');

  // Visitor Tracking
  useEffect(() => {
    incrementVisitors();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) return;

    // Security Check: Blocked User/IP
    if (blockedIPs.includes(user?.email || '') || blockedIPs.includes('Detected')) {
      toast.error('ACCESS DENIED: Your account or IP has been blacklisted by administrator.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setScammerAlert(null);

    // Global Scammer Check
    const cleanNum = phoneNumber.trim().replace(/\D/g, '');
    const scammer = appConfig.scammers?.find((s: any) => s.phone === cleanNum);
    if (scammer) {
      setScammerAlert(scammer);
    }

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

        // Generate AI Summary
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

  const downloadPDF = async () => {
    if (!results || results.length === 0) return;
    const config = appConfig.pdfSettings || { agencyName: "LWS CYBER DEFENSE UNIT", watermark: true, showQr: true };

    toast.loading('Generating Investigation Report...', { id: 'pdf-toast' });
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      results.forEach((res, index) => {
        if (index > 0) pdf.addPage();
        
        // Agency Header Block
        pdf.setFillColor(15, 15, 15);
        pdf.rect(0, 0, pageWidth, 45, 'F');

        // Verification Badge
        pdf.setDrawColor(147, 51, 234);
        pdf.setLineWidth(1);
        // @ts-ignore
        pdf.circle(pageWidth - 25, 22, 10, 'D');
        pdf.setTextColor(147, 51, 234);
        pdf.setFontSize(6);
        pdf.text("VERIFIED", pageWidth - 25, 21, { align: "center" });
        pdf.text("SECURE", pageWidth - 25, 24, { align: "center" });

        // Agency Branding
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text(config.agencyName, 15, 22);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('INTELLIGENCE & INVESTIGATION DIVISION • PAKISTAN CRIME REGISTRY', 15, 30);
        pdf.text(`CASE FILE NO: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 15, 35);

        // Watermark
        if (config.watermark) {
          pdf.saveGraphicsState();
          pdf.setTextColor(240, 240, 240);
          pdf.setFontSize(60);
          pdf.setFont('helvetica', 'bold');
          // @ts-ignore
          pdf.setGState(new pdf.GState({ opacity: 0.05 }));
          pdf.text("OFFICIAL REPORT", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
          pdf.restoreGraphicsState();
        }

        let yPos = 60;
        
        // Subject Summary Header
        pdf.setTextColor(147, 51, 234);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SUBJECT IDENTIFICATION DATA', 15, yPos);
        pdf.line(15, yPos + 2, 85, yPos + 2);
        
        yPos += 15;

        // Information Grid
        autoTable(pdf, {
          startY: yPos,
          theme: 'striped',
          head: [['Data Point', 'Verified Intelligence Value']],
          body: [
            ['FULL NAME', (res.name || res.full_name || 'N/A').toUpperCase()],
            ['CNIC IDENTITY', res.cnic || res.nic || 'N/A'],
            ['CONTACT NODE', res.phone || res.mobile || 'N/A'],
            ['OPERATOR ID', getOperator(res.phone || res.mobile || "").name],
            ['LAST KNOWN ADDRESS', (res.address || res.location || 'N/A').toUpperCase()]
          ],
          headStyles: { fillColor: [15, 15, 15], textColor: 255, fontSize: 10, cellPadding: 5 },
          bodyStyles: { textColor: 50, fontSize: 10, cellPadding: 8 },
          columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 50 } }
        });

        // Verification Stamp (Bottom Left)
        const finalY = (pdf as any).lastAutoTable.finalY + 30;
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(15, finalY - 10, 50, 25);
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(6);
        pdf.text("CERTIFIED DIGITAL RECORD", 40, finalY, { align: "center" });
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        pdf.text("VALIDATED", 40, finalY + 8, { align: "center" });

        // Sami Signature
        pdf.setFont("times", "bolditalic");
        pdf.setFontSize(14);
        pdf.setTextColor(80, 80, 80);
        pdf.text(appConfig.pdfSettings?.signatureText || "Mr Sami", pageWidth - 40, finalY + 2, { align: "center" });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text("OFFICER IN CHARGE", pageWidth - 65, finalY + 12);
        pdf.line(pageWidth - 70, finalY + 8, pageWidth - 15, finalY + 8);
      });

      pdf.save(`LWS_Report_${phoneNumber}.pdf`);
      toast.success('Investigation Report Generated', { id: 'pdf-toast' });
    } catch (err) {
      console.error(err);
      toast.error('PDF Generation Failed', { id: 'pdf-toast' });
    }
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

  // Auth Guard
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

      {/* System Announcement Ticker */}
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

      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-20"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3" onDoubleClick={() => setShowAdmin(true)}>
            {appConfig.logoUrl ? (
              <img src={appConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}4d` }}
              >
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
              <button onClick={() => setShowHistory(true)} className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors" title="Search History">
                <History className="w-5 h-5" />
              </button>
              <button onClick={() => setShowFavs(true)} className="p-2 text-amber-500/80 hover:text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors" title="Favorites">
                <Star className="w-5 h-5 fill-amber-500/20" />
              </button>
              <button onClick={() => setShowBulk(true)} className="p-2 text-blue-500/80 hover:text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors" title="Bulk Search">
                <FileSpreadsheet className="w-5 h-5" />
              </button>
            </div>

            <button onClick={handleLogout} className="p-2 text-red-500/60 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
            
            <a 
              href={WHATSAPP_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium ml-2"
            >
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span>Join</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className={cn(
              "inline-block px-4 py-1.5 rounded-full border mb-6 text-[10px] font-black uppercase tracking-[0.3em] font-sans shadow-lg",
              isVip 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10" 
                : "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/10"
            )}>
              {isVip ? "VIP UNLOCKED ACCESS" : "PREMIUM ACCESS ENABLED"}
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter mb-4 sm:mb-6 leading-tight">
              Search Any Number <br />
              <span className="text-white/40">With Precision.</span>
            </h2>
          </motion.div>

          {/* Search Bar */}
          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl">
                <div className="pl-4 text-white/40">
                  <Phone className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter phone number or CNIC"
                  className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-lg font-medium placeholder:text-white/20"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <button 
                  id="search-form-btn"
                  type="submit"
                  disabled={loading}
                  className="hover:opacity-90 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}4d` }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
            {/* Removed redundant visualizer for cleaner interface */}
            <div className="mt-8" />
          </motion.form>
        </div>

        {/* Scammer Alert */}
        {scammerAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-600 animate-pulse opacity-10 blur-3xl rounded-full" />
            <div className="relative bg-black/80 border-2 border-red-600/50 p-8 rounded-3xl text-center backdrop-blur-3xl shadow-2xl shadow-red-600/20">
              <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/40 rotate-12">
                 <Skull className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-black text-red-500 tracking-tighter mb-2 uppercase">⚠️ GLOBAL SCAMMER ALERT</h3>
              <div className="flex flex-col items-center gap-1 mb-6">
                <p className="text-4xl font-black text-white tracking-widest">{scammerAlert.phone}</p>
                <div className="h-1 w-20 bg-red-600/30 rounded-full" />
              </div>
              
              <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-2xl mb-8">
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-red-500 mb-2">Detailed Incident Report:</p>
                <p className="text-white font-bold leading-relaxed italic text-lg">"{scammerAlert.note}"</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                 <p className="text-[10px] text-white/30 uppercase tracking-widest font-black max-w-xs">
                   THIS ENTITY HAS BEEN PERMANENTLY BLACKLISTED FROM THE LWS ECOSYSTEM FOR FRAUDULENT ACTIVITY.
                 </p>
                 <a 
                   href={WHATSAPP_CHANNEL} 
                   target="_blank" 
                   className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl"
                 >
                   Report Similar Activity
                 </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 mb-8"
            >
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-6">
              {/* AI Details Box */}
              <div 
                className="mb-8 p-4 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{ backgroundColor: `${primaryColor}1a`, borderColor: `${primaryColor}33` }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${primaryColor}33` }}>
                    <CheckCircle className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1" style={{ color: primaryColor }}>AI Intel Summary</h4>
                    <p className="text-[11px] text-white/80 leading-relaxed max-w-2xl italic">
                      "{summary || `Found ${results.length} total numbers. Generating deep analysis...`}"
                    </p>
                  </div>
                </div>
                <button 
                  onClick={downloadPDF}
                  className="shrink-0 flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-200 text-black font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                >
                  <Download className="w-4 h-4" /> Investigation Report
                </button>
              </div>

              {/* Records */}
              <div id="search-results-area" className="space-y-12">
                {results.map((res, index) => (
                  <RecordCard data={res} index={index + 1} key={index} />
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Features */}
        {!results && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20">
            <Feature icon={Zap} title="Instant Results" desc="Get real-time data from our high-speed database nodes." />
            <Feature icon={ShieldCheck} title="Secure Access" desc="End-to-end encrypted lookups for maximum privacy." />
            <Feature icon={ExternalLink} title="Map Integration" desc="Visualize addresses instantly with built-in map support." />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 md:hidden flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button onClick={() => setShowHistory(true)} className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
          <History className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">History</span>
        </button>
        <button onClick={() => setShowFavs(true)} className="flex flex-col items-center gap-1 text-amber-500/60 hover:text-amber-500 transition-colors">
          <Star className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Favs</span>
        </button>
        <div className="relative -top-3">
           <button 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
             className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10"
             style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}66` }}
           >
             <Search className="w-6 h-6 text-white" />
           </button>
        </div>
        <button onClick={() => setShowBulk(true)} className="flex flex-col items-center gap-1 text-blue-500/60 hover:text-blue-500 transition-colors">
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Bulk</span>
        </button>
        <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-emerald-500/60 hover:text-emerald-500 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Support</span>
        </a>
      </div>

      <div className="pb-24 md:pb-0" /> {/* Spacer for bottom nav */}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <span className="font-bold tracking-tight">{appConfig.toolName}</span>
          </div>
          
          <p className="text-white/40 text-sm max-w-md mb-8">
            The most advanced SIM database lookup tool in Pakistan. 
            Join our community for updates and premium features.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href={WHATSAPP_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(147,51,234,0.2)]"
            >
              <MessageCircle className="w-5 h-5" />
              Join WhatsApp Channel
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col items-center gap-5 text-[10px] uppercase tracking-[0.3em] font-bold">
            <p className="text-white/20">&copy; 2024 LWS DATABASE &bull; ALL RIGHTS RESERVED</p>
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/20 normal-case tracking-normal">This Tool is developed by</span>
              <a 
                href="https://whatsapp.com/channel/0029Vb688BZ6GcGO9OwJc621" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-2 bg-purple-600/10 border border-purple-500/20 rounded-full text-purple-400 hover:text-white hover:bg-purple-600 transition-all hover:scale-105 normal-case tracking-normal font-black"
              >
                Learn With Sami | LWS
              </a>
            </div>
          </div>
          {/* Extra spacer for mobile footer visibility above the bottom nav */}
          <div className="h-20 md:hidden" />
        </div>
      </footer>

      {/* Modals */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} onSelect={selectHistoryItem} />}
      {showFavs && <FavoritesPanel onClose={() => setShowFavs(false)} onSelect={selectFavItem} />}
      {showBulk && <BulkSearch onClose={() => setShowBulk(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

interface RecordCardProps {
  data: SimData;
  index: number;
  key?: any;
}

function RecordCard({ data, index }: RecordCardProps) {
  const { toggleFavorite, isFavorite, appConfig, user, isVipUser } = useAppStore();
  const isFav = isFavorite(data);
  const isVip = isVipUser(user?.email);
  const isPaid = appConfig.isPaidMode && !isVip;

  const operator = getOperator(data.phone || data.mobile || "");
  
  const getRiskLevel = (phoneStr: string) => {
    if (!phoneStr) return { level: 'Unknown', color: 'text-white/40', icon: ShieldCheck };
    const cleanNum = phoneStr.replace(/\D/g, '');
    
    // Check if number is in scammer list
    const scammerMatch = appConfig.scammers?.find((s: any) => s.phone === cleanNum);
    if (scammerMatch) {
      return { 
        level: '⚠️ CONFIRMED SCAMMER', 
        color: 'text-red-500 font-black animate-pulse', 
        icon: ShieldAlert,
        note: scammerMatch.note || 'Manually flagged as malicious entity'
      };
    }

    const lastDigit = parseInt(cleanNum.slice(-1) || '0');
    if (lastDigit > 7) return { level: 'High Risk (Spam/Scam)', color: 'text-red-500', icon: ShieldAlert };
    if (lastDigit > 4) return { level: 'Medium Risk (Suspicious)', color: 'text-yellow-500', icon: AlertCircle };
    return { level: 'Low Risk (Safe)', color: 'text-emerald-500', icon: ShieldCheck };
  };

  const [center, setCenter] = useState<[number, number]>([30.3753, 69.3451]);
  const [geoStatus, setGeoStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [normalizedAddr, setNormalizedAddr] = useState<string>("");
  
  const [copied, setCopied] = useState(false);
  const rawAddress = data.address || data.location || data.city || "";
  const name = data.name || data.full_name || "N/A";
  const cnic = data.cnic || data.nic || "N/A";
  const mobile = data.phone || data.mobile || "N/A";

  const risk = getRiskLevel(mobile);
  const RiskIcon = risk.icon;

  const geocode = async (query: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=pk`);
      if (res.data && res.data.length > 0) {
        setCenter([parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)]);
        setGeoStatus('success');
        return true;
      }
      return false;
    } catch (err) {
      console.error("Geocoding error:", err);
      return false;
    }
  };

  const tryGeocode = async () => {
    if (!rawAddress) {
      setGeoStatus('failed');
      return;
    }

    setGeoStatus('loading');

    try {
      const staggerDelay = (index - 1) * 300;
      await new Promise(resolve => setTimeout(resolve, staggerDelay));
      const queries = await normalizeAddress(rawAddress);
      setNormalizedAddr(queries[0] || rawAddress);

      let success = false;
      for (const query of queries) {
        success = await geocode(query);
        if (success) break;
      }
      
      if (!success) {
        success = await geocode(`${rawAddress}, Pakistan`);
      }

      if (!success) setGeoStatus('failed');
    } catch (err) {
      console.error("Error in tryGeocode:", err);
      setGeoStatus('failed');
    }
  };

  useEffect(() => {
    tryGeocode();
  }, [rawAddress]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedAddr || rawAddress + " Pakistan")}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(googleMapsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

    const shareOnWhatsApp = () => {
      const text = `*${appConfig.toolName} - Record Analysis*\n\n` +
        `👤 *Name:* ${data.name || data.full_name}\n` +
        `📱 *Mobile:* ${data.phone || data.mobile}\n` +
        `🆔 *CNIC:* ${data.cnic || data.nic}\n` +
        `🏠 *Address:* ${data.address || 'N/A'}\n` +
        `🌐 *Network:* ${data.network || data.operator || 'N/A'}\n\n` +
        `🔗 *Generated by:* ${window.location.host}`;
      
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group"
    >
      <div 
        className="py-3 px-6 text-center border-b border-white/10 flex items-center justify-between"
        style={{ backgroundColor: useAppStore().appConfig.primaryColor || "#9333ea" }}
      >
        <h3 className="text-lg font-bold uppercase tracking-widest text-white">Record {index}</h3>
        <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-md ${operator.bg} border border-white/5 flex items-center gap-1.5`}>
               <div className={`w-1.5 h-1.5 rounded-full ${operator.color.replace('text-', 'bg-')} animate-pulse`} />
               <span className={`text-[9px] font-black tracking-tighter uppercase ${operator.color}`}>{operator.name}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 bg-black/60 rounded-full border border-white/20 shadow-lg`}>
              <RiskIcon className={`w-3.5 h-3.5 ${risk.color}`} />
              <span className={`text-[10px] font-black tracking-wider uppercase ${risk.color}`}>{risk.level}</span>
            </div>
        </div>
      </div>

      <div className={`relative ${isPaid ? 'blur-md pointer-events-none select-none overflow-hidden h-[300px]' : ''}`}>
        <div className="divide-y divide-white/5 bg-black/40">
          <DataRow label="NAME" value={name} />
          <DataRow label="CNIC" value={cnic} />
          <DataRow label="MOBILE" value={mobile} />
          <DataRow label="ADDRESS" value={rawAddress} />
          {risk.note && (
            <div className="px-6 py-4 bg-red-500/10 border-t border-white/5 animate-in slide-in-from-left-2 duration-300">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Scammer Report Note:</p>
              <p className="text-xs font-bold text-white/90 italic">"{risk.note}"</p>
            </div>
          )}
        </div>

      <div className="p-4 bg-black/60">
        <div className="relative h-[250px] rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow-inner">
          {geoStatus === 'loading' && (
            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white/60">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-500" />
              <p className="text-[10px] uppercase tracking-widest font-bold">AI Normalizing Address...</p>
            </div>
          )}
          
          {geoStatus === 'failed' ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-white/20 p-6 text-center">
              <MapPin className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-xs uppercase tracking-widest font-bold">Exact Location Not Found</p>
              <p className="text-[10px] mt-1">Try opening in Google Maps below</p>
            </div>
          ) : (
            <MapContainer 
              center={center} 
              zoom={13} 
              scrollWheelZoom={false}
              className="h-full w-full z-0"
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ChangeView center={center} />
              <Marker position={center}>
                <Popup>
                  <div className="text-black text-xs font-sans">
                    <strong className="block mb-1">{name}</strong>
                    <span className="opacity-70">{rawAddress}</span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          )}
          
          <a 
            href={googleMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute top-3 left-3 z-[1000] bg-white text-blue-600 px-3 py-1.5 rounded shadow-lg text-[10px] font-bold flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Open in Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>

      {/* Paid Mode Lock Overlay */}
      {isPaid && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-sm">
           <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
              <Lock className="w-10 h-10 text-white" />
           </div>
           <h3 className="text-2xl font-black mb-2 text-center tracking-tighter">PREMIUM RECORD LOCKED</h3>
           <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold mb-8 text-center px-4">
             Weekly: {appConfig.plans?.weekly || "300"} | Monthly: {appConfig.plans?.monthly || "1000"} | Yearly: {appConfig.plans?.yearly || "5000"}
           </p>
           
           <a 
              href={appConfig.contactInfo || "#"} 
              target="_blank"
              className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-black text-xs text-center shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
           >
              <MessageCircle className="w-5 h-5" /> UPGRADE TO VIP NOW
           </a>
        </div>
      )}

      <div className="p-4 pt-0 space-y-2 bg-black/60 relative z-10">
        <div className="grid grid-cols-2 gap-2">
          <button 
             onClick={() => toggleFavorite(data)}
             disabled={isPaid}
             className="py-3.5 bg-[#1a1a1a] hover:bg-[#222] text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all border border-white/5 disabled:opacity-50"
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} /> SAVE
          </button>
          <button 
             onClick={shareOnWhatsApp}
             disabled={isPaid}
             className="py-3.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all border border-emerald-500/20 disabled:opacity-50"
          >
             <Send className="w-4 h-4" /> SHARE
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a 
            href={isPaid ? "#" : googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`py-3.5 bg-[#1a1a1a] hover:bg-[#222] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center transition-all border border-white/5 ${isPaid ? 'opacity-50' : ''}`}
          >
            MAPS
          </a>
          <button 
            onClick={copyToClipboard}
            disabled={isPaid}
            className="py-3.5 bg-[#1a1a1a] hover:bg-[#222] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center transition-all border border-white/5 disabled:opacity-50"
          >
            {copied ? "COPIED!" : "LINK"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center px-6 py-4 transition-colors hover:bg-white/[0.03]">
      <div className="w-1/3 text-[11px] font-black tracking-tighter uppercase text-white">
        {label}
      </div>
      <div className="w-2/3 text-sm font-semibold tracking-tight text-white">
        {value || "N/A"}
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] transition-colors">
      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-emerald-500" />
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}
function AreaPoint({ icon: Icon, label, value }: any) {
  return (
    <div className="py-2 flex items-center justify-between">
       <div className="flex items-center gap-2">
          <Icon className="w-3 h-3 text-white/20" />
          <span className="text-[10px] text-white/40 font-bold uppercase">{label}</span>
       </div>
       <span className="text-[10px] font-mono text-emerald-500">{value}</span>
    </div>
  );
}
