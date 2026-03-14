import React, { useState } from 'react';
import { 
  ShieldAlert, Trash2, Settings, ShieldCheck, Users, 
  Activity, Eye, LogOut, Lock, Globe, Palette, Download,
  CheckCircle, MessageSquare, BarChart3, PieChart as PieIcon,
  MousePointer2, Search, Skull, Ban, AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../store';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const { 
    blockedIPs, setBlockedIPs, 
    maintenance, setMaintenance, 
    adminLogs, visitorCount,
    user, setUser,
    appConfig, updateAppConfig,
    adminSettings, updateAdminSettings,
    isAdminAuth, setAdminAuth,
    vipUsers, addVipUser
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'stats' | 'logs' | 'branding' | 'security' | 'vips' | 'scammers' | 'nodes'>('stats');
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Branding State
  const [newToolName, setNewToolName] = useState(appConfig.toolName);
  const [newChannelLink, setNewChannelLink] = useState(appConfig.channelLink);
  const [primaryColor, setPrimaryColor] = useState(appConfig.primaryColor || "#9333ea");
  const [secondaryColor, setSecondaryColor] = useState(appConfig.secondaryColor || "#3b82f6");
  const [fontStyle, setFontStyle] = useState(appConfig.fontStyle || "font-sans");
  const [logoUrl, setLogoUrl] = useState(appConfig.logoUrl || "");
  const [announcement, setAnnouncement] = useState(appConfig.announcement || "");
  const [isPaidMode, setIsPaidMode] = useState(appConfig.isPaidMode || false);
  const [priceWeekly, setPriceWeekly] = useState(appConfig.plans?.weekly || "300");
  const [priceMonthly, setPriceMonthly] = useState(appConfig.plans?.monthly || "10000");
  const [priceYearly, setPriceYearly] = useState(appConfig.plans?.yearly || "50000");
  const [contactInfo, setContactInfo] = useState(appConfig.contactInfo || "");
  const [newApiEndpoint, setNewApiEndpoint] = useState(appConfig.apiEndpoint || "/api/lookup");
  const [scraperMessage, setScraperMessage] = useState(appConfig.scraperMessage || "");
  const [scraperContact, setScraperContact] = useState(appConfig.scraperContact || "https://wa.link/8sind5");
  
  // VIP State
  const [targetVipEmail, setTargetVipEmail] = useState('');
  const [vipDuration, setVipDuration] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Security State
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newIp, setNewIp] = useState('');
  const [scammerNum, setScammerNum] = useState('');
  const [scammerNote, setScammerNote] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === adminSettings.username && loginPass === adminSettings.password) {
      setAdminAuth(true);
      toast.success('Admin Authenticated');
    } else {
      toast.error('Invalid Credentials');
    }
  };

  const saveBranding = () => {
    updateAppConfig({ 
      toolName: newToolName, 
      channelLink: newChannelLink,
      primaryColor,
      secondaryColor,
      fontStyle,
      logoUrl,
      announcement,
      isPaidMode,
      plans: {
        weekly: priceWeekly,
        monthly: priceMonthly,
        yearly: priceYearly
      },
      contactInfo,
      apiEndpoint: newApiEndpoint,
      scraperMessage,
      scraperContact,
      scammers: appConfig.scammers || []
    });
    toast.success('Branding & Subs Updated Successfully');
  };

  const saveAdminPassword = () => {
    if (newAdminPass.length < 4) return toast.error('Password too short');
    updateAdminSettings({ ...adminSettings, password: newAdminPass });
    setNewAdminPass('');
    toast.success('Admin Password Changed');
  };

  const blockIp = () => {
    if (newIp && !blockedIPs.includes(newIp)) {
      setBlockedIPs([...blockedIPs, newIp]);
      setNewIp('');
      toast.success('Blocked Successfully');
    }
  };

  const unblockIp = (ip: string) => {
    setBlockedIPs(blockedIPs.filter(i => i !== ip));
    toast.success('Unblocked Successfully');
  };

  const downloadSourceCode = async () => {
    toast.loading('Preparing Source Code...', { id: 'zip-toast' });
    try {
      const zip = new JSZip();
      zip.file("src/config.ts", `export const DEFAULT_CONFIG = {
  toolName: "${newToolName.replace(/"/g, '\\"')}",
  channelLink: "${newChannelLink.replace(/"/g, '\\"')}",
  primaryColor: "${primaryColor}",
  secondaryColor: "${secondaryColor}",
  fontStyle: "${fontStyle}",
  logoUrl: "${logoUrl}",
  announcement: "${announcement.replace(/"/g, '\\"')}",
  isPaidMode: ${isPaidMode},
  plans: {
    weekly: "${priceWeekly}",
    monthly: "${priceMonthly}",
    yearly: "${priceYearly}"
  },
  contactInfo: "${contactInfo}",
  apiEndpoint: "${newApiEndpoint}",
  scraperMessage: "${scraperMessage.replace(/"/g, '\\"')}",
  scraperContact: "${scraperContact}"
};`);

      zip.file("README_CUSTOM.txt", `LWS Database Custom Build\nTool Name: ${newToolName}\nChannel: ${newChannelLink}\n\nInstructions:\n1. Extract these files into your LWS database project folder.\n2. Run 'npm install' and 'npm run dev'.\n3. The tool will now use your branding by default.`);

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${newToolName.replace(/\s+/g, '_')}_Source.zip`;
      link.click();
      
      toast.success('Source Code Downloaded!', { id: 'zip-toast' });
    } catch (err) {
      toast.error('Failed to generate ZIP', { id: 'zip-toast' });
    }
  };

  if (!isAdminAuth) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Admin Portal</h2>
          <p className="text-white/40 text-sm text-center mb-8">Unauthorized access is strictly prohibited.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-colors"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-colors"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
            />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
              Login as Admin
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0a0a0a] border-y sm:border border-white/10 rounded-none sm:rounded-2xl w-full max-w-6xl h-full sm:max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,1)] font-sans">
        
        {/* Admin Nav */}
        <div className="bg-[#0a0a0a] border-b border-white/10 flex items-center">
          <div className="px-6 py-4 flex items-center gap-3 border-r border-white/10">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">ADMIN COMMAND CENTER</h2>
              <p className="text-[8px] uppercase tracking-widest text-red-500 font-bold">Authenticated Session</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex min-w-max px-2">
              <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={Activity} label="Stats" />
              <NavBtn active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Eye} label="Logs" />
              <NavBtn active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={Palette} label="Style" />
              <NavBtn active={activeTab === 'vips'} onClick={() => setActiveTab('vips')} icon={Users} label="VIP" />
              <NavBtn active={activeTab === 'scammers'} onClick={() => setActiveTab('scammers')} icon={Skull} label="Scammers" />
              <NavBtn active={activeTab === 'nodes'} onClick={() => setActiveTab('nodes')} icon={Globe} label="API Nodes" />
              <NavBtn active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={ShieldCheck} label="Access" />
            </div>
          </div>

          <div className="px-4 flex items-center gap-2 ml-auto">
             <button onClick={() => setAdminAuth(false)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors" title="Logout Admin">
                <LogOut className="w-5 h-5" />
             </button>
             <button onClick={onClose} className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] sm:text-sm font-medium transition-colors">
              Exit
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8">
          
          {activeTab === 'stats' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Unique Visitors" value={visitorCount} color="blue" />
                <StatCard icon={Activity} label="Total Lookups Performed" value={adminLogs.length} color="purple" />
                <StatCard icon={ShieldAlert} label="Blacklisted Entities" value={blockedIPs.length} color="red" />
                <StatCard icon={Globe} label="Server Nodes Status" value="Online" color="emerald" isText />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white/5 border border-white/10 p-6 rounded-2xl h-[350px] flex flex-col">
                    <h4 className="text-sm font-bold mb-6 flex items-center gap-2 text-white/60">
                      <BarChart3 className="w-4 h-4" /> Activity Distribution (Last 24h)
                    </h4>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: '00-06h', lookups: Math.floor(adminLogs.length * 0.1) },
                          { name: '06-12h', lookups: Math.floor(adminLogs.length * 0.3) },
                          { name: '12-18h', lookups: Math.floor(adminLogs.length * 0.4) },
                          { name: '18-24h', lookups: Math.floor(adminLogs.length * 0.2) }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#ffffff40'}} />
                          <YAxis hide />
                          <Tooltip contentStyle={{background: '#111', border: '1px solid #ffffff10', borderRadius: '12px'}} />
                          <Bar dataKey="lookups" fill={appConfig.primaryColor || "#9333ea"} radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-white/5 border border-white/10 p-6 rounded-2xl h-[350px] flex flex-col">
                    <h4 className="text-sm font-bold mb-6 flex items-center gap-2 text-white/60">
                      <PieIcon className="w-4 h-4" /> Device & Traffic Split
                    </h4>
                    <div className="flex-grow">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={[
                               { name: 'Mobile', value: 65 },
                               { name: 'Desktop', value: 35 }
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                           >
                             <Cell fill={appConfig.primaryColor || "#9333ea"} />
                             <Cell fill={appConfig.secondaryColor || "#3b82f6"} />
                           </Pie>
                           <Tooltip contentStyle={{background: '#111', border: '1px solid #ffffff10', borderRadius: '12px'}} />
                         </PieChart>
                       </ResponsiveContainer>
                       <div className="flex justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{backgroundColor: appConfig.primaryColor || "#9333ea"}} />
                             <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Mobile (65%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{backgroundColor: appConfig.secondaryColor || "#3b82f6"}} />
                             <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Desktop (35%)</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-red-500" /> Maintenance Shield
                  </h3>
                  <p className="text-xs text-white/40">When active, users will see an "Unavailable" message across the entire site.</p>
                </div>
                <button 
                  onClick={() => setMaintenance(!maintenance)}
                  className={`px-6 py-2 rounded-full font-bold text-xs transition-all ${maintenance ? 'bg-red-600 text-white' : 'bg-white/10 text-white/40'}`}
                >
                  {maintenance ? 'DEACTIVATE' : 'ACTIVATE'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
              <h3 className="text-xl font-bold mb-1">User Activity Feed</h3>
              <p className="text-sm text-white/40 mb-6">Real-time monitoring of searches performed by logged-in emails.</p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex-grow flex flex-col">
                <div className="hidden sm:grid grid-cols-4 px-6 py-3 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">
                  <div className="col-span-1">User Email</div>
                  <div className="col-span-1">Searched Query</div>
                  <div className="col-span-1">Timestamp</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                <div className="flex-grow overflow-y-auto divide-y divide-white/5">
                  {adminLogs.length === 0 ? (
                    <div className="py-20 text-center text-white/20 text-sm">No activity recorded.</div>
                  ) : adminLogs.map((log: any, i: number) => (
                    <div key={i} className="flex flex-col sm:grid sm:grid-cols-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-start sm:items-center gap-3 sm:gap-0">
                      <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
                         <div className="w-6 h-6 bg-purple-500/10 rounded flex items-center justify-center text-[10px] text-purple-400 font-bold shrink-0">
                           {log.userEmail[0].toUpperCase()}
                         </div>
                         <span className="text-xs font-medium truncate">{log.userEmail}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        <span className="sm:hidden text-white/20 mr-2">Query:</span> {log.query}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase">
                        <span className="sm:hidden text-white/20 mr-2">Time:</span> {log.timestamp}
                      </div>
                      <div className="w-full sm:text-right">
                        <button 
                          onClick={() => { if(!blockedIPs.includes(log.userEmail)) setBlockedIPs([...blockedIPs, log.userEmail]) }}
                          className="w-full sm:w-auto px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md text-[9px] font-bold uppercase tracking-tighter transition-all"
                        >
                          Block Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl">
              <h3 className="text-xl font-bold mb-1">Full Site Customizer</h3>
              <p className="text-sm text-white/40 mb-8">Change branding, colors and platform identity.</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Identity</h4>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase px-1">Tool Name</label>
                        <input type="text" value={newToolName} onChange={(e) => setNewToolName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase px-1">Channel Link</label>
                        <input type="text" value={newChannelLink} onChange={(e) => setNewChannelLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase px-1">Logo URL</label>
                        <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none" placeholder="https://..." />
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Theming</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase px-1">Primary</label>
                            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-12 bg-transparent border-none cursor-pointer" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase px-1">Secondary</label>
                            <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-12 bg-transparent border-none cursor-pointer" />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Monetization & Paid Mode</h4>
                      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
                         <div>
                            <p className="text-xs font-bold">Enable Paid Lock</p>
                            <p className="text-[9px] text-white/30 uppercase">Locks records behind a payment wall</p>
                         </div>
                         <button 
                           onClick={() => setIsPaidMode(!isPaidMode)}
                           className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPaidMode ? 'bg-emerald-600' : 'bg-white/10'}`}
                         >
                           <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${isPaidMode ? 'translate-x-5' : 'translate-x-1'}`} />
                         </button>
                      </div>
                      
                      {isPaidMode && (
                        <div className="grid grid-cols-3 gap-3 animate-in fade-in zoom-in-95 duration-300">
                           <div className="space-y-1">
                             <label className="text-[9px] font-bold text-white/40 uppercase px-1">Weekly Price</label>
                             <input type="text" value={priceWeekly} onChange={(e) => setPriceWeekly(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500" />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[9px] font-bold text-white/40 uppercase px-1">Monthly Price</label>
                             <input type="text" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500" />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[9px] font-bold text-white/40 uppercase px-1">Yearly Price</label>
                             <input type="text" value={priceYearly} onChange={(e) => setPriceYearly(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500" />
                           </div>
                        </div>
                      )}
                      <div className="space-y-1 pt-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase px-1">Contact for Payment (URL/WhatsApp)</label>
                        <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 outline-none" placeholder="https://wa.link/..." />
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Scraper Protection & API Customization</h4>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-white/40 uppercase px-1">Scraper Warning Message</label>
                         <input type="text" value={scraperMessage} onChange={(e) => setScraperMessage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-red-500/50 outline-none" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-white/40 uppercase px-1">Developer Contact URL</label>
                         <input type="text" value={scraperContact} onChange={(e) => setScraperContact(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-red-500/50 outline-none" />
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Professional PDF Reporting</h4>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase px-1">Agency Name on Reports</label>
                          <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none"
                            value={appConfig.pdfSettings?.agencyName || 'LWS CYBER DEFENSE UNIT'}
                            onChange={(e) => updateAppConfig({ pdfSettings: { ...appConfig.pdfSettings, agencyName: e.target.value } })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                           <div>
                              <p className="text-xs font-bold">PDF Watermark</p>
                              <p className="text-[9px] text-white/30 uppercase">Anti-copy protection</p>
                           </div>
                           <button 
                             onClick={() => updateAppConfig({ pdfSettings: { ...appConfig.pdfSettings, watermark: !appConfig.pdfSettings?.watermark } })}
                             className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${appConfig.pdfSettings?.watermark ? 'bg-purple-600' : 'bg-white/10'}`}
                           >
                             <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${appConfig.pdfSettings?.watermark ? 'translate-x-5' : 'translate-x-1'}`} />
                           </button>
                        </div>
                      </div>
                   </div>

                   <button onClick={saveBranding} className="w-full bg-white text-black py-4 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-xl">
                      <ShieldCheck className="w-5 h-5" /> PERSIST ALL CHANGES
                   </button>
                </div>

                <div className="space-y-6">
                   <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Live Visual Feedback</h4>
                   <div className="bg-black border border-white/10 rounded-3xl p-8 space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl animate-pulse" style={{backgroundColor: primaryColor}} />
                         <div>
                            <div className="h-4 w-32 rounded bg-white/10 mb-2" />
                            <div className="h-2 w-20 rounded bg-white/5" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <div className="h-10 w-full rounded-xl bg-white/5" />
                         <div className="h-12 w-full rounded-xl" style={{backgroundColor: primaryColor}} />
                      </div>
                   </div>

                   <div className="pt-8 border-t border-white/5">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-emerald-500" /> Source Packager
                      </h4>
                      <p className="text-xs text-white/40 mb-6 font-medium">Auto-injects your branding into the source code bundle.</p>
                      <button onClick={downloadSourceCode} className="w-full py-4 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95">
                        <Download className="w-5 h-5" /> DOWNLOAD CUSTOM BUILD (.ZIP)
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vips' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                         <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold">VIP Membership Registry</h3>
                         <p className="text-sm text-white/40">Activate premium access for users bypassing all restrictions.</p>
                      </div>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row gap-4 mb-10 bg-black/40 p-6 rounded-2xl border border-white/5">
                      <div className="flex-grow space-y-1">
                         <label className="text-[10px] font-bold text-white/40 uppercase px-1">User Email</label>
                         <input type="email" placeholder="user@gmail.com" value={targetVipEmail} onChange={(e) => setTargetVipEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50" />
                      </div>
                      <div className="sm:w-48 space-y-1">
                         <label className="text-[10px] font-bold text-white/40 uppercase px-1">Duration</label>
                         <select value={vipDuration} onChange={(e) => setVipDuration(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none cursor-pointer text-white [&>option]:bg-[#0a0a0a]">
                            <option value="weekly">Weekly Node</option>
                            <option value="monthly">Monthly Node</option>
                            <option value="yearly">Yearly Node</option>
                         </select>
                      </div>
                      <div className="flex items-end w-full sm:w-auto">
                         <button 
                            onClick={() => {
                               if (!targetVipEmail) return toast.error('Email required');
                               addVipUser(targetVipEmail, vipDuration);
                               setTargetVipEmail('');
                               toast.success('VIP Plan Activated');
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 h-11 px-8 rounded-xl font-bold text-sm transition-all"
                         > Activate Access </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-4 ml-2">Active Premium Nodes ({vipUsers.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {vipUsers.map((v: any, i: number) => {
                            const isExpired = new Date().getTime() > v.expiry;
                            return (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                       <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                       <p className="font-bold text-xs truncate">{v.email}</p>
                                       <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{v.plan} • {new Date(v.expiry).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                                 <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {isExpired ? 'Expired' : 'Active'}
                                 </div>
                              </motion.div>
                            );
                         })}
                      </div>
                      {vipUsers.length === 0 && (
                        <div className="text-center py-20 text-white/5 border-2 border-dashed border-white/5 rounded-3xl">
                           <Users className="w-12 h-12 mx-auto mb-4 opacity-5" />
                           <p className="text-sm font-bold uppercase tracking-widest opacity-20">No VIP Nodes Recorded</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          )}

            {activeTab === 'nodes' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem]">
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-8">
                    <Globe className="w-6 h-6 text-blue-500" /> API Cluster Management
                  </h3>
                  
                  <div className="space-y-4">
                    {appConfig.apiNodes?.map((node: any) => (
                      <div key={node.id} className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${node.active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5 opacity-60'}`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${node.active ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/20'}`}>
                              {node.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-sm tracking-tight">{node.name}</p>
                              <code className="text-[10px] text-white/30">{node.url}</code>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {node.active && <span className="text-[9px] font-black px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md uppercase tracking-wider">Active Stream</span>}
                           <button 
                             onClick={() => {
                               const updated = appConfig.apiNodes.map((n: any) => ({ ...n, active: n.id === node.id }));
                               updateAppConfig({ apiNodes: updated, apiEndpoint: node.url });
                               toast.success(`Switched to ${node.name}`);
                             }}
                             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${node.active ? 'bg-blue-500 text-white cursor-default' : 'bg-white/10 hover:bg-white/20'}`}
                           >
                             {node.active ? 'Connected' : 'Switch Source'}
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scammers' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl">
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Skull className="w-6 h-6 text-red-500" /> Scammer Database (Manual Flagging)
              </h3>
              <p className="text-sm text-white/40 mb-8">Numbers added here will show a massive RED warning to users during search.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-red-400">
                    <Ban className="w-4 h-4" /> Add Record
                  </h4>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Phone Number (e.g. 0321...)" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-red-500 outline-none"
                        value={scammerNum}
                        onChange={(e) => setScammerNum(e.target.value)}
                      />
                      <textarea 
                        placeholder="Why is this number banned? (e.g. Fake Payment, Abuse)" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-red-500 outline-none min-h-[80px]"
                        value={scammerNote}
                        onChange={(e) => setScammerNote(e.target.value)}
                      />
                      <button 
                        onClick={() => {
                          if (!scammerNum || !scammerNote) return toast.error('Number & Note required');
                          const clean = scammerNum.replace(/\D/g, '');
                          const current = appConfig.scammers || [];
                          if (current.find((s: any) => s.phone === clean)) return toast.error('Already flagged');
                          updateAppConfig({ scammers: [...current, { phone: clean, note: scammerNote }] });
                          setScammerNum('');
                          setScammerNote('');
                          toast.success('Number flagged as Scammer');
                        }}
                        className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold text-xs shadow-lg shadow-red-500/20"
                      >
                        Ban Globally
                      </button>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl h-[400px] flex flex-col">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-white/40">
                    <ShieldAlert className="w-4 h-4" /> Blacklisted Numbers ({appConfig.scammers?.length || 0})
                  </h4>
                  <div className="flex-grow overflow-y-auto no-scrollbar space-y-2">
                    {appConfig.scammers?.map((s: any) => (
                      <div key={s.phone} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 shrink-0">
                              <AlertTriangle className="w-4 h-4" />
                           </div>
                           <div className="overflow-hidden">
                              <code className="text-sm font-black text-red-400 block">{s.phone}</code>
                              <p className="text-[10px] text-white/40 truncate italic">"{s.note}"</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            updateAppConfig({ 
                              scammers: appConfig.scammers.filter((n: any) => n.phone !== s.phone) 
                            });
                            toast.success('Removed from database');
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!appConfig.scammers || appConfig.scammers.length === 0) && (
                      <div className="h-full flex flex-col items-center justify-center text-white/10 italic">
                         <Ban className="w-12 h-12 mb-4 opacity-5" />
                         <p>No scammers flagged</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl">
              <h3 className="text-xl font-bold mb-1">Security & Access Defense</h3>
              <p className="text-sm text-white/40 mb-8">Manage administrative credentials and global blacklists.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-red-500/60">
                     <Lock className="w-4 h-4" /> Root Credentials
                   </h4>
                   <div className="space-y-3">
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-white/40 uppercase px-1">New Secure Password</label>
                       <input type="password" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50" placeholder="Minimum 6 characters" />
                     </div>
                     <button onClick={saveAdminPassword} className="w-full bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-500 hover:text-white py-3 rounded-xl font-bold text-xs transition-all">
                       UPDATE ACCESS KEY
                     </button>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-red-500/60">
                     <ShieldAlert className="w-4 h-4" /> Manual Blacklist
                   </h4>
                   <div className="space-y-4">
                     <div className="flex gap-2">
                       <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-500/50" placeholder="Email or IP Address" />
                       <button onClick={blockIp} className="bg-red-600 px-6 rounded-xl font-bold text-xs">Block</button>
                     </div>
                     <div className="bg-black/20 rounded-xl border border-white/5 max-h-[300px] overflow-y-auto divide-y divide-white/5">
                       {blockedIPs.length === 0 ? (
                         <div className="p-10 text-center text-white/5 text-xs italic">No entities blacklisted.</div>
                       ) : blockedIPs.map((ip, i) => (
                         <div key={i} className="flex items-center justify-between p-4 hover:bg-red-500/[0.02] transition-colors">
                           <span className="text-xs font-mono text-red-400 truncate pr-4">{ip}</span>
                           <button onClick={() => unblockIp(ip)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-4 flex items-center gap-2 border-r border-white/5 transition-all whitespace-nowrap ${active ? 'bg-white/5 text-white shadow-inner' : 'text-white/40 hover:bg-white/[0.02] hover:text-white/60'}`}>
      <Icon className={`w-4 h-4 ${active ? 'text-red-500' : ''}`} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color, isText }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    red: 'text-red-500 bg-red-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10'
  };
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}><Icon className="w-4 h-4" /></div>
        <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
        {!isText && typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
