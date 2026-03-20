import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './lib/supabase';

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
import { DEFAULT_CONFIG } from './config';

let globalUser: UserProfile | null = JSON.parse(localStorage.getItem('sim_user') || 'null');

// App Configuration (Branding & UI - id: 1)
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

// Dynamic Stats (Logs, Visitors, Security - id: 2)
let globalStats = JSON.parse(localStorage.getItem('sim_stats') || JSON.stringify({
  adminLogs: [],
  blockedIPs: [],
  maintenance: false,
  visitorCount: 0
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
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);

    const fetchRemoteData = async () => {
      try {
        if (!supabase) return;
        
        // Fetch Row 1 (Config)
        const { data: configData } = await supabase.from('settings').select('config').eq('id', 1).single();
        if (configData?.config) {
          globalAppConfig = { ...globalAppConfig, ...configData.config };
          localStorage.setItem('sim_app_config', JSON.stringify(globalAppConfig));
        }

        // Fetch Row 2 (Stats)
        const { data: statsData } = await supabase.from('settings').select('config').eq('id', 2).single();
        if (statsData?.config) {
          globalStats = { ...globalStats, ...statsData.config };
          localStorage.setItem('sim_stats', JSON.stringify(globalStats));
        }

        notify();
      } catch (e: any) {
        console.error('❌ Supabase Fetch Error:', e.message);
      }
    };
    
    fetchRemoteData();

    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          (payload) => {
            const id = (payload.new as any)?.id;
            const newConfig = (payload.new as any)?.config;
            if (newConfig) {
              if (id === 1) {
                globalAppConfig = { ...globalAppConfig, ...newConfig };
                localStorage.setItem('sim_app_config', JSON.stringify(globalAppConfig));
              } else if (id === 2) {
                globalStats = { ...globalStats, ...newConfig };
                localStorage.setItem('sim_stats', JSON.stringify(globalStats));
              }
              notify();
            }
          }
        )
        .subscribe();
    }

    return () => { 
      listeners.delete(listener); 
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, []);

  const addHistory = (query: string, results: SimData[]) => {
    globalHistory = [{ query, date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(), results }, ...globalHistory].slice(0, 50);
    localStorage.setItem('sim_history', JSON.stringify(globalHistory));
    if (globalUser) addAdminLog(query);
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
    const updatedLogs = [newLog, ...(globalStats.adminLogs || [])].slice(0, 100);
    updateStatsConfig({ adminLogs: updatedLogs });
  };

  const incrementVisitors = () => {
    const newCount = (globalStats.visitorCount || 0) + 1;
    updateStatsConfig({ visitorCount: newCount });
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
    const current = globalStats.blockedIPs || [];
    const updated = typeof val === 'function' ? val(current) : val;
    updateStatsConfig({ blockedIPs: updated });
  };

  const setMaintenance = (val: boolean | ((prev: boolean) => boolean)) => {
    const current = globalStats.maintenance || false;
    const updated = typeof val === 'function' ? val(current) : val;
    updateStatsConfig({ maintenance: updated });
  };

  const setUser = (user: UserProfile | null) => {
    globalUser = user;
    localStorage.setItem('sim_user', JSON.stringify(user));
    notify();
  };

  const updateAppConfig = (config: any) => {
    globalAppConfig = { ...globalAppConfig, ...config };
    localStorage.setItem('sim_app_config', JSON.stringify(globalAppConfig));
    if (supabase) {
      supabase.from('settings').upsert({ id: 1, config: globalAppConfig }).then();
    }
    notify();
  };

  const updateStatsConfig = (config: any) => {
    globalStats = { ...globalStats, ...config };
    localStorage.setItem('sim_stats', JSON.stringify(globalStats));
    if (supabase) {
      supabase.from('settings').upsert({ id: 2, config: globalStats }).then();
    }
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
    blockedIPs: globalStats.blockedIPs || [], setBlockedIPs,
    maintenance: globalStats.maintenance || false, setMaintenance,
    adminLogs: globalStats.adminLogs || [],
    visitorCount: globalStats.visitorCount || 0,
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
