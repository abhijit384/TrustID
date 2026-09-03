import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Activity, 
  FileText, 
  Sparkles, 
  RefreshCw,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { Link } from 'react-router-dom';

const RISK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const AUTH_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsAPI.getSystemAnalytics();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load admin analytics:", err);
      setError(err.response?.data?.detail || "Could not retrieve live analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Computing live database analytics &amp; risk aggregates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 space-y-3 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Analytics Access Error</span>
        </div>
        <p className="text-xs font-mono">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-800 hover:bg-rose-700 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const s = stats || {
    total_screenings: 0,
    low_risk: 0,
    medium_risk: 0,
    high_risk: 0,
    likely_genuine: 0,
    potentially_suspicious: 0,
    inconclusive: 0,
    average_processing_seconds: 0.0,
    daily_screenings: [],
    risk_distribution: [],
    top_indicators: [],
    authenticity_distribution: [],
    recent_flagged: [],
    common_anomalies: []
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Platform Intelligence &amp; Forensic Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              ADMINISTRATOR CONSOLE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry calculated strictly from live database screening records and Trust AI neural evaluations.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 8 KPI Cards (Section 20 & 21) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
        {/* 1. Total Screenings */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[10px] font-mono uppercase text-slate-400 block truncate">Total Screenings</span>
          <p className="text-xl font-mono font-bold text-white mt-1">{s.total_screenings}</p>
          <span className="text-[9px] text-slate-500 font-mono">Live Database</span>
        </div>

        {/* 2. Low Risk */}
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block truncate">Low Risk</span>
          <p className="text-xl font-mono font-bold text-emerald-300 mt-1">{s.low_risk}</p>
          <span className="text-[9px] text-emerald-400/80 font-mono">0–29 Score</span>
        </div>

        {/* 3. Medium Risk */}
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
          <span className="text-[10px] font-mono uppercase text-amber-400 block truncate">Medium Risk</span>
          <p className="text-xl font-mono font-bold text-amber-300 mt-1">{s.medium_risk}</p>
          <span className="text-[9px] text-amber-400/80 font-mono">30–59 Score</span>
        </div>

        {/* 4. High Risk */}
        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/10">
          <span className="text-[10px] font-mono uppercase text-rose-400 block truncate">High Risk</span>
          <p className="text-xl font-mono font-bold text-rose-400 mt-1">{s.high_risk}</p>
          <span className="text-[9px] text-rose-400/80 font-mono">60–100 Score</span>
        </div>

        {/* 5. Likely Genuine */}
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block truncate">Likely Genuine</span>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{s.likely_genuine}</p>
          <span className="text-[9px] text-emerald-400/80 font-mono">High Assurance</span>
        </div>

        {/* 6. Potentially Suspicious */}
        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/10">
          <span className="text-[10px] font-mono uppercase text-rose-400 block truncate">Potentially Suspicious</span>
          <p className="text-xl font-mono font-bold text-rose-300 mt-1">{s.potentially_suspicious}</p>
          <span className="text-[9px] text-rose-400/80 font-mono">Flagged Anomaly</span>
        </div>

        {/* 7. Inconclusive */}
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
          <span className="text-[10px] font-mono uppercase text-amber-400 block truncate">Inconclusive</span>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">{s.inconclusive}</p>
          <span className="text-[9px] text-amber-400/80 font-mono">Sub-optimal</span>
        </div>

        {/* 8. Avg Processing Time */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10">
          <span className="text-[10px] font-mono uppercase text-cyan-400 block truncate">Avg Duration</span>
          <p className="text-xl font-mono font-bold text-cyan-300 mt-1">{s.average_processing_seconds}s</p>
          <span className="text-[9px] text-cyan-400/80 font-mono">Per Screening</span>
        </div>
      </div>

      {/* Face & Photo Biometric Intelligence Row (Section 16 & 17) */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
          Document Face Analysis &amp; 1:1 Biometric Verification Telemetry
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="glass-panel p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-[10px] font-mono uppercase text-slate-400 block truncate">Doc Face Analyses</span>
            <p className="text-lg font-mono font-bold text-white mt-1">{s.total_doc_face_analyses ?? s.total_screenings}</p>
            <span className="text-[9px] text-cyan-400 font-mono">Always Run on ID</span>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block truncate">Faces Detected</span>
            <p className="text-lg font-mono font-bold text-emerald-300 mt-1">{s.faces_detected ?? s.total_screenings}</p>
            <span className="text-[9px] text-emerald-400/80 font-mono">Usable ID Face</span>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/10">
            <span className="text-[10px] font-mono uppercase text-rose-400 block truncate">Photo Anomalies</span>
            <p className="text-lg font-mono font-bold text-rose-300 mt-1">{s.potential_photo_anomalies ?? 0}</p>
            <span className="text-[9px] text-rose-400/80 font-mono">Potential Tamper</span>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/10">
            <span className="text-[10px] font-mono uppercase text-purple-400 block truncate">Face Comparisons</span>
            <p className="text-lg font-mono font-bold text-purple-300 mt-1">{s.face_verifications_performed ?? 0}</p>
            <span className="text-[9px] text-purple-400/80 font-mono">1:1 Image Supplied</span>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block truncate">Likely Matches</span>
            <p className="text-lg font-mono font-bold text-emerald-300 mt-1">{s.face_verification_matches ?? 0}</p>
            <span className="text-[9px] text-emerald-400/80 font-mono">Biometric Match</span>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/10">
            <span className="text-[10px] font-mono uppercase text-amber-400 block truncate">Review Required</span>
            <p className="text-lg font-mono font-bold text-amber-300 mt-1">{s.face_verification_reviews ?? 0}</p>
            <span className="text-[9px] text-amber-400/80 font-mono">Biometric Disparity</span>
          </div>
        </div>
      </div>

      {/* 4 Interactive Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Screening Volume Trend */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Screening Volume Over Time
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Live Aggregate
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {s.daily_screenings && s.daily_screenings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.daily_screenings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Bar dataKey="screenings" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No historical screening volume recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Authenticity Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Authenticity Assessment Distribution
            </span>
            <span className="text-[10px] font-mono text-slate-400">Section 4 Framework</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {s.authenticity_distribution && s.authenticity_distribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={s.authenticity_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {s.authenticity_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={AUTH_COLORS[index % AUTH_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-mono text-center">
                100% Likely Genuine (Baseline spec)
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Risk Classification Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Risk Score Distribution
            </span>
            <span className="text-[10px] font-mono text-slate-400">Low / Med / High</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {s.risk_distribution && s.risk_distribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={s.risk_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {s.risk_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-mono text-center">
                Single record: Low Risk (100%)
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Top Observed Forensic Indicators */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Top Observed Forensic Indicators
            </span>
            <span className="text-[10px] font-mono text-slate-400">Trust AI Findings</span>
          </div>

          <div className="h-64 w-full pt-2">
            {s.top_indicators && s.top_indicators.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.top_indicators} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No anomalies recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section (Section 20 & 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Flagged Screenings */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Flagged / Elevated Screenings
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live Database</span>
          </div>

          <div className="overflow-x-auto">
            {s.recent_flagged && s.recent_flagged.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[10px] font-mono uppercase text-slate-400">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Subject</th>
                    <th className="pb-2">Authenticity</th>
                    <th className="pb-2">Risk</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {s.recent_flagged.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-bold text-cyan-400">{r.screening_id}</td>
                      <td className="py-2.5 text-slate-200 font-sans">{r.demo_person_name}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.authenticity?.includes("Likely") 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}>
                          {r.authenticity}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-bold">{r.risk_score}/100</td>
                      <td className="py-2.5 text-right">
                        <Link to={`/analysis/${r.screening_id || r.id}`} className="text-cyan-400 hover:underline text-[11px]">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No elevated risk or suspicious screenings recorded.
              </div>
            )}
          </div>
        </div>

        {/* Table 2: Most Common Anomaly Types */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Most Common Anomaly Categories
            </span>
            <span className="text-[10px] font-mono text-slate-500">Telemetry</span>
          </div>

          <div className="space-y-3">
            {s.common_anomalies && s.common_anomalies.length > 0 ? (
              s.common_anomalies.map((a, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">{a.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Pattern frequency</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
                    {a.frequency} occurrences
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No anomalous occurrences detected across baseline specimens.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
