import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, ShieldCheck, AlertTriangle, ExternalLink, Sparkles, Filter } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { screeningsAPI, reportsAPI } from '../services/api';

export const Reports = () => {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await screeningsAPI.list();
        setScreenings(res.data);
      } catch (err) {
        console.error("Failed to load reports list:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = async (id, scrId) => {
    setDownloadingId(id);
    try {
      const res = await reportsAPI.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TRUSTID_Report_${scrId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF report.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Screening Reports Archive
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            PDF Engine Ready
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Export tamper-evident, audit-stamped PDF dossiers for authorized case review and legal compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading exportable reports...
          </div>
        ) : screenings.map((s) => (
          <div key={s.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono font-bold text-sm text-sky-400">{s.screening_id}</span>
                <RiskBadge level={s.risk_level} score={s.risk_score} size="small" />
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-semibold text-slate-200">{s.demo_person_name || "Alex Morgan"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Document Type:</span>
                  <span className="text-slate-300">{s.document_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Screening Officer:</span>
                  <span className="text-slate-300">{s.officer_name || "Officer A. Morgan"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SHA-256 Digest:</span>
                  <span className="font-mono text-[10px] text-slate-500">{s.document_hash?.substring(0, 14)}...</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <Link
                to={`/analysis/${s.screening_id || s.id}`}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <span>Inspect</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <button
                onClick={() => handleDownload(s.id, s.screening_id)}
                disabled={downloadingId === s.id}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {downloadingId === s.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
