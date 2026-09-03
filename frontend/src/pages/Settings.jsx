import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Cpu, 
  ShieldAlert, 
  Database, 
  CheckCircle2, 
  Sparkles,
  Server,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings = () => {
  const { user } = useAuth();
  const [demoMode, setDemoMode] = useState(true);
  const [autoPurge, setAutoPurge] = useState(false);

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            System &amp; Security Settings
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            ADMIN CONSOLE
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage administrator credentials, Trust AI model telemetry, and privacy compliance configurations.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" /> Administrator Profile
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-semibold">
            {user?.role || "admin"} Authorization
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Full Legal Name</span>
            <p className="text-sm font-bold text-slate-200 mt-1">{user?.name || "Subhashree Saha"}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Official Email ID</span>
            <p className="text-sm font-mono text-slate-200 mt-1">{user?.email || "demo.admin@example.com"}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Assigned Role / Level</span>
            <p className="text-sm font-mono text-purple-400 font-bold uppercase mt-1">Administrator (Full Access)</p>
          </div>
        </div>
      </div>

      {/* Trust AI & Model Configuration */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Model Telemetry &amp; Trust AI Configuration
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Decision Support Model:</span>
              <span className="font-mono text-cyan-400 font-bold">Trust AI Neural Engine</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">API Key Security:</span>
              <span className="font-mono text-emerald-400">Backend Server-Side (.env)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Frontend Exposure:</span>
              <span className="font-mono text-slate-200">Zero (Never in Client Bundle)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fallback Resilience:</span>
              <span className="font-mono text-slate-200">DEMO AI MODE Deterministic</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">OCR Extraction:</span>
              <span className="font-mono text-slate-200">LayoutLM + PaddleOCR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tampering Detection:</span>
              <span className="font-mono text-slate-200">Error Level Analysis (ELA)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Biometrics Match:</span>
              <span className="font-mono text-slate-200">ArcFace 512-Dim Embeddings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-mono text-slate-200">SQLite / SQLAlchemy ORM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Regulatory Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800">
          <Lock className="w-4 h-4 text-emerald-400" /> Compliance &amp; Security Controls
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-200 block">Demonstration AI Mode Active</span>
              <span className="text-slate-400 text-[11px]">Enables rapid offline evaluation with simulated specimens.</span>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {demoMode ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-200 block">Strict Role-Based Access Control</span>
              <span className="text-slate-400 text-[11px]">Enforces genuine permission boundaries between Administrator and User roles.</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ENFORCED
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-200 block">Automatic Session Purge</span>
              <span className="text-slate-400 text-[11px]">Clear local storage tokens upon terminal window exit.</span>
            </div>
            <button
              onClick={() => setAutoPurge(!autoPurge)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {autoPurge ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
