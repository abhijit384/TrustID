import React, { useState, useEffect } from 'react';
import { TiltCard3D } from './ThreeD/TiltCard3D';

export const StatCard = ({ title, value, suffix = "", icon: Icon, change, trend = "up", color = "cyan" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated counter effect
  useEffect(() => {
    let start = 0;
    const end = parseFloat(String(value).replace(/,/g, '')) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 1200; // ms
    const increment = end / (duration / 20);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start * 10) / 10);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      shadow: 'hover:shadow-glow-cyan',
      text: 'text-cyan-400',
    },
    amber: {
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
      shadow: 'hover:shadow-glow-amber',
      text: 'text-amber-400',
    },
    emerald: {
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      shadow: 'hover:shadow-glow-emerald',
      text: 'text-emerald-400',
    },
    rose: {
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500/10 text-rose-400',
      shadow: 'hover:shadow-glow-rose',
      text: 'text-rose-400',
    },
    blue: {
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-400',
      shadow: 'hover:shadow-glow-cyan',
      text: 'text-blue-400',
    }
  };

  const currentTheme = colorStyles[color] || colorStyles.cyan;

  // Format with commas if integer
  const formattedVal = Number.isInteger(displayValue) 
    ? displayValue.toLocaleString() 
    : displayValue.toFixed(1);

  return (
    <TiltCard3D maxTilt={10} scale={1.025}>
      <div className={`glass-panel p-5 rounded-2xl border ${currentTheme.border} transition-all duration-300 ${currentTheme.shadow} h-full`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          {Icon && (
            <div className={`p-2.5 rounded-xl ${currentTheme.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {formattedVal}
          </span>
          {suffix && (
            <span className="text-sm font-semibold text-slate-400">{suffix}</span>
          )}
        </div>

        {change && (
          <div className="mt-2.5 flex items-center gap-1 text-xs">
            <span className={trend === 'down' ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>
              {change}
            </span>
            <span className="text-slate-500">vs last week</span>
          </div>
        )}
      </div>
    </TiltCard3D>
  );
};
