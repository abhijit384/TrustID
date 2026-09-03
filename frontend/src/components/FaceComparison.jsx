import React from 'react';
import { UserCheck, AlertTriangle, Shield, CheckCircle, Info, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FaceComparison = ({
  docPhotoUrl,
  presentedFaceUrl,
  similarityScore = 0.0,
  status = "Not Evaluated",
  explanation = ""
}) => {
  const isEvaluated = presentedFaceUrl && status !== "Not Evaluated" && similarityScore > 0;
  const isMatch = isEvaluated && (status.toLowerCase().includes('match') || similarityScore >= 70);

  const displayDocPhoto = docPhotoUrl || "/uploads/samples/sample_passport_clean.jpg";

  if (!isEvaluated) {
    return (
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-white tracking-tight">1:1 Biometric Face Verification</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                NOT PERFORMED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              1:1 biometric cross-matching requires a separate authorized comparison photograph.
            </p>
          </div>
        </div>

        {/* Not Performed Notice Box (Section 11 & 12) */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Comparison Image Supplied</h4>
            <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
              No comparison image was supplied. The photograph embedded within the document was still thoroughly analyzed above in <b>Document Face Analysis</b>.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <span className="inline-block text-[11px] font-mono px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Document Face Analysis: Completed
            </span>
            <span className="inline-block text-[11px] font-mono px-3 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Face Verification: Not Performed
            </span>
          </div>
        </div>

        {/* Policy Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <b>POLICY REQUIREMENT:</b> When evaluated, face similarity provides assistive decision support and does not independently establish identity. Never make autonomous enforcement decisions based on biometric match scores alone.
          </p>
        </div>
      </div>
    );
  }

  // Circular gauge calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (similarityScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-white tracking-tight">Biometric Face Verification</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1 ${
              isMatch 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isMatch ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            1:1 deep facial embedding distance cross-matching document photo against live/presented capture.
          </p>
        </div>

        {/* Circular Score Visualizer */}
        <div className="flex items-center gap-4 bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r={radius}
                className="text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50" cy="50" r={radius}
                stroke={isMatch ? "#10b981" : "#f59e0b"}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold font-mono text-white">
                {Math.round(similarityScore)}%
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-bold">Match</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Confidence Index
            </span>
            <span className={`text-xs font-mono font-semibold ${isMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isMatch ? 'High Assurance' : 'Review Required'}
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Photo Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Portrait Box */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="flex items-center justify-between w-full pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Document Photo (Extracted)
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              Specimen
            </span>
          </div>

          <div className="my-4 relative w-48 h-56 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shadow-inner">
            <img
              src={displayDocPhoto}
              alt="Extracted Document Portrait"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Live Presented Person Box */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
          <div className="flex items-center justify-between w-full pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Presented Comparison Photo
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Capture
            </span>
          </div>

          <div className="my-4 relative w-48 h-56 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shadow-inner">
            <img
              src={presentedFaceUrl}
              alt="Presented Comparison Person"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mandatory Assistive Signal Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <Shield className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <b>POLICY REQUIREMENT:</b> Face similarity is an assistive signal and does not independently establish identity. Never make autonomous enforcement decisions based on biometric match scores alone. Authorized personnel must perform physical visual confirmation.
        </p>
      </div>
    </div>
  );
};
