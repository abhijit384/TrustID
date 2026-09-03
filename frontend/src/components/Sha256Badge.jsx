import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, AlertTriangle, Fingerprint } from 'lucide-react';

export const Sha256Badge = ({ hash = "8f434346e91a0b38c29188e02d91acb54209df3402ba818274a27498c8191ac", isVerified = true }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Fingerprint className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cryptographic SHA-256 Fingerprint
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              isVerified
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {isVerified ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {isVerified ? '✓ Integrity Verified' : '⚠ Integrity Mismatch'}
            </span>
          </div>
          <p className="font-mono text-xs text-slate-200 mt-0.5 break-all max-w-xl">
            {hash}
          </p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="px-2.5 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center gap-1.5 transition-colors self-start sm:self-center"
        title="Copy Hash"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
};
