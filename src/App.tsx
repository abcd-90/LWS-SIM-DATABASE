import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { normalizeAddress } from './services/gemini';
import { 
  Search, 
  Phone, 
  User, 
  MapPin, 
  CreditCard, 
  Network, 
  ExternalLink, 
  ShieldCheck, 
  Zap,
  MessageCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
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

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let searchPhone = phoneNumber.trim();
      let response = await axios.get(`/api/lookup?phone=${searchPhone}`);
      let data = response.data;
      
      // If first attempt fails and number starts with 0, try without leading 0
      if ((!data || !data.success || !data.result || data.result.length === 0) && searchPhone.startsWith('0')) {
        const altPhone = searchPhone.substring(1);
        const altResponse = await axios.get(`/api/lookup?phone=${altPhone}`);
        if (altResponse.data && altResponse.data.success && altResponse.data.result && altResponse.data.result.length > 0) {
          data = altResponse.data;
        }
      }

      if (data && data.success === true && Array.isArray(data.result) && data.result.length > 0) {
        setResults(data.result);
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

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 font-sans">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)]">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LWS <span className="text-purple-500">DATABASE</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">VIP SIM TRACKER PRO</p>
            </div>
          </div>
          
          <a 
            href={WHATSAPP_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-xs sm:text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">Join Channel</span>
            <span className="sm:hidden">Join</span>
          </a>
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
            <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-purple-500/20 mb-6">
              Premium Access Enabled
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 leading-tight">
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
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(147,51,234,0.2)]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </motion.form>
        </div>

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
            <div className="space-y-12">
              {results.map((res, index) => (
                <RecordCard key={index} data={res} index={index + 1} />
              ))}
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <span className="font-bold tracking-tight">LWS DATABASE</span>
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

          <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">
            <p>&copy; 2024 LWS DATABASE &bull; ALL RIGHTS RESERVED</p>
            <a 
              href="https://whatsapp.com/channel/0029Vb688BZ6GcGO9OwJc621" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-purple-500 transition-colors normal-case tracking-normal font-medium text-white/40"
            >
              This Tool is developed by Learn With Sami | LWS
            </a>
          </div>
        </div>
      </footer>
      {/* Floating WhatsApp Button */}
      <a 
        href={WHATSAPP_CHANNEL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(147,51,234,0.4)] hover:scale-110 transition-transform active:scale-95 group"
        aria-label="Join WhatsApp Channel"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="absolute right-full mr-3 px-3 py-1 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Join Channel
        </span>
      </a>
    </div>
  );
}

interface RecordCardProps {
  data: SimData;
  index: number;
  key?: React.Key;
}

function RecordCard({ data, index }: RecordCardProps) {
  const [center, setCenter] = useState<[number, number]>([30.3753, 69.3451]);
  const [geoStatus, setGeoStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [normalizedAddr, setNormalizedAddr] = useState<string>("");
  
  const [copied, setCopied] = useState(false);
  const rawAddress = data.address || data.location || data.city || "";
  const name = data.name || data.full_name || "N/A";
  const cnic = data.cnic || data.nic || "N/A";
  const mobile = data.phone || data.mobile || "N/A";

  const geocode = async (query: string) => {
    try {
      // Add a small delay to avoid rate limiting if multiple records are rendered
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
      // Add a staggered delay based on the index to avoid hitting Gemini rate limits
      // if multiple cards mount at once.
      const staggerDelay = (index - 1) * 300;
      await new Promise(resolve => setTimeout(resolve, staggerDelay));

      // Step 1: Normalize with Gemini to get multiple potential queries
      const queries = await normalizeAddress(rawAddress);
      setNormalizedAddr(queries[0] || rawAddress);

      // Step 2: Try each query in order of specificity
      let success = false;
      for (const query of queries) {
        success = await geocode(query);
        if (success) break;
      }
      
      // Step 3: Fallback - Try raw address if all Gemini-suggested queries failed
      if (!success) {
        success = await geocode(`${rawAddress}, Pakistan`);
      }

      if (!success) setGeoStatus('failed');
    } catch (err) {
      console.error("Error in tryGeocode:", err);
      setGeoStatus('failed');
    }
  };

  React.useEffect(() => {
    tryGeocode();
  }, [rawAddress]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedAddr || rawAddress + " Pakistan")}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(googleMapsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Record Header */}
      <div className="bg-purple-700 py-3 text-center border-b border-white/10">
        <h3 className="text-lg font-bold uppercase tracking-widest text-white">Record {index}</h3>
      </div>

      {/* Data Rows */}
      <div className="divide-y divide-white/5 bg-black/40">
        <DataRow label="NAME" value={name} />
        <DataRow label="CNIC" value={cnic} />
        <DataRow label="MOBILE" value={mobile} />
        <DataRow label="ADDRESS" value={rawAddress} />
      </div>

      {/* Map Section */}
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
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
          
          {/* Open in Maps Overlay Button */}
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

      {/* Action Buttons */}
      <div className="p-4 pt-0 space-y-2 bg-black/60">
        <a 
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 bg-[#1a1a1a] hover:bg-[#222] text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center transition-all border border-white/5 active:scale-[0.98]"
        >
          OPEN IN GOOGLE MAPS
        </a>
        <button 
          onClick={copyToClipboard}
          className="w-full py-3.5 bg-[#1a1a1a] hover:bg-[#222] text-emerald-500 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center transition-all border border-white/5 active:scale-[0.98]"
        >
          {copied ? "COPIED TO CLIPBOARD!" : "COPY MAP LINK"}
        </button>
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
