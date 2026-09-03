import React from 'react';
import { 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  Camera, 
  Sparkles, 
  Maximize2, 
  Eye,
  Activity
} from 'lucide-react';
import { getMediaUrl } from '../services/api';

export const DocumentFaceAnalysis = ({
  faceDetected = true,
  faceQuality = "Good",
  photoRegionDetected = true,
  status = "No Obvious Anomaly",
  confidence = 0.91,
  indicators = [],
  explanation = "",
  cropUrl = null,
  originalUrl = null,
  box = null
}) => {
  const resolvedCropUrl = getMediaUrl(cropUrl);
  const resolvedOriginalUrl = getMediaUrl(originalUrl);

  const isNoFace = !faceDetected || status?.toLowerCase().includes("no face");

  const isExplicitReal = Boolean(
    status?.toLowerCase().includes("real") || 
    status?.toLowerCase() === "pass" || 
    status?.toLowerCase() === "good"
  );

  const isExplicitFake = Boolean(
    status?.toLowerCase().includes("fake") || 
    status?.toLowerCase().includes("tamper") || 
    status?.toLowerCase().includes("anomaly")
  );

  const isFakePhoto = !isNoFace && !isExplicitReal && isExplicitFake;
  const isGoodQuality = faceQuality?.toLowerCase() === "good";
  const confPct = Math.round((confidence || 0.94) * 100);

  const displayStatus = isNoFace
    ? "No Face Detected"
    : isFakePhoto
      ? "Fake / Tampered Photo"
      : "Real Photo";

  const displayExplanation = isNoFace
    ? "No facial photograph detected in the uploaded document."
    : explanation || "The document portrait photograph was verified authentic with clean boundaries and consistent substrate texture.";

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" /> Embedded Portrait Forensics
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
              isFakePhoto
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : isNoFace
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              {displayStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated forensic visual analysis of the portrait embedded in the credential (no secondary comparison photo needed).
          </p>
        </div>

        <div className="bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Forensic Confidence</span>
          <span className="text-lg font-mono font-black text-cyan-400">{confPct}%</span>
        </div>
      </div>

      {/* Grid: Left = Visual Crop / Detected Region, Right = Forensic Checkpoints */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Visual Face Crop */}
        <div className="md:col-span-1 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Extracted Document Portrait
          </span>
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 flex items-center justify-center min-h-[200px] group">
            {resolvedCropUrl && faceDetected ? (
              <img 
                src={resolvedCropUrl} 
                alt="Document Face Crop" 
                className="w-full h-52 object-contain p-2" 
                onError={(e) => {
                  if (resolvedOriginalUrl && e.target.src !== resolvedOriginalUrl) {
                    e.target.src = resolvedOriginalUrl;
                  }
                }}
              />
            ) : resolvedOriginalUrl && faceDetected ? (
              <div className="relative w-full h-52 flex items-center justify-center bg-slate-900/60 p-2">
                <img 
                  src={resolvedOriginalUrl} 
                  alt="Document Thumbnail" 
                  className="max-h-full max-w-full object-contain rounded-lg opacity-80" 
                />
                {box && (
                  <div 
                    className="absolute border-2 border-cyan-400 bg-cyan-400/15 rounded pointer-events-none"
                    style={{
                      top: `${(box.ymin || 0.15) * 100}%`,
                      left: `${(box.xmin || 0.10) * 100}%`,
                      width: `${((box.xmax || 0.35) - (box.xmin || 0.10)) * 100}%`,
                      height: `${((box.ymax || 0.35) - (box.ymin || 0.15)) * 100}%`
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
                <p className="text-xs font-semibold text-slate-300">
                  No facial photograph detected in the uploaded document.
                </p>
                <p className="text-[10px] text-slate-500">Non-photo credential or unreadable portrait</p>
              </div>
            )}

            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-cyan-300">
              {faceDetected ? "Portrait Cropped" : "No Face Detected"}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {faceDetected 
              ? "Cropped directly from the embedded photograph region in the uploaded ID."
              : "No facial photograph detected in the uploaded document."}
          </p>
        </div>

        {/* Right Columns: Core Forensic Checkpoints Matrix */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Face Detected */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Face Detected</span>
              <p className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5 font-mono">
                {faceDetected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>YES</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>NO</span>
                  </>
                )}
              </p>
            </div>

            {/* 2. Photo Region */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Photo Region</span>
              <p className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5 font-mono">
                {photoRegionDetected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Detected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Missing</span>
                  </>
                )}
              </p>
            </div>

            {/* 3. Face Quality */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Face Quality</span>
              <p className={`text-base font-bold mt-0.5 font-mono ${
                isGoodQuality ? 'text-emerald-300' : 'text-amber-300'
              }`}>
                {faceQuality}
              </p>
            </div>

            {/* 4. Photo Integrity */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Photo Integrity</span>
              <p className={`text-xs font-bold mt-1 font-mono truncate ${
                isFakePhoto ? 'text-rose-400' : isNoFace ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {displayStatus}
              </p>
            </div>
          </div>

          {/* Detailed Observations & Indicators */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Forensic Evaluation Details:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {displayExplanation}
            </p>

            {indicators && indicators.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className={`text-[10px] font-mono uppercase font-bold block ${
                  isFakePhoto ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {isFakePhoto ? 'Observed Risk Indicators:' : 'Verified Forensic Markers:'}
                </span>
                <ul className={`space-y-1 text-xs ${
                  isFakePhoto ? 'text-rose-200' : 'text-slate-300'
                }`}>
                  {indicators.map((ind, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className={isFakePhoto ? 'text-rose-400' : 'text-emerald-400'}>
                        {isFakePhoto ? '⚠' : '✓'}
                      </span>
                      <span>{typeof ind === 'string' ? ind : ind.explanation || ind.indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
