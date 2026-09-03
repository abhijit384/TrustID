import React from 'react';
import { AlertTriangle, Eye, Info, CheckCircle2, Shield } from 'lucide-react';

export const ForensicViewer = ({ originalUrl, indicators = [], tamperingScore = 0, status = "No Obvious Anomaly", explanation = "" }) => {
  const displayOriginal = originalUrl || "/uploads/samples/sample_passport_clean.jpg";
  const hasAnomaly = status && status.toLowerCase().includes("potential");

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-white tracking-tight">Visual &amp; Substrate Analysis</h3>
            {hasAnomaly ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> POTENTIAL ANOMALY
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> NO OBVIOUS ANOMALY
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Automated multimodal visual inspection evaluated by Trust AI Neural Engine for image-region alterations, font disparities, and substrate anomalies.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Tampering Indicator Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-extrabold font-mono ${hasAnomaly ? 'text-amber-400' : 'text-emerald-400'}`}>
                {tamperingScore}%
              </span>
              <span className="text-xs text-slate-500 font-sans">probabilistic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer (Section 6 & 13 & 31) */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <b>NOTE:</b> AI visual analysis provides potential indicators to assist human screening officers. It does not prove forgery or independently establish document invalidity. Never declare a document definitively fake from visual AI analysis alone.
        </p>
      </div>

      {/* Document Image & Visual Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Image (1 col) */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 self-start">
            Analyzed Document Image
          </span>
          <div className="w-full h-auto min-h-[260px] max-h-[380px] rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border border-slate-800/80">
            <img
              src={displayOriginal}
              alt="Uploaded Document"
              className="max-w-full max-h-[360px] object-contain rounded-lg"
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-2 self-start">
            Authentic document visual representation (No decorative heatmaps)
          </span>
        </div>

        {/* Visual Findings Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">
              Visual Analysis Synthesis
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {explanation || (hasAnomaly ? "One or more suspicious visual characteristics detected in document regions." : "No significant visual inconsistency or manipulation indicators detected across document regions.")}
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Observed Visual Indicators
            </span>

            {indicators && indicators.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {indicators.map((ind, idx) => {
                  const regData = ind.region_data || {};
                  return (
                    <div key={idx} className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">
                          {ind.indicator_type || ind.type || "Visual Anomaly"}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {Math.round((ind.confidence || 0.6) * 100)}% Conf
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {regData.explanation || ind.explanation || "Visual characteristics differ from surrounding area."}
                      </p>
                      {regData.region && (
                        <p className="text-[10px] font-mono text-slate-400">
                          Region: <strong className="text-slate-200">{regData.region}</strong>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-200">No Visual Alterations Detected</p>
                <p className="text-[11px] text-slate-400">
                  Document texture, typography alignment, and visual substrate appear uniform.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
