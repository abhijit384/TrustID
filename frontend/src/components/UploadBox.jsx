import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, Sparkles, X, Image as ImageIcon, UserCheck } from 'lucide-react';
import { getMediaUrl } from '../services/api';

export const UploadBox = ({ onDocumentSelected, onAnalyze, onClear, isAnalyzing = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [docType, setDocType] = useState("Passport");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setSelectedSample(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    if (onDocumentSelected) {
      onDocumentSelected({
        type: 'file',
        file: file,
        previewUrl: url,
        filename: file.name
      });
    }
  };

  const handleSelectSample = (sampleId, docName) => {
    setSelectedFile(null);
    setSelectedSample(sampleId);
    const url = getMediaUrl(`/uploads/samples/${sampleId}.jpg`);
    setPreviewUrl(url);

    if (onDocumentSelected) {
      onDocumentSelected({
        type: 'sample',
        sampleId: sampleId,
        previewUrl: url,
        filename: `${docName}.jpg`
      });
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setSelectedSample(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onClear) onClear();
  };

  const demoSpecimens = [
    { id: "sample_passport_clean", label: "Passport (ICAO)", type: "Passport", tag: "Genuine" },
    { id: "sample_visa_consular", label: "Travel Visa", type: "Visa", tag: "Consular" },
    { id: "sample_multi_identity_alias", label: "Multiple Identities", type: "Passport", tag: "Alias Alert" },
    { id: "sample_blacklisted_doc", label: "Interpol Blacklist", type: "Travel Doc", tag: "SLTD Stolen" },
    { id: "sample_dl_expired", label: "Expired Document", type: "Driver License", tag: "Expired" },
    { id: "sample_id_mrz_mismatch", label: "National ID (MRZ)", type: "National ID", tag: "MRZ Check" },
    { id: "sample_passport_tampered", label: "Tampered Specimen", type: "Passport", tag: "Forged" },
    { id: "sample_permit", label: "Border Permit", type: "Permit", tag: "Transit" },
  ];

  return (
    <div className="space-y-6">

      {/* Main Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer min-h-[260px] flex flex-col items-center justify-center relative ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
                : selectedFile || selectedSample
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "Document"}
                  </p>
                </div>
                <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  Ready for Trust AI Analysis
                </span>
              </div>
            ) : selectedSample ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Preset Specimen Selected</p>
                  <p className="text-xs text-cyan-300 font-mono mt-0.5">{selectedSample}.jpg</p>
                </div>
                <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  Ready for Trust AI Analysis
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-glow-cyan">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Drop document image here or <span className="text-cyan-400 underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports high-resolution JPG, PNG, WEBP or PDF documents up to 15MB
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-slate-500 font-mono">
                  <span>SHA-256 Hashing</span>
                  <span>•</span>
                  <span>Trust AI Multimodal Vision</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Specimen Chips */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Quick Border Checkpoint Demo Specimens:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {demoSpecimens.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => handleSelectSample(spec.id, spec.label)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between ${
                    selectedSample === spec.id
                      ? 'border-cyan-500 bg-cyan-500/15 text-white shadow-glow-cyan'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-semibold block truncate text-xs">{spec.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 block truncate">{spec.type}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex-shrink-0 ml-1 ${
                    spec.tag === 'Forged' || spec.tag === 'Expired'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {spec.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Panel (1 col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Document Preview
              </span>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                  title="Clear File"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-4 min-h-[180px] rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Uploaded Document Preview"
                  className="w-full h-full max-h-[220px] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No document selected</p>
                  <p className="text-[10px] text-slate-600 mt-1">Upload or pick a demo sample</p>
                </div>
              )}
            </div>

            {/* Auto-Detect Document Class Badge */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Document Classification</span>
                <span className="text-xs font-semibold text-cyan-300 font-mono">Auto-Detect via Trust AI</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            <button
              type="button"
              disabled={!previewUrl || isAnalyzing}
              onClick={() => onAnalyze && onAnalyze({ file: selectedFile, sampleId: selectedSample, docType: "Auto-Detect" })}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                !previewUrl || isAnalyzing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing with Trust AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Analyze Document
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={!previewUrl || isAnalyzing}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-slate-700 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
