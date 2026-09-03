import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Circle, Sparkles } from 'lucide-react';

export const Pipeline = ({ steps = [], currentStepIndex = 0 }) => {
  const defaultSteps = [
    { id: 1, name: "Image Quality Check", desc: "Resolution, lighting, blur and substrate analysis" },
    { id: 2, name: "OCR Extraction", desc: "Extract structured text & identify document layout" },
    { id: 3, name: "Document Validation", desc: "Check mandatory fields, ISO dates and syntax" },
    { id: 4, name: "MRZ / Field Consistency", desc: "Verify optical text against machine readable zone" },
    { id: 5, name: "Tampering Analysis", desc: "Error Level Analysis (ELA) and forensic differencing" },
    { id: 6, name: "Face Verification", desc: "1:1 biometric comparison between document & live photo" },
    { id: 7, name: "Risk Engine", desc: "Multi-layer Bayesian risk calculation & scoring" },
    { id: 8, name: "Trust AI Analysis", desc: "Natural-language explanation & decision-support synthesis" },
    { id: 9, name: "Report Preparation", desc: "Compile immutable audit trail and PDF dossier" },
  ];

  const pipelineSteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Multi-Layer Analysis Pipeline</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> TRUSTID AI
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronous 9-stage forensic document screening &amp; Trust AI workflow
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3.5">
        {pipelineSteps.map((step, idx) => {
          let status = step.status;
          if (!status) {
            if (idx < currentStepIndex) status = (idx === 4 ? "warning" : "completed");
            else if (idx === currentStepIndex) status = "processing";
            else status = "pending";
          }

          let icon = <Circle className="w-5 h-5 text-slate-600" />;
          let statusBadge = (
            <span className="text-[11px] font-mono text-slate-500">Pending</span>
          );
          let borderStyle = "border-slate-800/50 bg-slate-900/30 text-slate-400";

          if (status === "processing") {
            icon = <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
            statusBadge = (
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Processing...
              </span>
            );
            borderStyle = "border-cyan-500/40 bg-cyan-950/20 text-white shadow-glow-cyan";
          } else if (status === "completed") {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            statusBadge = (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                ✓ Completed
              </span>
            );
            borderStyle = "border-emerald-500/20 bg-slate-900/40 text-slate-200";
          } else if (status === "warning") {
            icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
            statusBadge = (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                ⚠ Potential Anomaly
              </span>
            );
            borderStyle = "border-amber-500/30 bg-amber-950/10 text-amber-200";
          } else if (status === "failed") {
            icon = <XCircle className="w-5 h-5 text-rose-400" />;
            statusBadge = (
              <span className="text-[11px] font-mono text-rose-400">Failed</span>
            );
            borderStyle = "border-rose-500/30 bg-rose-950/10 text-rose-200";
          }

          return (
            <div
              key={step.id || idx}
              className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between ${borderStyle}`}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex-shrink-0">{icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">Step {idx + 1}</span>
                    <span className="text-sm font-semibold tracking-tight">{step.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">{statusBadge}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
