import React from 'react';
import { PieChart } from 'lucide-react';

export const StoresBreakdownCard: React.FC = () => {
  const stores = [
    { name: 'Airtel Money Gabon', pct: 54.0, color: 'bg-emerald-500', text: 'text-emerald-400' },
    { name: 'Moov Money Gabon', pct: 21.2, color: 'bg-[#DE1B34]', text: 'text-red-400' },
    { name: 'Jetons Partenaires / Sponsors', pct: 14.3, color: 'bg-amber-400', text: 'text-amber-300' },
    { name: 'Licences DJ & Broadcast B2B', pct: 8.1, color: 'bg-cyan-400', text: 'text-cyan-300' },
    { name: 'Autres Canaux', pct: 2.4, color: 'bg-slate-400', text: 'text-slate-300' },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Répartition des Canaux de Paiement (12 Derniers Mois)
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#A3A9BA]">Total : 100 %</span>
      </div>

      <div className="h-36 flex items-end justify-between gap-3 px-2 pt-2">
        {stores.map((s) => (
          <div key={s.name} className="flex-1 flex flex-col items-center gap-2 group">
            <span className={`text-[11px] font-mono font-extrabold ${s.text}`}>
              {s.pct}%
            </span>
            <div
              style={{ height: `${s.pct * 1.5}%` }}
              className={`w-full max-w-[42px] rounded-t-lg ${s.color} transition-all group-hover:opacity-90`}
            />
            <span className="text-[9.5px] font-mono text-[#A3A9BA] text-center truncate max-w-[64px]" title={s.name}>
              {s.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
