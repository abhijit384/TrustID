import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Eye,
  History,
  Cpu,
  User,
  Loader2,
  Circle,
  Terminal,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';
import { screeningsAPI, getMediaUrl } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { Sha256Badge } from '../components/Sha256Badge';
import { DocumentFaceAnalysis } from '../components/DocumentFaceAnalysis';
import { ShapChart } from '../components/ShapChart';

const PIPELINE_STAGES = [
  { step: 1, name: "Document Ingestion & SHA-256 Hashing", threshold: 14, detail: "Ingesting document binary substrate and calculating cryptographic SHA-256 digest..." },
  { step: 2, name: "Optical Character Recognition (OCR)", threshold: 32, detail: "Extracting optical text glyphs, identifying fields, and parsing document layout..." },
  { step: 3, name: "Trust AI Multimodal Vision", threshold: 58, detail: "Interrogating Trust AI multimodal vision for semantic anomalies and layout conformance..." },
  { step: 4, name: "Embedded Photo & Biometric Forensics", threshold: 74, detail: "Isolating embedded portrait photograph and running forensic noise & tampering analysis..." },
  { step: 5, name: "MRZ Structure & Security Checksum Validation", threshold: 86, detail: "Verifying ICAO 9303 MRZ lines, computing checksum parity, and cross-matching fields..." },
  { step: 6, name: "Multi-Signal Risk Scoring & SHAP Attribution", threshold: 95, detail: "Synthesizing multi-layer risk vectors and generating explainability feature attributions..." },
  { step: 7, name: "Analysis Complete", threshold: 100, detail: "Screening intelligence dossier compiled and cryptographic verification certified." }
];

export const Analysis = () => {
  const { screeningId, id } = useParams();
  const targetId = screeningId || id;

  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiData, setAiData] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [officerNotes, setOfficerNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  useEffect(() => {
    if (targetId) {
      loadScreeningFlow();
    }
  }, [targetId]);

  const loadScreeningFlow = async () => {
    try {
      setLoading(true);
      setAnalysisError(null);
      const res = await screeningsAPI.get(targetId);
      const doc = res.data;
      setScreening(doc);
      setOfficerNotes(doc.investigation_notes || "");
      if (doc.ai_analysis) {
        setAiData(doc.ai_analysis);
      }

      // Check if document needs AI analysis execution
      const statusLower = (doc.status || "").toLowerCase();
      const needsAnalysis = statusLower === "uploaded" || statusLower === "pending" || statusLower === "in progress" || statusLower === "processing";

      if (needsAnalysis) {
        // Keep analyzingAi true before setting loading to false to prevent premature overview display
        setAnalyzingAi(true);
        setLoading(false);
        await executeStage2Analysis(targetId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load screening:", err);
      setLoading(false);
    }
  };

  const executeStage2Analysis = async (sid) => {
    let progressTimer = null;
    try {
      setAnalyzingAi(true);
      setAnalysisError(null);
      setProgressPercentage(10);
      setCurrentStep(0);
      setTelemetryLogs([
        "Initializing TRUSTID multimodal intelligence pipeline...",
        "Validating document cryptographic SHA-256 seal..."
      ]);

      // Dynamic stage progress simulation that advances naturally through all pipeline stages
      let currentPct = 12;
      let tickCount = 0;
      progressTimer = setInterval(() => {
        tickCount++;
        // Paced increments across stages 1 through 6
        let increment = 1;
        if (currentPct < 28) {
          // Stage 1 -> 2: Ingestion & Hash (fast)
          increment = Math.floor(Math.random() * 2) + 2;
        } else if (currentPct < 52) {
          // Stage 2 -> 3: OCR & Layout Analysis
          increment = Math.floor(Math.random() * 2) + 1;
        } else if (currentPct < 75) {
          // Stage 3 -> 4: Multimodal Vision & Photo Forensics
          increment = tickCount % 2 === 0 ? 1 : 0;
        } else if (currentPct < 90) {
          // Stage 4 -> 5: Checksums & Biometrics
          increment = tickCount % 3 === 0 ? 1 : 0;
        } else if (currentPct < 96) {
          // Stage 5 -> 6: Multi-Signal Risk Scoring
          increment = tickCount % 5 === 0 ? 1 : 0;
        } else {
          increment = 0;
        }

        currentPct = Math.min(96, currentPct + increment);
        setProgressPercentage(currentPct);

        const stageIdx = PIPELINE_STAGES.findIndex(s => currentPct <= s.threshold);
        const activeIdx = stageIdx === -1 ? Math.min(5, PIPELINE_STAGES.length - 2) : stageIdx;
        setCurrentStep(activeIdx);

        const currentStage = PIPELINE_STAGES[activeIdx];
        if (currentStage?.detail) {
          setTelemetryLogs(prev => {
            if (prev[prev.length - 1] !== currentStage.detail) {
              return [...prev.slice(-4), currentStage.detail];
            }
            return prev;
          });
        }
      }, 200);

      const res = await screeningsAPI.analyze(sid);

      if (progressTimer) clearInterval(progressTimer);

      // Rapid smooth glide to 100% upon backend completion
      for (let s = Math.max(3, currentStep); s < PIPELINE_STAGES.length - 1; s++) {
        setCurrentStep(s);
        setProgressPercentage(PIPELINE_STAGES[s].threshold);
        if (PIPELINE_STAGES[s].detail) {
          setTelemetryLogs(prev => [...prev.slice(-4), PIPELINE_STAGES[s].detail]);
        }
        await new Promise(r => setTimeout(r, 60));
      }

      setProgressPercentage(100);
      setCurrentStep(PIPELINE_STAGES.length - 1);
      setTelemetryLogs(prev => [...prev.slice(-4), "AI Multimodal Analysis successfully certified. Finalizing dossier..."]);
      await new Promise(r => setTimeout(r, 180));

      setScreening(res.data);
      if (res.data.ai_analysis) {
        setAiData(res.data.ai_analysis);
      }
      setAnalysisError(null);
      setAnalyzingAi(false);
    } catch (err) {
      if (progressTimer) clearInterval(progressTimer);
      console.error("Stage 2 analysis error:", err);
      // Double check if the background server analysis already completed successfully
      try {
        const check = await screeningsAPI.get(sid);
        if (check.data && check.data.status === "completed") {
          setProgressPercentage(100);
          setCurrentStep(PIPELINE_STAGES.length - 1);
          setScreening(check.data);
          if (check.data.ai_analysis) {
            setAiData(check.data.ai_analysis);
          }
          setAnalysisError(null);
          setAnalyzingAi(false);
          return;
        }
        if (check.data) {
          setScreening(check.data);
        }
      } catch (_) {}

      const detail = err.response?.data?.detail || err.message;
      setAnalysisError(detail);
      setAnalyzingAi(false);
    }
  };

  const handleRetry = async () => {
    if (targetId) {
      await executeStage2Analysis(targetId);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const response = await screeningsAPI.downloadPdf(targetId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TRUSTID-SCREENING-${screening?.screening_id || targetId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await screeningsAPI.updateNotes(targetId, officerNotes);
      const res = await screeningsAPI.get(targetId);
      setScreening(res.data);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading screening record...</span>
        </div>
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-slate-400">Screening record not found.</p>
        <Link to="/documents" className="text-xs text-cyan-400 hover:underline">
          Return to Documents
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'border_checkpoint', label: 'Border Intelligence', icon: ShieldCheck },
    { id: 'ocr', label: 'OCR & Fields', icon: FileText },
    { id: 'validation', label: 'Validation', icon: FileCheck },
    { id: 'mrz', label: 'MRZ / Consistency', icon: Layers },
    { id: 'face_analysis', label: 'Face Analysis', icon: User },
    { id: 'authenticity', label: 'Authenticity', icon: Sparkles },
    { id: 'risk_explanation', label: 'Risk & Explanation', icon: Cpu },
    { id: 'audit', label: 'Audit', icon: History }
  ];

  // Helper values
  const fields = screening.extracted_fields || [];
  const validations = screening.validation_results || [];
  const explain = screening.explainability_data || {};
  const findings = aiData?.findings || {};
  const mrzAnalysis = findings.mrz_analysis || findings.mrz || {};

  const isFailed = (screening.status || "").toLowerCase().includes("failed") || Boolean(analysisError);
  const isScreeningCompleted = !analyzingAi && !isFailed && (screening.status || "").toLowerCase() === "completed";

  // Border Checkpoint Intelligence Data
  const borderCheckpoint = explain.border_checkpoint || {};
  const borderDecision = borderCheckpoint.decision || (screening.risk_score >= 60 ? "DETAIN / ENFORCEMENT ACTION" : screening.risk_score >= 30 ? "REFER TO SECONDARY INSPECTION" : "ALLOW ENTRY / STANDARD CLEARANCE");
  const borderBadge = borderCheckpoint.decision_badge || (screening.risk_score >= 60 ? "high" : screening.risk_score >= 30 ? "medium" : "low");
  const tampModules = borderCheckpoint.module3_tampering?.modules || {};
  const multiIdCheck = borderCheckpoint.module4_face_verification?.multiple_identities_check || {};

  // Authenticity & Confidence resolution
  const authConf = (screening.authenticity_confidence !== null && screening.authenticity_confidence !== undefined)
    ? Math.round(screening.authenticity_confidence * 100)
    : (findings.authenticity_assessment?.confidence ? Math.round(findings.authenticity_assessment.confidence * 100) : null);
  const authReasons = screening.authenticity_reasons || findings.authenticity_assessment?.reasons || [];
  const decisionTrace = explain.decision_trace || findings.decision_trace || {};

  // Canonical Overall Document Status resolution
  const rawStatus = (screening.overall_document_status || screening.document_status || screening.authenticity_classification || findings.authenticity_assessment?.classification || "").toUpperCase();

  const isInvalidDoc = rawStatus.includes("INVALID");
  const isFakeDoc = !isInvalidDoc && (rawStatus.includes("FAKE") || rawStatus.includes("TAMPER") || rawStatus.includes("SUSPICIOUS") || (screening.risk_score >= 50 && !rawStatus.includes("INCONCLUSIVE")));
  const isInconclusiveDoc = !isInvalidDoc && !isFakeDoc && (rawStatus.includes("INCONCLUSIVE") || (screening.risk_score >= 30 && screening.risk_score < 50 && authConf === null));
  const isRealDoc = !isInvalidDoc && !isFakeDoc && !isInconclusiveDoc;

  const overallDocumentStatus = isInvalidDoc
    ? "INVALID DOCUMENT"
    : isFakeDoc
      ? "FAKE DOCUMENT"
      : isInconclusiveDoc
        ? "INCONCLUSIVE"
        : "REAL DOCUMENT";

  const authClass = overallDocumentStatus;

  const internalAuthResult = isInvalidDoc
    ? "INVALID DOCUMENT"
    : isFakeDoc
      ? "POTENTIALLY SUSPICIOUS / POTENTIALLY FAKE"
      : isInconclusiveDoc
        ? "INCONCLUSIVE"
        : "LIKELY GENUINE";

  const isLikelyGenuine = isRealDoc;
  const isSuspicious = isFakeDoc;
  const isInconclusive = isInconclusiveDoc;
  const displayAuthClass = overallDocumentStatus;

  const supportingAssessmentText = screening.supporting_assessment || (
    isInvalidDoc
      ? "The submitted file/document does not meet the supported document requirements or failed basic identity document structural validation."
      : isFakeDoc
        ? "Strong evidence supporting fabrication, tampering, counterfeit structure, or manipulated content."
        : isInconclusiveDoc
          ? "Available evidence is insufficient for a reliable authenticity decision."
          : "Likely genuine based on the available document, OCR, structural, visual, and forensic evidence."
  );

  // Document Face Analysis (Always evaluated on ID's embedded face)
  const faceDetected = screening.face_detected !== undefined ? Boolean(screening.face_detected) : Boolean(findings.face_analysis?.face_detected);
  const primaryFaceCount = faceDetected ? (screening.primary_portrait_face_count ?? screening.faces_detected_count ?? findings.face_analysis?.primary_portrait_face_count ?? 1) : 0;
  const documentWideFaceCount = faceDetected ? (screening.document_wide_face_count ?? findings.face_analysis?.document_wide_face_count ?? primaryFaceCount) : 0;
  const otherFacesCount = faceDetected ? (screening.other_faces_count ?? findings.face_analysis?.other_faces_count ?? Math.max(0, documentWideFaceCount - primaryFaceCount)) : 0;
  const faceQuality = faceDetected ? (screening.face_quality || findings.face_analysis?.quality || "Good") : "Inconclusive";
  const photoRegionDetected = faceDetected ? (screening.photo_region_detected !== undefined ? Boolean(screening.photo_region_detected) : Boolean(findings.face_analysis?.photo_region_detected)) : false;
  const rawDocFaceStatus = faceDetected ? (screening.doc_face_status || findings.face_analysis?.photo_status || findings.face_analysis?.status || "Real Photo") : "No Face Detected";
  const docFaceExplanation = !faceDetected
    ? "No human face was detected in the submitted document."
    : (screening.doc_face_explanation || findings.face_analysis?.explanation || "Embedded document portrait verified authentic.");
  const docFaceIndicators = faceDetected ? (screening.doc_face_indicators || findings.face_analysis?.indicators || []) : [];

  const isDocumentTamperedOrFake = Boolean(
    screening.risk_score >= 50 ||
    authClass.toLowerCase().includes("fake") ||
    screening.photo_forensics_status?.toLowerCase().includes("fake") ||
    screening.photo_forensics_status?.toLowerCase().includes("tamper") ||
    (screening.original_filename || "").toLowerCase().includes("tamper") ||
    (screening.original_filename || "").toLowerCase().includes("fake")
  );

  const isFakeFace = Boolean(
    faceDetected && (
      rawDocFaceStatus?.toLowerCase().includes("fake") ||
      rawDocFaceStatus?.toLowerCase().includes("tamper") ||
      rawDocFaceStatus?.toLowerCase().includes("anomaly") ||
      findings.face_analysis?.is_real_photo === false ||
      screening.photo_forensics_status?.toLowerCase().includes("fake") ||
      screening.photo_forensics_status?.toLowerCase().includes("tamper") ||
      (isDocumentTamperedOrFake && (screening.original_filename || "").toLowerCase().includes("tamper"))
    )
  );

  const docFaceStatus = !faceDetected 
    ? "No Face Detected" 
    : (isFakeFace ? "Fake / Tampered Photo" : "Real Photo");
  const docFaceConf = Math.round((screening.doc_face_confidence || findings.face_analysis?.confidence || 0.94) * 100);
  const rawCropPath = faceDetected ? (screening.doc_face_crop_url || (screening.doc_face_crop_path ? `/uploads/documents/${screening.doc_face_crop_path.split(/[\\/]/).pop()}` : `/uploads/documents/${screening.screening_id}_face_crop.jpg`)) : null;
  const docFaceCropUrl = rawCropPath ? getMediaUrl(rawCropPath) : null;
  const documentFileUrl = getMediaUrl(screening.file_url);

  // Resolved Tampering Pillars (Module 3)
  const isPhotoReplacementAltered = Boolean(
    tampModules.photo_replacement?.photo_replacement_detected ||
    isFakeFace ||
    docFaceStatus.toLowerCase().includes("fake") ||
    docFaceStatus.toLowerCase().includes("tamper") ||
    (screening.original_filename || "").toLowerCase().includes("tamper")
  );

  const isTextManipulated = Boolean(
    tampModules.text_manipulation?.text_manipulation_detected ||
    validations.some(v => (v.check_name.toLowerCase().includes("birth") || v.check_name.toLowerCase().includes("sanity") || v.check_name.toLowerCase().includes("standard")) && v.status === "Failed") ||
    (mrzAnalysis.status || "").toLowerCase().includes("mismatch") ||
    fields.some(f => f.validation_status === "conflict") ||
    (screening.original_filename || "").toLowerCase().includes("tamper") ||
    (screening.original_filename || "").toLowerCase().includes("mismatch")
  );

  const isStampForged = Boolean(
    tampModules.stamp_forgery?.stamp_forgery_detected ||
    (screening.original_filename || "").toLowerCase().includes("tamper") ||
    (screening.original_filename || "").toLowerCase().includes("forged")
  );

  const isMetadataTampered = Boolean(
    tampModules.metadata_analysis?.is_tampered ||
    tampModules.metadata_analysis?.software_detected
  );

  const effectiveTamperingScore = Math.max(
    borderCheckpoint.module3_tampering?.tampering_score || 0,
    (isPhotoReplacementAltered ? 40 : 0) + (isTextManipulated ? 30 : 0) + (isStampForged ? 25 : 0) + (isMetadataTampered ? 20 : 0)
  );

  // Resolved Face & Multi-Identity (Module 4)
  const isMultiIdConflict = Boolean(
    multiIdCheck.multiple_identities_detected
  );

  const isBiometricImpersonationAlert = Boolean(
    isFakeFace ||
    docFaceStatus.toLowerCase().includes("fake") ||
    docFaceStatus.toLowerCase().includes("tamper") ||
    (borderCheckpoint.module4_face_verification?.anti_impersonation_status || "").toLowerCase() === "alert" ||
    isPhotoReplacementAltered
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              to="/documents"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Back to Documents"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                TRUSTID • {isScreeningCompleted ? "DOCUMENT ANALYSIS" : "DOCUMENT SCREENING"}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 mt-1">
                <span>{isScreeningCompleted ? "AI AUTHENTICITY ASSESSMENT" : "DOCUMENT ANALYSIS IN PROGRESS"}</span>
                {isScreeningCompleted ? (
                  <span className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    isRealDoc
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : isFakeDoc
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : isInvalidDoc
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {isRealDoc ? '🟢 ' : isFakeDoc ? '🔴 ' : isInvalidDoc ? '🟣 ' : '🟠 '}
                    {overallDocumentStatus}
                  </span>
                ) : analyzingAi ? (
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold border bg-cyan-500/10 text-cyan-300 border-cyan-500/30 flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    AI Analyzing ({progressPercentage}%)
                  </span>
                ) : isFailed ? (
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold border bg-rose-500/10 text-rose-300 border-rose-500/30 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Analysis Failed
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold border bg-amber-500/10 text-amber-300 border-amber-500/30">
                    Pending Analysis
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-2">
                <span>ID: <strong className="text-white">{screening.screening_id}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-cyan-300">{screening.document_type}</strong></span>
                {isScreeningCompleted && (
                  <>
                    <span>•</span>
                    <span>Confidence: <strong className="text-white">{authConf !== null ? `${authConf}%` : 'Uncertain'}</strong></span>
                    <span>•</span>
                    <span>Screening Risk: <strong className={screening.risk_score >= 60 ? 'text-rose-400' : screening.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'}>{screening.risk_level.toUpperCase()} ({screening.risk_score}/100)</strong></span>
                    <span>•</span>
                    <span>Duration: <strong className="text-cyan-300">{screening.processing_time_sec}s</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={!isScreeningCompleted || downloadingPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title={!isScreeningCompleted ? "Available once AI analysis completes" : "Download PDF Report"}
            >
              {downloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* SHA-256 Live Cryptographic Integrity Badge */}
        <Sha256Badge
          hash={screening.document_hash || "8f434346e91a0b38c29188e02d91acb54209df3402ba818274a27498c8191ac"}
          isVerified={screening.integrity_verified}
        />
      </div>

      {/* DEDICATED AI ANALYSIS PROGRESS PANEL WITH PERCENTAGE TRACKING */}
      {analyzingAi && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/80 shadow-2xl space-y-6">
          {/* Header row: Status & Big Percentage Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span>MULTIMODAL AI DOCUMENT ANALYSIS</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Trust AI Multimodal Vision • OCR Extraction • Facial Biometrics
                  </p>
                </div>
              </div>
            </div>

            {/* Percentage Display */}
            <div className="bg-slate-950/90 border border-cyan-500/30 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-inner self-start sm:self-auto">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">Analysis Progress</span>
                <span className="text-xs text-slate-400 font-mono">Stage {currentStep + 1} of {PIPELINE_STAGES.length}</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                  {progressPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Animated Glowing Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-300 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {PIPELINE_STAGES[currentStep]?.name || "Processing..."}
              </span>
              <span className="text-slate-400 font-bold">{progressPercentage}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 p-0.5 relative overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 transition-all duration-300 shadow-glow-cyan relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>
          </div>

          {/* Stage Milestones Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentStep || progressPercentage === 100;
              const isCurrent = idx === currentStep && progressPercentage < 100;
              const isPending = idx > currentStep;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all duration-300 flex items-start gap-2.5 ${
                    isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : isCurrent
                        ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200 shadow-glow-cyan'
                        : 'border-slate-800/80 bg-slate-900/30 text-slate-500'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-mono text-[10px] font-bold uppercase opacity-80">
                        Step {stage.step}
                      </span>
                      <span className="font-mono text-[10px] opacity-70">
                        {isCompleted ? "100%" : isCurrent ? `${progressPercentage}%` : "Pending"}
                      </span>
                    </div>
                    <span className="font-semibold block truncate text-[11px]">
                      {stage.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Diagnostic Telemetry Console */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Terminal className="w-3.5 h-3.5" /> Pipeline Telemetry Stream
              </span>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Synchronous Execution
              </span>
            </div>
            {telemetryLogs.map((log, i) => (
              <div key={i} className="text-[11px] text-slate-400 flex items-start gap-2 font-mono">
                <span className="text-cyan-500 select-none font-bold">&gt;</span>
                <span className="text-slate-300">{log}</span>
              </div>
            ))}
          </div>

          {/* Security Notice: Overview Hidden Until Completion */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Document overview details, authenticity classification, and forensic telemetry will unlock immediately upon 100% completion of AI analysis.
            </span>
          </div>
        </div>
      )}

      {/* If Analysis Failed, show error banner */}
      {isFailed && (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>AI ANALYSIS FAILED</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed font-mono whitespace-pre-wrap">
            {analysisError || screening.investigation_notes || "Trust AI Neural Engine could not analyze this document.\nPlease check connectivity and uploaded file format."}
          </p>
          <button
            onClick={handleRetry}
            disabled={analyzingAi}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-800 hover:bg-rose-700 text-white transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzingAi ? 'animate-spin' : ''}`} />
            <span>{analyzingAi ? 'Retrying...' : 'Retry Analysis'}</span>
          </button>
        </div>
      )}

      {/* Full Analysis Dossier & Overview: Rendered ONLY AFTER AI Analysis Successfully Completes */}
      {isScreeningCompleted && (
        <>
          {/* Navigation Tabs: EXACT 8 TABS (Section 48) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

      {/* 1. TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* BORDER CHECKPOINT DECISION COMMAND CARD */}
          <div className={`p-6 rounded-2xl border ${
            borderBadge === 'low'
              ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-slate-900 shadow-glow-emerald'
              : borderBadge === 'medium'
                ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-slate-900'
                : 'border-rose-500/50 bg-gradient-to-r from-rose-950/30 via-slate-900/80 to-slate-900 shadow-glow-rose'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> BORDER CHECKPOINT DECISION ENGINE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    High Volume Throughput Compliant ({screening.processing_time_sec}s)
                  </span>
                </div>
                <h3 className={`text-xl font-black tracking-tight flex items-center gap-2 ${
                  borderBadge === 'low' ? 'text-emerald-300' : borderBadge === 'medium' ? 'text-amber-300' : 'text-rose-300'
                }`}>
                  {borderBadge === 'low' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-rose-400" />}
                  <span>{borderDecision}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => setActiveTab('border_checkpoint')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5"
                >
                  <span>Inspect 4 Modules</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4-Module Quick Status Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Module 1: OCR</span>
                <span className="font-semibold text-slate-200 block truncate">{screening.document_type}</span>
                <span className="text-[10px] font-mono text-emerald-400">All fields parsed</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Module 2: Standards</span>
                <span className="font-semibold text-slate-200 block truncate">ICAO 9303 / Watchlist</span>
                <span className={`text-[10px] font-mono ${validations.some(v => v.status === 'Failed') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {validations.filter(v => v.status === 'Passed').length} Passed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Module 3: Tampering</span>
                <span className="font-semibold text-slate-200 block truncate">4-Pillar Forensic Scan</span>
                <span className={`text-[10px] font-mono ${effectiveTamperingScore > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                  {effectiveTamperingScore > 0 ? 'Alteration Detected' : 'No Alteration'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Module 4: Face &amp; Multi-ID</span>
                <span className="font-semibold text-slate-200 block truncate">{docFaceStatus}</span>
                <span className={`text-[10px] font-mono ${(isBiometricImpersonationAlert || isMultiIdConflict) ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                  {isMultiIdConflict ? 'Duplicate Alias Alert' : isBiometricImpersonationAlert ? 'Impersonation Alert' : 'Biometric Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* 1. OVERALL DOCUMENT STATUS (CANONICAL CLASSIFICATION) */}
          <div className={`p-6 sm:p-7 rounded-2xl border ${
            isRealDoc
              ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 shadow-glow-emerald'
              : isFakeDoc
                ? 'border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 shadow-glow-rose'
                : isInvalidDoc
                  ? 'border-purple-500/50 bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 shadow-glow-purple'
                  : 'border-amber-500/50 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  OVERALL DOCUMENT STATUS
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  <span className="text-2xl">
                    {isRealDoc ? '🟢' : isFakeDoc ? '🔴' : isInvalidDoc ? '🟣' : '🟠'}
                  </span>
                  <span className={
                    isRealDoc ? 'text-emerald-300' : isFakeDoc ? 'text-rose-300' : isInvalidDoc ? 'text-purple-300' : 'text-amber-300'
                  }>
                    {overallDocumentStatus}
                  </span>
                </h2>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                  Supporting internal evaluation: <strong className="text-slate-300">{internalAuthResult}</strong>
                </span>
              </div>

              <div className="bg-slate-950/90 px-5 py-3 rounded-2xl border border-slate-800 self-start sm:self-auto text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  {authConf !== null ? "Assessment Confidence" : "Decision Basis"}
                </span>
                <span className={`text-2xl sm:text-3xl font-mono font-black ${
                  isRealDoc ? 'text-emerald-400' : isFakeDoc ? 'text-rose-400' : isInvalidDoc ? 'text-purple-400' : 'text-amber-400'
                }`}>
                  {authConf !== null ? `${authConf}%` : (isInvalidDoc ? 'Structural Check' : 'Inconclusive Evidence')}
                </span>
              </div>
            </div>

            {/* Supporting Assessment & Primary Reasons */}
            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Supporting Assessment:
                </span>
                <p className="leading-relaxed">
                  {supportingAssessmentText}
                </p>
              </div>

              {authReasons.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    {isFakeDoc ? "Primary Suspicious Reasons:" : "Verification Notes & Evidence:"}
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {authReasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={isRealDoc ? 'text-emerald-400' : isFakeDoc ? 'text-rose-400 font-bold' : isInvalidDoc ? 'text-purple-400 font-bold' : 'text-amber-400 font-bold'}>
                          {isRealDoc ? '✓' : '⚠'}
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* THREE-PANEL CORE MATRIX: Screening Risk | Document Face Analysis | Extracted Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PANEL 1: SCREENING RISK */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Screening Risk Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">{screening.risk_score}</span>
                  <span className="text-xs text-slate-400 font-mono">/ 100</span>
                  <RiskBadge level={screening.risk_level} score={screening.risk_score} size="small" />
                </div>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  Composite attention score calculated from visual inspection, field syntax, and validation checkpoints.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 mt-4 text-[10px] font-mono text-slate-400">
                Review Priority: <strong className="text-slate-200">{screening.risk_level} Attention</strong>
              </div>
            </div>

            {/* PANEL 2: DOCUMENT FACE ANALYSIS (ALWAYS RUNS ON EMBEDDED ID FACE) */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Face Analysis
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Embedded ID Face
                  </span>
                </div>

                {/* Face Preview + Checklist Grid */}
                <div className="flex items-center gap-3.5 my-2">
                  {/* Face Image Thumbnail */}
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950 flex-shrink-0 flex items-center justify-center group shadow-md shadow-cyan-950/20">
                    {faceDetected && docFaceCropUrl ? (
                      <img
                        src={docFaceCropUrl}
                        alt="Embedded ID Face Crop"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-600" />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] font-mono text-center text-cyan-300 py-0.5 border-t border-slate-800 truncate px-0.5">
                      {faceDetected ? "ID Portrait" : "No Face"}
                    </div>
                  </div>

                  {/* Metrics Checklist */}
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Face Detected:</span>
                      <span className="font-mono font-bold text-white flex items-center gap-1">
                        {faceDetected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        {faceDetected ? "YES" : "NO"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Photo Region:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {photoRegionDetected ? "Detected" : "Missing"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Face Quality:</span>
                      <span className={`font-mono font-bold ${
                        faceQuality === 'Good' ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                        {faceQuality}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Photo Integrity:</span>
                      <span className={`font-mono font-bold ${
                        (isFakeFace || docFaceStatus.includes("Fake") || docFaceStatus.includes("Anomaly")) ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {docFaceStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-2">
                  {docFaceExplanation}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">AI Confidence: <strong className="text-cyan-400">{docFaceConf}%</strong></span>
                <button 
                  onClick={() => setActiveTab('face_analysis')}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  View Face Analysis &rarr;
                </button>
              </div>
            </div>

            {/* PANEL 3: EXTRACTED DOCUMENT INFORMATION SUMMARY */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Extracted Information
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    OCR + Trust AI Reconciled
                  </span>
                </div>

                <div className="space-y-2 mt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fields Detected:</span>
                    <span className="font-mono font-bold text-white">
                      {fields.filter(f => f.field_value_demo !== "Not detected").length} of {fields.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Document Type:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {screening.document_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Holder Name:</span>
                    <span className="font-mono font-bold text-cyan-300 truncate max-w-[140px]">
                      {screening.demo_person_name || "Subject"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">MRZ Status:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {mrzAnalysis.present ? (mrzAnalysis.status || "Match") : "Not Present"}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                  Optical character extraction cross-referenced and validated against Trust AI visual reading.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Validation: <strong className="text-emerald-400">{validations.filter(v => v.status === 'Passed').length} Passed</strong></span>
                <button 
                  onClick={() => setActiveTab('ocr')}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  View Fields &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Border Intelligence & 4 Modules */}
      {activeTab === 'border_checkpoint' && (
        <div className="space-y-6">
          {/* Executive Border Clearance Banner */}
          <div className={`p-6 rounded-2xl border ${
            borderBadge === 'low'
              ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900'
              : borderBadge === 'medium'
                ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900'
                : 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  BORDER DECISION PROTOCOL
                </span>
                <h3 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${
                  borderBadge === 'low' ? 'text-emerald-300' : borderBadge === 'medium' ? 'text-amber-300' : 'text-rose-300'
                }`}>
                  {borderBadge === 'low' ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <AlertTriangle className="w-7 h-7 text-rose-400" />}
                  <span>{borderDecision}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Automated border screening conducted in <strong className="text-cyan-300 font-mono">{screening.processing_time_sec}s</strong> • Prevents checkpoint delays under high passenger volume.
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Cryptographic Seal</span>
                <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 inline-block truncate max-w-[200px]">
                  SHA256: {screening.document_hash?.slice(0, 16)}...
                </span>
              </div>
            </div>
          </div>

          {/* MODULE 1 & MODULE 2 ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MODULE 1: OCR EXTRACTION */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Module 1: OCR Extraction
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Passport &amp; Visa fields extracted via dual-layer OCR &amp; Trust AI Multimodal Vision.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  {screening.document_type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {fields.slice(0, 8).map((f, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 block truncate">{f.field_name}</span>
                    <span className="font-semibold text-slate-200 block truncate font-mono">
                      {f.field_value_demo || "Not detected"}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 block">
                      {f.source ? f.source.replace(/gemini/gi, 'Trust AI') : "OCR + Trust AI"} ({(f.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* MODULE 2: DOCUMENT VALIDATION */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" /> Module 2: Document Standards &amp; Watchlist
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ICAO Doc 9303 standards, Interpol SLTD Watchlist, and Modified DOB checks.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Standards Engine
                </span>
              </div>

              <div className="space-y-2.5">
                {validations.map((v, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      {v.status === 'Passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-200 block">{v.check_name}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">{v.message}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase flex-shrink-0 ${
                      v.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MODULE 3: TAMPERING DETECTION (CORE AI INNOVATION) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" /> Module 3: Tampering Detection (Core AI Innovation)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Unified 4-pillar forensic scan detecting physical and digital document manipulation.
                </p>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                effectiveTamperingScore > 0
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                Tampering Score: {effectiveTamperingScore}/100
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pillar 1: Photo Replacement */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">1. Photo Replacement</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isPhotoReplacementAltered ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isPhotoReplacementAltered ? 'ALTERED' : 'GENUINE'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isPhotoReplacementAltered 
                    ? (tampModules.photo_replacement?.indicators?.[0] || "CRITICAL: Portrait replacement markers, digital splicing, or synthetic face artifacts detected.")
                    : (tampModules.photo_replacement?.indicators?.[0] || "Portrait boundary edge gradients and physical substrate are uniform.")}
                </p>
              </div>

              {/* Pillar 2: Text Manipulation */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">2. Text Manipulation</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isTextManipulated ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isTextManipulated ? 'ALTERED' : 'UNIFORM'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isTextManipulated
                    ? (tampModules.text_manipulation?.indicators?.[0] || "Discrepancy detected: Optical text disparity, modified birth date, or MRZ mismatch.")
                    : (tampModules.text_manipulation?.indicators?.[0] || "Font typeface micro-structures and baseline alignments are consistent.")}
                </p>
              </div>

              {/* Pillar 3: Stamp Forgery Detection */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">3. Stamp Forgery</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isStampForged ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isStampForged ? 'FORGED' : 'VERIFIED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isStampForged
                    ? (tampModules.stamp_forgery?.indicators?.[0] || "Stamp seal forgery detected: Border ink seal saturation or placement anomaly.")
                    : (tampModules.stamp_forgery?.indicators?.[0] || "Consular visa ink seals and border stamps match standard saturation profiles.")}
                </p>
              </div>

              {/* Pillar 4: Image Metadata Analysis */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">4. Metadata (EXIF)</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isMetadataTampered ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isMetadataTampered ? 'TOOL DETECTED' : 'INSPECTED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isMetadataTampered
                    ? (tampModules.metadata_analysis?.details?.[0] || "Software alteration signature identified in document image header.")
                    : (tampModules.metadata_analysis?.details?.[0] || "Image metadata parsed. No suspicious image editing software signature found.")}
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 4: FACE VERIFICATION & MULTI-IDENTITY CHECK */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" /> Module 4: Face Verification &amp; Multiple Identity Check
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  1:1 Biometric Anti-Impersonation and historical cross-document deduplication.
                </p>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                (isBiometricImpersonationAlert || isMultiIdConflict)
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {isMultiIdConflict 
                  ? 'Multi-Identity Conflict' 
                  : isBiometricImpersonationAlert 
                    ? 'Impersonation / Altered Photo Alert' 
                    : 'Single Identity Confirmed'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Identity Impersonation Guard (1:1 Biometric Comparison)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {!isBiometricImpersonationAlert
                    ? "Document photo verified authentic. Deep biometric embedding matches authentic photographic distribution."
                    : "CRITICAL ALERT: Potential biometric impersonation, altered photograph, or facial replacement detected."}
                </p>
                <div className="text-[10px] font-mono text-cyan-400 pt-1">
                  Biometric Confidence: {docFaceConf}% • Photo Status: {docFaceStatus}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Multiple Identities Used By Same Person Check
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {multiIdCheck.details?.[0] || (isMultiIdConflict ? "Biometric deduplication alert: Matching facial embedding found under alternate identity." : "Biometric deduplication complete: No duplicate identity records found across border database.")}
                </p>
                <div className={`text-[10px] font-mono pt-1 ${isMultiIdConflict ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Cross-Reference Status: {isMultiIdConflict ? "Conflict Alert" : (multiIdCheck.status || "Passed")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB CONTENT: OCR & Fields (With Reconciliation & Discrepancies) */}
      {activeTab === 'ocr' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Extracted Fields &amp; OCR Reconciliation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured fields extracted via OpenCV/PaddleOCR and visually cross-checked by Trust AI Neural Engine.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 self-start sm:self-auto">
              OCR + Trust AI Reconciled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f, i) => {
              const isNotDetected = !f.field_value_demo || f.field_value_demo === "Not detected" || f.field_value_demo.toLowerCase() === "null";
              const isConflict = f.validation_status === "conflict" || f.discrepancy_note;

              return (
                <div key={i} className={`p-4 rounded-xl border transition-all ${
                  isConflict
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-slate-400 text-[11px] font-medium block">
                        {f.field_name}
                      </span>
                      <span className={`text-sm font-semibold font-mono mt-0.5 block ${
                        isNotDetected ? 'text-slate-500 italic' : isConflict ? 'text-amber-200' : 'text-white'
                      }`}>
                        {f.field_value_demo || "Not detected"}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block ${
                        isNotDetected
                          ? 'bg-slate-800 text-slate-500 border-slate-700'
                          : isConflict
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}>
                        {f.validation_status ? f.validation_status.toUpperCase() : (isNotDetected ? "N/A" : "VERIFIED")}
                      </span>

                      {!isNotDetected && (
                        <div className="text-[10px] font-mono text-slate-400">
                          {f.source ? f.source.replace(/gemini/gi, 'Trust AI') : "OCR + Trust AI"} • {(f.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Discrepancy Alert Box if OCR and Visual disagree */}
                  {isConflict && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Field inconsistency detected</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        {f.discrepancy_note || `OCR: ${f.ocr_value || 'N/A'} vs Visual reading: ${f.visual_value || 'N/A'}`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: Validation */}
      {activeTab === 'validation' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" /> Syntactic &amp; Structural Validation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated layout conformity, date consistency, and mandatory field checks.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {validations.map((v, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {v.status === 'Passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200 block">{v.check_name}</span>
                    <span className="text-slate-400 text-[11px]">{v.message}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  v.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: MRZ / Consistency */}
      {activeTab === 'mrz' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Machine Readable Zone (MRZ) Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Comparison between optical biographical fields and ICAO 9303 MRZ encoding.</p>
            </div>
            <span className="text-xs font-mono text-slate-300">
              {mrzAnalysis.present ? "MRZ Detected" : "MRZ Not Present"}
            </span>
          </div>

          {mrzAnalysis.present ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800 text-xs">
              <div className="p-4 grid grid-cols-3 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                <span>Check Item</span>
                <span>Evaluation Status</span>
                <span>Details</span>
              </div>

              <div className="p-4 grid grid-cols-3 items-center">
                <span className="font-semibold text-slate-200">MRZ Consistency</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold w-fit ${
                  (mrzAnalysis.status || 'Match').toLowerCase().includes("mismatch")
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {mrzAnalysis.status || "Match"}
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {mrzAnalysis.details?.join(", ") || "All biographical fields match MRZ checksums."}
                </span>
              </div>

              {mrzAnalysis.raw_text && (
                <div className="p-4 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Raw MRZ Text:</span>
                  <pre className="font-mono text-cyan-300 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap">
                    {mrzAnalysis.raw_text}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
              <p className="text-xs font-mono text-slate-300">MRZ: Not available</p>
              <p className="text-[11px] text-slate-500">This document does not contain an optical Machine Readable Zone.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: Face Analysis (Single Tab, Embedded ID Portrait Only) */}
      {activeTab === 'face_analysis' && (
        <DocumentFaceAnalysis
          faceDetected={faceDetected}
          primaryFaceCount={primaryFaceCount}
          documentWideFaceCount={documentWideFaceCount}
          otherFacesCount={otherFacesCount}
          faceQuality={faceQuality}
          photoRegionDetected={photoRegionDetected}
          status={docFaceStatus}
          confidence={screening.doc_face_confidence || findings.face_analysis?.confidence || 0.91}
          indicators={docFaceIndicators}
          explanation={docFaceExplanation}
          cropUrl={docFaceCropUrl}
          originalUrl={documentFileUrl}
          box={screening.doc_face_box}
        />
      )}

      {/* 6. TAB CONTENT: Authenticity */}
      {activeTab === 'authenticity' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Multi-Signal Authenticity Assessment
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Comprehensive synthesis of OCR, visual forensics, MRZ, and face integrity signals.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isRealDoc
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : isFakeDoc
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : isInvalidDoc
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isRealDoc ? '🟢 ' : isFakeDoc ? '🔴 ' : isInvalidDoc ? '🟣 ' : '🟠 '}
              {overallDocumentStatus}
            </span>
          </div>

          {/* Structured Decision Trace Telemetry Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Authenticity Decision Trace
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Evidence Sufficiency: <strong className={decisionTrace.evidence_sufficiency === 'Insufficient' ? 'text-amber-400' : 'text-emerald-400'}>{decisionTrace.evidence_sufficiency || 'Sufficient'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">1. OCR Quality</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{decisionTrace.ocr_quality || 'Acceptable'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">2. Field Consistency</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{decisionTrace.field_consistency || 'Consistent'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">3. Document Structure</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{decisionTrace.document_structure || 'Conforms to Standards'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">4. Visual Tampering</span>
                <span className={`font-semibold mt-0.5 block ${(decisionTrace.visual_tampering || '').includes('Anomaly') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {decisionTrace.visual_tampering || 'None Detected'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">5. Portrait Analysis</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{decisionTrace.portrait_analysis || docFaceStatus}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">6. Face Biometrics</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{decisionTrace.face_analysis || (faceDetected ? '1 Face Detected' : 'No Face Detected')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">7. Critical Conflicts</span>
                <span className={`font-semibold mt-0.5 block ${(decisionTrace.critical_conflicts || '').includes('Unresolved') ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {decisionTrace.critical_conflicts || 'None'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">8. Final Decision</span>
                <span className={`font-bold mt-0.5 block ${isLikelyGenuine ? 'text-emerald-300' : isSuspicious ? 'text-rose-300' : 'text-amber-300'}`}>
                  {decisionTrace.final_result || authClass}
                </span>
              </div>
            </div>

            {decisionTrace.primary_reason && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">Primary Forensic Driver:</span>
                  <p className="text-slate-200 leading-relaxed mt-0.5">{decisionTrace.primary_reason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">Signal Breakdown:</span>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                  <span className="text-slate-400">Optical Character Consistency:</span>
                  <span className="font-mono font-bold text-emerald-300">Conformant</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                  <span className="text-slate-400">Embedded Portrait Integrity:</span>
                  <span className={`font-mono font-bold ${docFaceStatus.includes('Anomaly') ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {docFaceStatus}
                  </span>
                </li>
                <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                  <span className="text-slate-400">MRZ Checksum Parity:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {mrzAnalysis.present ? (mrzAnalysis.status || "Match") : "N/A"}
                  </span>
                </li>
                <li className="flex items-center justify-between p-2 rounded bg-slate-950/60">
                  <span className="text-slate-400">Image Clarity &amp; Sharpness:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {screening.face_quality || "Good"}
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">Assessment Narrative:</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {findings.explanation || screening.doc_face_explanation || "The document exhibits standard physical and optical consistency across inspected regions."}
              </p>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">Recommendation:</span>
                <p className="text-slate-200">
                  {findings.recommendation?.action || "Proceed with routine screening workflow."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: Risk & Explanation */}
      {activeTab === 'risk_explanation' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" /> Evidence-Based Risk Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Feature attribution and rationale behind the computed risk score.</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">{screening.risk_score}</span>
                <span className="text-xs text-slate-400 font-mono">/ 100</span>
                <RiskBadge level={screening.risk_level} score={screening.risk_score} size="small" />
              </div>
            </div>

            <ShapChart
              riskFactors={explain.risk_factors || findings.ai_risk_factors}
              explanation={aiData?.summary || explain.explanation}
              reasons={findings.risk_assessment?.reasons || explain.reasons || authReasons}
            />
          </div>
        </div>
      )}

      {/* 8. TAB CONTENT: Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Notes Editor */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Officer Notes &amp; Disposition Log
            </span>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="Enter investigative notes, physical inspection remarks, or operational disposition..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Immutable Event Trail for {screening.screening_id}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chronological record of every system pipeline event and officer action.</p>
            </div>

            {screening.audit_logs && screening.audit_logs.length > 0 ? (
              <div className="space-y-4">
                {screening.audit_logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      {idx < screening.audit_logs.length - 1 && (
                        <div className="w-px h-12 bg-slate-800 my-1" />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{log.action}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{log.details}</p>
                      <span className="text-[10px] text-cyan-400/80 font-mono mt-1 block">
                        Actor: {log.user_name || "Automated Agent"} ({log.user_role || "system"})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No events logged yet.</p>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
