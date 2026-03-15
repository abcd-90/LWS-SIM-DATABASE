import { useState, useEffect } from 'react';
import axios from 'axios';

export interface SimData {
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

export interface AdminLog {
  id: string;
  userEmail: string;
  query: string;
  timestamp: string;
  ip?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

// Global state
let globalHistory = JSON.parse(localStorage.getItem('sim_history') || '[]');
let globalFavorites = JSON.parse(localStorage.getItem('sim_favorites') || '[]');
let globalBlockedIPs = JSON.parse(localStorage.getItem('sim_blocked_ips') || '[]');
let globalMaintenance = localStorage.getItem('sim_maintenance') === 'true';
let globalAdminLogs = JSON.parse(localStorage.getItem('sim_admin_logs') || '[]');
import { DEFAULT_CONFIG } from './config';

let globalVisitorCount = parseInt(localStorage.getItem('sim_visitor_count') || '0');
let globalUser: UserProfile | null = JSON.parse(localStorage.getItem('sim_user') || 'null');

// App Configuration (Branding & UI)
let globalAppConfig = JSON.parse(localStorage.getItem('sim_app_config') || JSON.stringify({
  toolName: "LWS Sim Database",
  channelLink: "https://www.whatsapp.com/channel/0029Vb688BZ6GcGO9OwJc621",
  primaryColor: "#9333ea", // Purple 600
  secondaryColor: "#3b82f6", // Blue 500
  fontStyle: "font-sans",
  logoUrl: "",
  announcement: "Welcome to LWS Database! Fresh 2024 records added. Contact admin for premium access.",
  isPaidMode: false,
  price: "999",
  plans: {
    weekly: "300",
    monthly: "1000",
    yearly: "5000"
  },
  contactInfo: "https://wa.link/8sind5",
  apiEndpoint: "/api/lookup",
  scraperMessage: "Thanks for trying! Now contact Mr Sami for buying the VIP source code.",
  scraperContact: "https://wa.link/8sind5",
  scammers: [] as { phone: string, note: string }[],
  apiNodes: [
    { id: 'primary', name: 'Ultra-Search Alpha', url: '/api/lookup', active: true },
    { id: 'backup', name: 'Cloud-Sync Beta', url: '/api/backup', active: false }
  ],
  pdfSettings: {
    agencyName: "LWS CYBER DEFENSE UNIT",
    signatureText: "Mr Sami",
    watermark: true,
    showQr: true
  }
}));

let globalVipUsers = JSON.parse(localStorage.getItem('sim_vip_users') || '[]');

let globalAdminSettings = JSON.parse(localStorage.getItem('sim_admin_settings') || JSON.stringify({
  username: "admin",
  password: "lws-admins-786"
}));

let globalIsAdminAuth = false; // Session-based admin login

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(l => l());
}

export function useAppStore() {
  // Dummy state to trigger re-renders
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);

    // Initial Remote Fetch
    const fetchRemoteConfig = async () => {
      try {
        const res = await axios.get('/api/config');
        if (res.data && Object.keys(res.data).length > 0) {
          globalAppConfig = { ...globalAppConfig, ...res.data };
          notify();
        }
      } catch (e) {
        console.warn('Vercel KV not connected, using LocalStorage/Static config.');
      }
    };
    fetchRemoteConfig();

    return () => { listeners.delete(listener); };
  }, []);

  const addHistory = (query: string, results: SimData[]) => {
    globalHistory = [{ query, date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(), results }, ...globalHistory].slice(0, 50);
    localStorage.setItem('sim_history', JSON.stringify(globalHistory));
    
    // Also add to Admin Logs
    if (globalUser) {
      addAdminLog(query);
    }
    
    notify();
  };

  const addAdminLog = (query: string) => {
    const newLog: AdminLog = {
      id: Math.random().toString(36).substr(2, 9),
      userEmail: globalUser?.email || 'Anonymous',
      query: query,
      timestamp: new Date().toLocaleString(),
      ip: 'Detected'
    };
    globalAdminLogs = [newLog, ...globalAdminLogs].slice(0, 100);
    localStorage.setItem('sim_admin_logs', JSON.stringify(globalAdminLogs));
    notify();
  };

  const incrementVisitors = () => {
    globalVisitorCount += 1;
    localStorage.setItem('sim_visitor_count', globalVisitorCount.toString());
    notify();
  };

  const toggleFavorite = (record: SimData) => {
    const exists = globalFavorites.find((p: SimData) => p.mobile === record.mobile || p.cnic === record.cnic);
    if (exists) {
      globalFavorites = globalFavorites.filter((p: SimData) => p.mobile !== record.mobile && p.cnic !== record.cnic);
    } else {
      globalFavorites = [record, ...globalFavorites];
    }
    localStorage.setItem('sim_favorites', JSON.stringify(globalFavorites));
    notify();
  };

  const isFavorite = (record: SimData) => {
    return globalFavorites.some((p: SimData) => p.mobile === record.mobile || p.cnic === record.cnic);
  };

  const setBlockedIPs = (val: string[] | ((prev: string[]) => string[])) => {
    globalBlockedIPs = typeof val === 'function' ? val(globalBlockedIPs) : val;
    localStorage.setItem('sim_blocked_ips', JSON.stringify(globalBlockedIPs));
    notify();
  };

  const setMaintenance = (val: boolean | ((prev: boolean) => boolean)) => {
    globalMaintenance = typeof val === 'function' ? val(globalMaintenance) : val;
    localStorage.setItem('sim_maintenance', globalMaintenance.toString());
    notify();
  };

  const setUser = (user: UserProfile | null) => {
    globalUser = user;
    localStorage.setItem('sim_user', JSON.stringify(user));
    notify();
  };

  const updateAppConfig = (config: { 
    toolName?: string, 
    channelLink?: string,
    primaryColor?: string,
    secondaryColor?: string,
    fontStyle?: string,
    logoUrl?: string,
    announcement?: string,
    isPaidMode?: boolean,
    price?: string,
    plans?: { weekly: string, monthly: string, yearly: string },
    contactInfo?: string,
    apiEndpoint?: string,
    scraperMessage?: string,
    scraperContact?: string,
    scammers?: { phone: string, note: string }[],
    apiNodes?: { id: string, name: string, url: string, active: boolean }[],
    pdfSettings?: { agencyName: string, signatureText: string, watermark: boolean, showQr: boolean }
  }) => {
    globalAppConfig = { ...globalAppConfig, ...config };
    localStorage.setItem('sim_app_config', JSON.stringify(globalAppConfig));
    
    // Remote Push
    axios.post('/api/config', globalAppConfig).catch(e => console.warn('Sync failed: Vercel KV missing.'));
    
    notify();
  };

  const updateAdminSettings = (settings: any) => {
    globalAdminSettings = settings;
    localStorage.setItem('sim_admin_settings', JSON.stringify(settings));
    notify();
  };

  const setAdminAuth = (val: boolean) => {
    globalIsAdminAuth = val;
    notify();
  };

  const addVipUser = (email: string, duration: 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date();
    const expiry = new Date();
    if (duration === 'weekly') expiry.setDate(now.getDate() + 7);
    if (duration === 'monthly') expiry.setMonth(now.getMonth() + 1);
    if (duration === 'yearly') expiry.setFullYear(now.getFullYear() + 1);

    const newUser = { email, expiry: expiry.getTime(), plan: duration };
    globalVipUsers = [...globalVipUsers.filter((u: any) => u.email !== email), newUser];
    localStorage.setItem('sim_vip_users', JSON.stringify(globalVipUsers));
    notify();
  };

  const isVipUser = (email: string) => {
    const user = globalVipUsers.find((u: any) => u.email === email);
    if (!user) return false;
    return new Date().getTime() < user.expiry;
  };

  return {
    history: globalHistory, addHistory,
    favorites: globalFavorites, toggleFavorite, isFavorite,
    blockedIPs: globalBlockedIPs, setBlockedIPs,
    maintenance: globalMaintenance, setMaintenance,
    adminLogs: globalAdminLogs,
    visitorCount: globalVisitorCount,
    incrementVisitors,
    user: globalUser, setUser,
    appConfig: globalAppConfig, updateAppConfig,
    adminSettings: globalAdminSettings, updateAdminSettings,
    isAdminAuth: globalIsAdminAuth, setAdminAuth,
    vipUsers: globalVipUsers,
    addVipUser,
    isVipUser
  };
}
