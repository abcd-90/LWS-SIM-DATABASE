import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { SimData } from '../store';

export default function BulkSearch({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [results, setResults] = useState<{ number: string; data: SimData[] | null; status: 'pending' | 'loading' | 'success' | 'failed' }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
        
        // Extract all numbers from first column ignoring empty rows
        const extracted = data
          .map(row => row[0])
          .filter(val => val && typeof val === 'string' || typeof val === 'number')
          .map(val => String(val).trim())
          .slice(0, 50); // Limit to 50 for safety
        
        setNumbers(extracted);
        setResults(extracted.map(n => ({ number: n, data: null, status: 'pending' })));
      };
      reader.readAsBinaryString(f);
    }
  };

  const processBulk = async () => {
    if (numbers.length === 0) return;
    setIsProcessing(true);

    for (let i = 0; i < numbers.length; i++) {
        const phone = numbers[i];
        
        setResults(prev => {
            const next = [...prev];
            next[i].status = 'loading';
            return next;
        });

        try {
            const res = await axios.get(`/api/lookup?phone=${phone}`);
            const data = res.data;
            const success = data?.success === true && Array.isArray(data.result) && data.result.length > 0;
            
            setResults(prev => {
                const next = [...prev];
                next[i].status = success ? 'success' : 'failed';
                next[i].data = success ? data.result : null;
                return next;
            });
        } catch (err) {
            setResults(prev => {
                const next = [...prev];
                next[i].status = 'failed';
                return next;
            });
        }

        // Delay to prevent hitting rate limit immediately
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="bg-[#0a0a0a] border-b border-white/10 p-4 shrink-0 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <FileSpreadsheet className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-blue-500">BULK SEARCH PRO</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Upload Excel / CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
            Close Panel
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 h-full min-h-0">
          <div className="bg-blue-500/5 border border-blue-500/10 border-dashed rounded-xl p-8 text-center mb-6">
            <Upload className="w-8 h-8 mx-auto text-blue-500 mb-4 opacity-50" />
            <h3 className="font-bold text-lg mb-2">Upload File to Bulk Search</h3>
            <p className="text-sm text-white/40 mb-4 max-w-sm mx-auto">
              Format: Excel (.xlsx) or CSV. Place numbers in the first column. Limit 50 queries per file.
            </p>
            <label className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg cursor-pointer hover:bg-blue-500 transition-colors">
              <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} disabled={isProcessing} />
              {file ? file.name : 'Select File'}
            </label>
          </div>

          {numbers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <div>
                  <h4 className="font-bold text-white/80">{numbers.length} Numbers Extracted</h4>
                  <p className="text-xs text-white/40">Ready to sequentially query API.</p>
                </div>
                <button 
                  onClick={processBulk}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isProcessing ? 'Processing...' : 'Start Bulk Search'}
                </button>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                {results.map((req, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                    <div className="flex items-center gap-3 w-1/4">
                      {req.status === 'pending' && <div className="w-2 h-2 rounded-full bg-white/20" />}
                      {req.status === 'loading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {req.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {req.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="font-mono text-sm">{req.number}</span>
                    </div>

                    <div className="flex-1 text-sm bg-black/40 p-2 rounded border border-white/5 min-h-[40px] flex items-center">
                      {req.status === 'pending' && <span className="text-white/20 italic">Waiting...</span>}
                      {req.status === 'loading' && <span className="text-blue-500/80 italic">Searching database node...</span>}
                      {req.status === 'failed' && <span className="text-red-500/80">No records found.</span>}
                      {req.status === 'success' && req.data && (
                        <div className="w-full text-xs">
                          <span className="text-emerald-400 font-bold block mb-1">Found {req.data.length} records:</span>
                          <span className="text-white/60">
                            {req.data[0].name || req.data[0].full_name || 'N/A'} - {req.data[0].cnic || req.data[0].nic || 'N/A'}
                            {req.data.length > 1 && ` (+${req.data.length - 1} more)`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
