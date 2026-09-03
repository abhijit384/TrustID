import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ShieldCheck, CheckCircle2, AlertTriangle, X, Sparkles, User as UserIcon, Sun, Moon, Monitor, Check, ChevronDown, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';

export const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, type: 'alert', text: 'Document DEMO-SCR-002 flagged with 76% risk score.', time: '12m ago' },
    { id: 2, type: 'info', text: 'Trust AI neural document analysis model active.', time: '45m ago' },
    { id: 3, type: 'success', text: 'Batch verification & integrity checks completed.', time: '2h ago' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Section 7 exact display names
  const displayName = isAdmin ? (user?.name || "Subhashree Saha") : (user?.name || "User");
  const displayRole = isAdmin ? "Administrator" : "User";

  return (
    <header className={`h-16 bg-[#080c14]/85 backdrop-blur-md border-b border-slate-800/80 fixed top-0 right-0 z-20 px-6 flex items-center justify-between transition-all duration-300 ${isOpen ? 'left-64' : 'left-0'}`}>
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl border border-transparent hover:border-slate-700 transition-all flex items-center justify-center"
          title={isOpen ? "Close sidebar" : "Open sidebar"}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-80 md:w-96 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Screening ID, Person Name, Doc Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
          />
        </form>
      </div>

      {/* Right Controls: System Status & User Info */}
      <div className="flex items-center gap-4">
        {/* Real-time AI Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>TRUSTID AI • Online</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl border border-transparent hover:border-slate-700 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full shadow-glow-amber" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">System Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-xs">
                    <div className="flex items-start gap-2">
                      {n.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />}
                      {n.type === 'info' && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />}
                      {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-slate-300 font-medium">{n.text}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Mode Selector (Dark, Light, System Default) */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl border border-transparent hover:border-slate-700 transition-all flex items-center gap-1"
            title={`Theme: ${theme.toUpperCase()} (${resolvedTheme})`}
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-2.5 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Theme Preference
              </div>
              <button
                onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  theme === 'dark' ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dark Mode</span>
                </div>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  theme === 'light' ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </div>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  theme === 'system' ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Default</span>
                </div>
                {theme === 'system' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Profile Display: Section 7 Requirement */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-100">
              {displayName}
            </p>
            <p className="text-[10px] text-cyan-400 uppercase font-mono font-medium tracking-wider">
              {displayRole}
            </p>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${
            isAdmin ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white' : 'bg-gradient-to-tr from-sky-600 to-cyan-500 text-white'
          }`}>
            {displayName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
