import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const RiskBadge = ({ level = "Low", score, showIcon = true, size = "default" }) => {
  const normLevel = String(level).toLowerCase();

  let config = {
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
    icon: ShieldCheck,
    label: 'Low Risk'
  };

  if (normLevel.includes('high') || normLevel.includes('flag') || normLevel.includes('tamper')) {
    config = {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      dot: 'bg-rose-400',
      icon: AlertCircle,
      label: 'High Risk'
    };
  } else if (normLevel.includes('medium') || normLevel.includes('review') || normLevel.includes('warning')) {
    config = {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      dot: 'bg-amber-400',
      icon: AlertTriangle,
      label: 'Review Required'
    };
  } else if (normLevel.includes('pending') || normLevel.includes('info')) {
    config = {
      bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      dot: 'bg-sky-400',
      icon: Info,
      label: 'Pending Review'
    };
  }

  const Icon = config.icon;
  const isSmall = size === "small";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide font-mono ${config.bg} ${
      isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    }`}>
      {showIcon && <Icon className={isSmall ? "w-3 h-3 flex-shrink-0" : "w-3.5 h-3.5 flex-shrink-0"} />}
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="opacity-80 pl-1 border-l border-current/20">
          {score}/100
        </span>
      )}
    </span>
  );
};
