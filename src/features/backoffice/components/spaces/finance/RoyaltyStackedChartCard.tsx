import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

export const RoyaltyStackedChartCard: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(7);

  const months = [
    { label: 'Jan', total: 565, bugada: 68, master: 271, drop: 226 },
    { label: 'Fév', total: 732, bugada: 88, master: 351, drop: 293 },
    { label: 'Mar', total: 894, bugada: 107, master: 429, drop: 358 },
    { label: 'Avr', total: 1054, bugada: 126, master: 506, drop: 422 },
    { label: 'Mai', total: 920, bugada: 110, master: 442, drop: 368 },
    { label: 'Juin', total: 1140, bugada: 137, master: 547, drop: 456 },
    { label: 'Juil', total: 1280, bugada: 154, master: 614, drop: 512 },
    { label: 'Août', total: 1420, bugada: 170, master: 682, drop: 568 },
  ];

  const active = hoveredIdx !== null ? months[hoveredIdx] : months[months.length - 1];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Redevances Globales — Ventilation Mensuelle
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#A3A9BA]">Modèle B2B 60/40 (BUGADA 12% + Master 48%)</span>
      </div>

      <div className="relative pt-2">
        {active && (
          <div className="p-2.5 mb-2 rounded-xl bg-[#07090E] border border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="font-extrabold text-[#F8FAFC]">{active.label} 2026 : {active.total}k FCFA</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-400 font-bold">Master 48%: {active.master}k</span>
              <span className="text-amber-400 font-bold">BUGADA 12%: {active.bugada}k</span>
              <span className="text-cyan-400 font-bold">DROP 40%: {active.drop}k</span>
            </div>
          </div>
        )}

        <div className="h-36 flex items-end justify-between gap-2 px-2 pt-4">
          {months.map((m, idx) => {
            const hTotal = Math.round((m.total / 1500) * 100);
            const isHover = hoveredIdx === idx;

            return (
              <div
                key={m.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div
                  style={{ height: `${hTotal}%` }}
                  className={`w-full max-w-[36px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all ${
                    isHover ? 'ring-2 ring-white/40' : 'opacity-85 group-hover:opacity-100'
                  }`}
                >
                  <div style={{ height: '40%' }} className="bg-cyan-500/80" title="Plateforme 40%" />
                  <div style={{ height: '12%' }} className="bg-amber-400" title="BUGADA 12%" />
                  <div style={{ height: '48%' }} className="bg-emerald-500" title="Master 48%" />
                </div>
                <span className="text-[10px] font-mono text-[#A3A9BA]">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
