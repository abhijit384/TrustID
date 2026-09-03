import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Files, 
  ExternalLink, 
  Download, 
  AlertTriangle, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { screeningsAPI, reportsAPI } from '../services/api';

export const Documents = () => {
  const [searchParams] = useSearchParams();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [riskFilter, setRiskFilter] = useState('all');
  const [docTypeFilter, setDocTypeFilter] = useState('all');

  const fetchScreenings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (riskFilter !== 'all') params.risk_level = riskFilter;
      if (docTypeFilter !== 'all') params.doc_type = docTypeFilter;

      const res = await screeningsAPI.list(params);
      setScreenings(res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, [riskFilter, docTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchScreenings();
  };

  const handleDownloadPdf = async (id, scrId) => {
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
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Screened Documents Archive
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Previous Screenings: {screenings.length} {screenings.length === 1 ? 'document' : 'documents'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Searchable and filterable archive of all synthetic identity documents analyzed by the platform.
          </p>
        </div>

        <Link
          to="/screenings/new"
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-glow-cyan hover:opacity-90 transition-all self-start md:self-auto"
        >
          + New Screening
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Doc Type Filter */}
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Document Types</option>
            <option value="Passport">Passports</option>
            <option value="National Identity Card">National ID Cards</option>
            <option value="Driving Licence">Driving Licences</option>
          </select>

          <button
            onClick={fetchScreenings}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Screening ID</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Subject Name</th>
                <th className="py-3.5 px-4">Assessment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">SHA-256 Hash</th>
                <th className="py-3.5 px-4">Screening Officer</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching documents from database...
                  </td>
                </tr>
              ) : screenings.length > 0 ? (
                screenings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {s.screening_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {s.document_type}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {s.demo_person_name || "Alex Morgan"}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={s.risk_level} score={s.risk_score} size="small" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {s.status}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                      {s.document_hash ? `${s.document_hash.substring(0, 10)}...` : 'Verified'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {s.officer_name || "Officer A. Morgan"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/analysis/${s.screening_id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 border border-slate-700 transition-colors"
                          title="View Detailed Analysis"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(s.id, s.screening_id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No documents matched your search filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
