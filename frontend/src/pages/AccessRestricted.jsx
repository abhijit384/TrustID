import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccessRestricted = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-rose-500/30 text-center space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
            HTTP 403 • FORBIDDEN
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            403 — Access Restricted
          </h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your current role (<span className="text-slate-200 font-semibold uppercase">{user?.role || 'User'}</span>) does not have administrative privileges to access this system module or audit ledger.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
          <div className="flex items-center gap-2 text-amber-400">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-semibold">Security Policy Enforced</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Unauthorized navigation attempts are logged in the cryptographic audit trail with terminal telemetry.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Return to My Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
