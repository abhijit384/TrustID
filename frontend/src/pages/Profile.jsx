import React from 'react';
import { User, Mail, Shield, KeyRound, Clock, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            User Profile
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            DEMO ACCOUNT
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Review authenticated screening terminal credentials and personal screening telemetry.
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-glow-cyan">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{user?.name || 'User'}</h2>
              <p className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                Role: {user?.role || 'User'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated Session
          </span>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Account Name
            </span>
            <p className="text-sm font-bold text-slate-100 mt-1">{user?.name || 'User'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" /> Official Email
            </span>
            <p className="text-sm font-mono text-slate-100 mt-1">{user?.email || 'demo.user@example.com'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> Access Tier
            </span>
            <p className="text-sm font-bold text-slate-100 mt-1 capitalize">
              {user?.role || 'User'} Privileges
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Screening, AI Analysis &amp; Personal Reports</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Authentication Type
            </span>
            <p className="text-sm font-mono text-slate-100 mt-1">JWT Bearer (32-Byte Secret)</p>
            <p className="text-[10px] text-slate-400 mt-1">Cryptographically Signed Token</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
          <p className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> TRUSTID AI Integration Status
          </p>
          <p>
            All document screenings submitted from this account are automatically analyzed using TRUSTID's multi-layer computer vision, OCR, and Trust AI explainability engine.
          </p>
        </div>
      </div>
    </div>
  );
};
