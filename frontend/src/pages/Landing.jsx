import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Scan, 
  FileCheck2, 
  AlertOctagon, 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  History, 
  Fingerprint, 
  Layers, 
  Eye, 
  CheckCircle2, 
  UserCheck, 
  FileText,
  Award,
  Zap,
  Activity
} from 'lucide-react';
import { Logo } from '../components/Sidebar';
import { CyberMatrixCanvas } from '../components/ThreeD/CyberMatrixCanvas';
import { HoloCard3D } from '../components/ThreeD/HoloCard3D';
import { TiltCard3D } from '../components/ThreeD/TiltCard3D';

export const Landing = () => {
  const workflowSteps = [
    { name: "1. Upload", icon: Scan, desc: "Drop synthetic demo document" },
    { name: "2. Quality", icon: FileCheck2, desc: "Resolution & integrity check" },
    { name: "3. OCR", icon: FileText, desc: "Optical text extraction" },
    { name: "4. Validate", icon: FileCheck2, desc: "Checksums & format verification" },
    { name: "5. MRZ Check", icon: Layers, desc: "OCR vs MRZ parity cross-check" },
    { name: "6. Tampering", icon: Eye, desc: "Error Level Analysis (ELA)" },
    { name: "7. Face Match", icon: UserCheck, desc: "Biometric ArcFace alignment" },
    { name: "8. Risk Engine", icon: Cpu, desc: "Multi-factor Bayesian scoring" },
    { name: "9. Trust AI", icon: Sparkles, desc: "Explainable natural language" },
    { name: "10. Review & Report", icon: Lock, desc: "Audit-stamped PDF dossier" },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      {/* Interactive 3D Cyber Particle Canvas Background */}
      <CyberMatrixCanvas />

      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> TRUSTID AI • TRUST AI ENGINE
            </div>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-90 transition-all flex items-center gap-2"
            >
              <span>Launch Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Interactive 3D Hologram */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden">
        {/* Ambient glow gradients */}
        <div className="absolute top-10 left-1/3 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-sky-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-10 w-96 h-96 bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Hero Copy (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-400 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Enterprise Border Security • AI Decision Support</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Next-Gen <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500">
                  AI Forensic ID
                </span> Verification
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Multimodal synthetic identity &amp; document screening with real-time Error Level Analysis (ELA), 1:1 facial biometric embeddings, and Trust AI explainability.
              </p>

              {/* Highlights Feature Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" /> Latency
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">&lt; 3.2 Seconds</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> AI Engine
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">Trust AI Neural</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> Integrity
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">SHA-256 Stamp</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-glow-cyan hover:opacity-95 transition-all flex items-center gap-2.5"
                >
                  <span>Launch Live Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  Explore 10-Stage Pipeline
                </a>
              </div>
            </div>

            {/* Right Column: 3D Holographic ID Card (5 cols) */}
            <div className="lg:col-span-5 w-full">
              <TiltCard3D maxTilt={6} scale={1.01} glare={false}>
                <div className="glass-panel p-4 rounded-3xl border border-cyan-500/30 bg-slate-900/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      3D Interactive Forensic Terminal
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      SYSTEM CAPABILITIES
                    </span>
                  </div>

                  {/* 3D Holographic Card Canvas */}
                  <HoloCard3D className="mt-2" />
                </div>
              </TiltCard3D>
            </div>

          </div>

          {/* Interactive Hero Pipeline Illustration */}
          <div className="mt-16 p-6 rounded-2xl glass-panel border border-slate-800/90 shadow-2xl relative">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-left flex items-center justify-between">
              <span>Automated Verification Decision-Support Flow</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                End-to-End Pipeline
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <TiltCard3D maxTilt={10}>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center h-full">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2">
                    <Scan className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">1. Document Input</span>
                  <p className="text-[11px] text-slate-500 mt-1">Synthetic ICAO passport / ID</p>
                </div>
              </TiltCard3D>

              <TiltCard3D maxTilt={10}>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center h-full">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">2. Multi-Layer Analysis</span>
                  <p className="text-[11px] text-slate-500 mt-1">OCR, MRZ, ELA Forensics</p>
                </div>
              </TiltCard3D>

              <TiltCard3D maxTilt={10}>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center h-full">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">3. Face Verification</span>
                  <p className="text-[11px] text-slate-500 mt-1">ArcFace 1:1 embedding match</p>
                </div>
              </TiltCard3D>

              <TiltCard3D maxTilt={10}>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center h-full">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">4. Trust AI Decision</span>
                  <p className="text-[11px] text-slate-500 mt-1">Explainable review guidance</p>
                </div>
              </TiltCard3D>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Workflow Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-bold">
              Procedural Rigor
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Comprehensive 10-Stage Screening Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every document follows a strict multi-layer intelligence flow from capture to cryptographic audit.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <TiltCard3D key={idx} maxTilt={12} scale={1.03}>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center h-full hover:border-cyan-500/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 font-mono text-xs font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-200">{step.name}</span>
                    <p className="text-[10px] text-slate-500 mt-1">{step.desc}</p>
                  </div>
                </TiltCard3D>
              );
            })}
          </div>
        </div>
      </section>

      {/* Secure by Design Section */}
      <section className="py-16 px-6 bg-slate-950/40 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure by Design Architecture</h3>
            <p className="text-xs text-slate-400 mt-1">Built to meet stringent regulatory security and privacy principles.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
              <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Strict RBAC</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Administrator and User authorization guardrails.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
              <History className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Immutable Audit Trail</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Every upload, inspection, and report export is timestamped.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
              <Fingerprint className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">SHA-256 Verification</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time cryptographic hash comparison to prevent tampering.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Decision Support Only</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Trust AI provides explainability; humans retain enforcement authority.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Disclaimer */}
      <footer className="border-t border-slate-800 py-10 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <div className="text-center md:text-right max-w-xl">
            <p className="text-xs text-slate-400 leading-relaxed">
              <b>NOTICE:</b> Developed as an enterprise identity and document screening decision-support system. Operates strictly with synthetic demo test data. The system does not make autonomous detention or enforcement determinations.
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-2">
              TRUSTID Platform • Enterprise Edition • Demo Mode Active
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
