import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FilePlus2, 
  Sparkles,
  Files, 
  FileText, 
  History, 
  BarChart3, 
  Settings, 
  LogOut, 
  Users,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

export const Logo = ({ size = "default" }) => (
  <div className="flex items-center gap-3">
    <div className="relative flex items-center justify-center">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-700 flex items-center justify-center shadow-glow-cyan border border-cyan-400/30">
        <ShieldCheck className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75" />
      </div>
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="font-extrabold tracking-wider text-xl text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-cyan-700 to-sky-600 dark:from-white dark:via-cyan-100 dark:to-sky-400">
          TRUSTID
        </span>
        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-sm">
          3.6 FLASH
        </span>
      </div>
      <p className="text-[10px] text-slate-400 font-medium tracking-tight">
        Document Intelligence
      </p>
    </div>
  </div>
);

export const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isOpen } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build role-based navigation items strictly matching prompt
  // Admin: Dashboard, New Screening, Documents, Reports, Audit Trail, User Management, Analytics, Settings
  // User: Dashboard, New Screening, Documents, Reports, My Activity, Profile
  const navItems = isAdmin ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/screenings/new', label: 'New Screening', icon: FilePlus2, highlight: true },
    { to: '/documents', label: 'Documents', icon: Files },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/audit', label: 'Audit Trail', icon: ShieldCheck },
    { to: '/users', label: 'User Management', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ] : [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/screenings/new', label: 'New Screening', icon: FilePlus2, highlight: true },
    { to: '/documents', label: 'Documents', icon: Files },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/history', label: 'My Activity', icon: History },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className={`w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-30 select-none transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Top Brand Header */}
      <div className="p-5 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <NavLink to="/dashboard" className="flex-1">
            <Logo />
          </NavLink>
        </div>
        
        <div className="mt-3.5 space-y-1">
          <p className="text-[10px] text-slate-300 font-semibold tracking-tight">
            Secure Digital Document &amp; Identity Screening
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Trust AI Engine
            </span>
            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>{isAdmin ? "Admin Console" : "Screening Officer"}</span>
          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
            {isAdmin ? "ADMIN" : "USER"}
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                ${isActive 
                  ? 'bg-sky-100 text-sky-900 border border-sky-400 font-bold shadow-sm dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30' 
                  : item.highlight 
                    ? 'text-sky-700 dark:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-sky-300 dark:border-sky-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isAdmin ? 'bg-purple-950 text-purple-300 border border-purple-800/60' : 'bg-sky-950 text-sky-300 border border-sky-800/60'
            }`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || (isAdmin ? 'Subhashree Saha' : 'User')}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono capitalize truncate">
                  {isAdmin ? 'Administrator' : 'User'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
