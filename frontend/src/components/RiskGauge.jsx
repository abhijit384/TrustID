import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export const RiskGauge = ({ score = 62, level = "Medium", factors = {} }) => {
  // SVG semicircle gauge calculation
  const radius = 70;
  const circumference = Math.PI * radius; // Half-circle
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let gaugeColor = "#10b981"; // Low (emerald)
  let levelColorText = "text-emerald-400";
  let statusBadge = "LOW RISK";

  if (clampedScore >= 70) {
    gaugeColor = "#ef4444"; // High (rose/red)
    levelColorText = "text-rose-400";
    statusBadge = "HIGH RISK INDICATOR";
  } else if (clampedScore >= 40) {
    gaugeColor = "#f59e0b"; // Medium (amber)
    levelColorText = "text-amber-400";
    statusBadge = "MEDIUM — REVIEW REQUIRED";
  }

  const defaultFactors = {
    document_validation: factors?.document_validation || "10/10",
    field_consistency: factors?.field_consistency || "7/10",
    tampering_indicators: factors?.tampering_indicators || "6/10",
    face_verification: factors?.face_verification || "9/10",
    metadata_indicators: factors?.metadata_indicators || "5/10"
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Overall Screening Risk
          </span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
            clampedScore >= 70 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
            clampedScore >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {statusBadge}
          </span>
        </div>

        {/* SVG Semi-Circle Gauge */}
        <div className="flex flex-col items-center justify-center my-3 relative">
          <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#1e293b"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="16"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Gauge Center Text */}
          <div className="absolute bottom-2 flex flex-col items-center">
            <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
              {clampedScore}
              <span className="text-xs font-semibold text-slate-500 font-sans">/100</span>
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wider ${levelColorText}`}>
              {level} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Contributing Factors Breakdown Table */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Contributing Layer Breakdown
        </div>
        
        <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50">
          <span className="text-slate-300 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Document Validation
          </span>
          <span className="font-mono font-semibold text-slate-200">{defaultFactors.document_validation}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50">
          <span className="text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Field Consistency
          </span>
          <span className="font-mono font-semibold text-amber-400">{defaultFactors.field_consistency}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50">
          <span className="text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Tampering Indicators
          </span>
          <span className="font-mono font-semibold text-amber-400">{defaultFactors.tampering_indicators}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50">
          <span className="text-slate-300 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Face Verification
          </span>
          <span className="font-mono font-semibold text-slate-200">{defaultFactors.face_verification}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50">
          <span className="text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Metadata Indicators
          </span>
          <span className="font-mono font-semibold text-amber-400">{defaultFactors.metadata_indicators}</span>
        </div>
      </div>
    </div>
  );
};
