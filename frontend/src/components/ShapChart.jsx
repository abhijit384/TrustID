import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

export const ShapChart = ({ riskFactors = [], explanation = "", reasons = [] }) => {
  const factors = riskFactors || [];

  // Max attribution for scaling the bar widths
  const maxAttribution = factors.length > 0 
    ? Math.max(...factors.map(v => Math.abs(v.impact || v.attribution || 10)), 25)
    : 30;

  return (
    <div className="space-y-6">
      {/* Explainable AI Header (Section 14 & 15) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Why was this document flagged?</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI Risk Factors
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Transparent breakdown calculated from Trust AI visual inspection, OCR verification, and document consistency checks.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Explanation Summary */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-slate-900/60">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold text-cyan-300 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Screening Synthesis</span>
        </div>
        <p className="mt-3 text-xs text-slate-200 leading-relaxed">
          {explanation || (reasons.length > 0 ? reasons.join(" ") : "✓ No significant verification anomalies detected.")}
        </p>
      </div>

      {/* AI Risk Factors Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            AI Risk Factors
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> + Elevated Risk
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> - Protective Factor
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {factors.length > 0 ? (
            factors.map((item, idx) => {
              const val = item.impact !== undefined ? item.impact : (item.attribution || 0);
              const isRisk = val > 0;
              const barWidth = `${Math.min((Math.abs(val) / maxAttribution) * 100, 100)}%`;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{item.feature}</span>
                      {isRisk ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <span className={`font-mono font-bold ${isRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {val > 0 ? `+${val}` : val} pts
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800/80">
                    <div
                      style={{ width: barWidth }}
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isRisk
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-glow-rose'
                          : 'bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-glow-emerald'
                      }`}
                    />
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-slate-400 pl-1">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 font-mono">
              ✓ No abnormal risk factors identified. Document substrate and fields meet standard consistency criteria.
            </div>
          )}
        </div>
      </div>

      {/* Flagged Reasons Card */}
      {reasons && reasons.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center gap-2 pb-3 border-b border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Specific Screening Reasons
            </h4>
          </div>
          <ul className="mt-3 space-y-2.5">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="text-amber-400 font-bold">⚠</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
