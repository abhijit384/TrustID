import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Search, Filter, Clock, User, AlertCircle } from 'lucide-react';
import { auditAPI } from '../services/api';

export const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getTrail({ action: actionFilter || undefined });
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Cryptographic Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological, non-repudiable audit ledger recording all system AI operations, document uploads, and officer reviews.
          </p>
        </div>

        {/* Filter Input */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Filter by action (e.g. Upload, OCR)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Timeline & Table Tabs/Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Visualization (1 col) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Recent Sequence
          </h3>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {logs.slice(0, 8).map((log, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
                  {idx < 7 && <div className="w-px h-10 bg-slate-800 my-1" />}
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{log.action}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                  <span className="text-[10px] font-mono text-cyan-400/80 mt-1 block">
                    {new Date(log.timestamp).toLocaleTimeString()} • {log.user_name || "System"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Ledger Table (2 cols) */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden lg:col-span-2">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Full Event Ledger</h3>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Loading audit ledger...</td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                      {log.user_name || "Automated Agent"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-slate-800 text-slate-300">
                        {log.user_role || "system"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-400 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
