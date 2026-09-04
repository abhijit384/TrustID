import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, AlertCircle, FileCheck, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UploadBox } from '../components/UploadBox';
import { screeningsAPI } from '../services/api';

const PIPELINE_STAGES = [
  "Uploading...",
  "Processing document...",
  "Running OCR...",
  "Analyzing with Trust AI Neural Engine...",
  "Validating fields...",
  "Generating risk assessment...",
  "Complete"
];

export const NewScreening = () => {
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleDocumentSelected = (docData) => {
    setSelectedDoc(docData);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setSelectedDoc(null);
    setIsAnalyzing(false);
    setCurrentStep(0);
    setErrorMessage(null);
  };

  const handleAnalyze = async (data) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < PIPELINE_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const formData = new FormData();
      if (data.file) {
        formData.append('document', data.file);
      }
      if (data.sampleId) {
        formData.append('sample_id', data.sampleId);
      }
      formData.append('document_type', data.docType || 'Passport');

      const res = await screeningsAPI.create(formData);
      const screeningId = res.data.screening_id || res.data.id;

      if (!screeningId) {
        throw new Error("No screening ID returned from server.");
      }

      clearInterval(stepInterval);
      navigate(`/analysis/${screeningId}`);

    } catch (err) {
      console.error("Document upload failed:", err);
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      let detail = err.response?.data?.detail;
      if (!detail) {
        if (err.message === "Network Error") {
          detail = "Network Error: Unable to reach TRUSTID backend server. Please verify your connection.";
        } else {
          detail = err.message || "Unknown upload error";
        }
      }
      setErrorMessage(
        `UPLOAD FAILED\n\nCould not initialize screening record for this document.\n\nPlease check:\n• Uploaded file format\n• Server connectivity\n\n(Details: ${detail})`
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black text-white tracking-tight">
            New Document Screening
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            TRUST AI MULTIMODAL
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Upload synthetic specimens or test identity documents for automated multimodal optical, biometric, and forensic consistency screening.
        </p>
      </div>

      {/* Error State Banner (Section 18 & 26) */}
      {errorMessage && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>AI Analysis Error</span>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap text-rose-200/90 leading-relaxed bg-rose-950/60 p-4 rounded-xl border border-rose-900/50">
            {errorMessage}
          </pre>
        </div>
      )}

      {/* Real Pipeline Stage Progress Tracker (Section 28) */}
      {isAnalyzing && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-slate-900/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="text-sm font-bold text-white font-mono">
                {PIPELINE_STAGES[currentStep]}
              </span>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              Stage {currentStep + 1} of {PIPELINE_STAGES.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / PIPELINE_STAGES.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 text-[10px] font-mono">
            {PIPELINE_STAGES.map((stage, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-center transition-all ${
                  idx < currentStep
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : idx === currentStep
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200 font-bold'
                      : 'border-slate-800 bg-slate-900/30 text-slate-500'
                }`}
              >
                {stage}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Upload Box */}
      <UploadBox
        onDocumentSelected={handleDocumentSelected}
        onAnalyze={handleAnalyze}
        onClear={handleClear}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};
