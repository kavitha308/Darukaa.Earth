import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  trendPositive = true,
  subtext,
}) => {
  return (
    <div className="bg-earth-card/90 border border-earth-border rounded-xl p-4 shadow-sm backdrop-blur transition hover:border-brand-700/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-earth-muted uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-earth-dark border border-earth-border/80 text-brand-400">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline space-x-1.5">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>
      {(trend || subtext) && (
        <div className="mt-2 flex items-center space-x-2 text-[11px]">
          {trend && (
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                trendPositive
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : 'bg-rose-950 text-rose-400 border border-rose-800/40'
              }`}
            >
              {trend}
            </span>
          )}
          {subtext && <span className="text-earth-muted truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
