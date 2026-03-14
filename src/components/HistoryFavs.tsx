import React from 'react';
import { History, Star, Search, X } from 'lucide-react';
import { useAppStore, SimData } from '../store';

export function HistoryPanel({ onClose, onSelect }: { onClose: () => void, onSelect: (query: string) => void }) {
  const { history } = useAppStore();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <History className="w-5 h-5" />
            <h2 className="font-bold text-lg">Search History</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2 flex-grow">
          {history.length === 0 ? (
            <p className="text-center text-white/40 py-8 text-sm">No search history found.</p>
          ) : history.map((h: any, i: number) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors">
              <div>
                <p className="font-bold font-mono text-white/90">{h.query}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/40">{h.date}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${h.results?.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {h.results?.length > 0 ? `${h.results.length} Found` : 'No Match'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { onSelect(h.query); onClose(); }}
                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FavoritesPanel({ onClose, onSelect }: { onClose: () => void, onSelect: (record: SimData) => void }) {
  const { favorites, toggleFavorite } = useAppStore();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-amber-500/20 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500">
            <Star className="w-5 h-5 fill-amber-500" />
            <h2 className="font-bold text-lg text-white">Saved Records</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-grow">
          {favorites.length === 0 ? (
            <p className="text-center text-white/40 py-8 text-sm">No favorites added yet.</p>
          ) : favorites.map((f: SimData, i: number) => (
            <div key={i} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{f.name || f.full_name || 'N/A'}</p>
                <p className="text-sm font-mono text-amber-400 mt-0.5">{f.mobile || f.phone}</p>
                <p className="text-xs text-white/50 font-mono mt-0.5">{f.cnic || f.nic}</p>
                <p className="text-[10px] text-white/30 truncate mt-1">{f.address}</p>
              </div>
              <div className="space-y-2 shrink-0">
                <button 
                  onClick={() => { onSelect(f); onClose(); }}
                  className="w-full flex items-center justify-center gap-1 text-[10px] uppercase font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white"
                >
                  <Search className="w-3 h-3" /> View
                </button>
                <button 
                  onClick={() => toggleFavorite(f)}
                  className="w-full text-[10px] uppercase font-bold px-3 py-1.5 bg-red-600/20 hover:bg-red-500/40 text-red-500 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
