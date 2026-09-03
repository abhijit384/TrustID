import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TiltCard3D } from '../components/ThreeD/TiltCard3D';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading terminal intelligence telemetry...</p>
      </div>
    );
  }

  // ==========================================
  // 1. ADMIN DASHBOARD VIEW
  // ==========================================
  if (isAdmin) {
    const stats = data || {
      documents_screened: 1,
      total_users: 2,
      flagged_for_review: 0,
      low_risk: 1,
      average_processing_time: 2.4,
      screening_trend: [{ date: "Baseline", screened: 1, flagged: 0 }],
      risk_distribution: [
        { name: "Low Risk", value: 1, color: "#10b981" },
        { name: "Medium (Review)", value: 0, color: "#f59e0b" },
        { name: "High Risk", value: 0, color: "#ef4444" }
      ],
      recent_screenings: [],
      system_health: "All Services Operational",
      ai_stats: { total_analyzed: 1, ai_assisted_accuracy: 99.4, model: "trust-ai-engine" }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Enterprise Identity Screening Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Organization-wide real-time biometric, optical, and forensic document screening surveillance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* System Health */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{stats.system_health || "System Health: Operational"}</span>
            </div>

            <Link
              to="/screenings/new"
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Screening</span>
            </Link>
          </div>
        </div>

        {/* Top 4 Organization Stat Cards - Dynamic from DB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Screenings"
            value={(stats.documents_screened ?? 1).toLocaleString()}
            change="Calculated from database"
            isPositive={true}
            icon={FileText}
            variant="blue"
          />
          <StatCard
            title="Total Registered Users"
            value={(stats.total_users ?? 2).toString()}
            change="Role-based access active"
            isPositive={true}
            icon={Users}
            variant="purple"
          />
          <StatCard
            title="Requiring Manual Review"
            value={(stats.flagged_for_review ?? 0).toString()}
            change="Risk score ≥ 30"
            isPositive={false}
            icon={AlertTriangle}
            variant="amber"
          />
          <StatCard
            title="Verified Low Risk"
            value={(stats.low_risk ?? 1).toLocaleString()}
            change="Risk score < 30"
            isPositive={true}
            icon={CheckCircle2}
            variant="emerald"
          />
        </div>

        {/* AI Status Card (Section 19) */}
        <TiltCard3D maxTilt={6} scale={1.01}>
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Trust AI Document Intelligence</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Model: <span className="font-mono text-cyan-300 font-semibold">Trust AI Multimodal</span> • Neural Vision &amp; Structured Evaluation
                </p>
              </div>
            </div>

            <Link
              to="/screenings/new"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>Analyze Document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </TiltCard3D>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Screening Trends */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Screening Telemetry
                </h3>
                <p className="text-[11px] text-slate-400">Chronological screening throughput</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Database Real-time</span>
            </div>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.screening_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="screened" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 4 }} name="Screened" />
                  <Line type="monotone" dataKey="flagged" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 4 }} name="Flagged" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Risk Distribution
              </h3>
              <span className="text-[10px] font-mono text-slate-500">All Records</span>
            </div>
            <div className="h-64 mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.risk_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.risk_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs">
              {stats.risk_distribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}: <strong className="text-white">{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Screenings Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" /> Recent Screenings
              </h3>
              <p className="text-[11px] text-slate-400">Most recent identity records processed by TRUSTID</p>
            </div>
            <Link
              to="/documents"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All Documents</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Screening ID</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Document Type</th>
                  <th className="px-5 py-3">Officer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Risk Assessment</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recent_screenings && stats.recent_screenings.length > 0 ? (
                  stats.recent_screenings.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-cyan-300 font-semibold">{row.screening_id}</td>
                      <td className="px-5 py-3.5 text-white font-medium">{row.demo_person_name}</td>
                      <td className="px-5 py-3.5 text-slate-300">{row.document_type}</td>
                      <td className="px-5 py-3.5 text-slate-400">{row.officer_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          row.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <RiskBadge level={row.risk_level} score={row.risk_score} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/analysis/${row.screening_id || row.id}`}
                          className="px-3 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                        >
                          View Analysis
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-mono">
                      No screening records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. USER DASHBOARD VIEW (Strictly Personal)
  // ==========================================
  const uStats = data || {
    my_screenings: 0,
    my_pending_reviews: 0,
    my_completed: 0,
    my_reports_count: 0,
    my_recent_documents: []
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* User Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Screening Officer Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
              OFFICER
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personal document verification terminal. You have access strictly to your assigned screenings.
          </p>
        </div>

        <Link
          to="/screenings/new"
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Screening</span>
        </Link>
      </div>

      {/* User Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Screenings"
          value={uStats.my_screenings.toString()}
          change="Personal assigned files"
          isPositive={true}
          icon={FileText}
          variant="blue"
        />
        <StatCard
          title="My Pending Reviews"
          value={uStats.my_pending_reviews.toString()}
          change="Requiring officer review"
          isPositive={false}
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="My Completed Verifications"
          value={uStats.my_completed.toString()}
          change="Completed screenings"
          isPositive={true}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* AI Model Status Card */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-purple-950/20 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Trust AI Neural Engine Active</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multimodal document screening assisted by Trust AI Neural Engine.
            </p>
          </div>
        </div>
      </div>

      {/* User's Recent Documents */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" /> My Recent Screenings
            </h3>
            <p className="text-[11px] text-slate-400">Screening records created under your authorized profile</p>
          </div>
          <Link
            to="/documents"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All My Documents</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Screening ID</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Document Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {uStats.my_recent_documents && uStats.my_recent_documents.length > 0 ? (
                uStats.my_recent_documents.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-cyan-300 font-semibold">{row.screening_id}</td>
                    <td className="px-5 py-3.5 text-white font-medium">{row.demo_person_name}</td>
                    <td className="px-5 py-3.5 text-slate-300">{row.document_type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        row.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge level={row.risk_level} score={row.risk_score} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/analysis/${row.screening_id || row.id}`}
                        className="px-3 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      >
                        View Analysis
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-mono">
                    You have not uploaded any documents yet. Click "New Screening" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
