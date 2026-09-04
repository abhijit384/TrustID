import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("TRUSTID UI Error Boundary caught an exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto my-12 p-8 glass-panel rounded-2xl border border-rose-800/80 bg-rose-950/20 text-slate-200 space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3 text-rose-400 font-bold text-lg">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Unable to display analysis results</h2>
              <p className="text-xs text-rose-300/80 font-mono">A client-side UI rendering exception occurred.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-rose-300 space-y-1">
            <div className="text-slate-400 font-bold">Error Details:</div>
            <div className="text-rose-400">{this.state.error?.message || "An unexpected error occurred."}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="px-4 py-2.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
            <Link
              to="/documents"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Documents</span>
            </Link>
            <Link
              to="/new-screening"
              className="px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs border border-cyan-700/50 transition-colors"
            >
              <span>Start New Screening</span>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
