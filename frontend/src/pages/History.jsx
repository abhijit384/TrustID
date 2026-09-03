import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Search, Filter, ArrowRight, Shield, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { screeningsAPI } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';

export const History = () => {
  const { user, isAdmin } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await screeningsAPI.list({
        search: search || undefined,
        risk_level: riskFilter !== 'all' ? riskFilter : undefined
      });
      setScreenings(res.data);
    } catch (err) {
      console.error("Failed to load screening history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isAdmin ? "Analysis History Archive" : "My Screening History"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {isAdmin ? "All Organization Records" : "My Records"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological log of completed document screenings and TRUSTID AI evaluations.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </form>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-cyan-400" /> Screening Records ({screenings.length})
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {isAdmin ? "Organization-Wide View" : "Scoped to Your Account"}
          </span>
        </div>

        {loading ? (
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : screenings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No screening records found matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Screening ID</th>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Document Type</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Screening Officer</th>
                  <th className="p-4 text-right">View Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {screenings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">{s.screening_id}</td>
                    <td className="p-4 font-semibold text-slate-200">{s.demo_person_name || 'Alex Morgan'}</td>
                    <td className="p-4 text-slate-300">{s.document_type}</td>
                    <td className="p-4">
                      <RiskBadge level={s.risk_level} score={s.risk_score} size="small" />
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {s.officer_name || "Authorized Officer"}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/analysis/${s.screening_id || s.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>Telemetry</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
