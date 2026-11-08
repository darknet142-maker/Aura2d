import React, { useState } from 'react';
import { Activity, ArrowUpRight, ShieldCheck, Flame } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewDualStreamsChartProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
}

const DATA_MAP = {
  '24H': [
    { label: '00h', organic: 1200, sponsored: 180 },
    { label: '04h', organic: 850, sponsored: 120 },
    { label: '08h', organic: 3400, sponsored: 450 },
    { label: '12h', organic: 5200, sponsored: 680 },
    { label: '16h', organic: 4900, sponsored: 620 },
    { label: '20h', organic: 7100, sponsored: 980 },
    { label: '23h', organic: 6400, sponsored: 820 },
  ],
  '7D': [
    { label: 'Lun', organic: 34000, sponsored: 4200 },
    { label: 'Mar', organic: 38500, sponsored: 4900 },
    { label: 'Mer', organic: 41200, sponsored: 5300 },
    { label: 'Jeu', organic: 39800, sponsored: 5100 },
    { label: 'Ven', organic: 52400, sponsored: 6900 },
    { label: 'Sam', organic: 61800, sponsored: 8400 },
    { label: 'Dim', organic: 58900, sponsored: 7800 },
  ],
  '30D': [
    { label: 'Sem 1', organic: 184000, sponsored: 24500 },
    { label: 'Sem 2', organic: 215000, sponsored: 28900 },
    { label: 'Sem 3', organic: 242000, sponsored: 31200 },
    { label: 'Sem 4', organic: 268000, sponsored: 35400 },
  ],
};

export const OverviewDualStreamsChart: React.FC<OverviewDualStreamsChartProps> = ({ onNavigateToSpace }) => {
  const [range, setRange] = useState<'24H' | '7D' | '30D'>('24H');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = DATA_MAP[range];
  const maxVal = Math.max(...data.map((d) => d.organic + d.sponsored)) * 1.15;
  const activePt = hoverIdx !== null && data[hoverIdx] ? data[hoverIdx] : data[data.length - 1];
  const total = activePt.organic + activePt.sponsored;
  const orgPct = Math.round((activePt.organic / total) * 100);

  const getPath = (key: 'organic' | 'sponsored', close = false) => {
    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 680 + 10;
      const y = 140 - (d[key] / maxVal) * 125;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return close ? `${pts} L 690 140 L 10 140 Z` : pts;
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
              Activité de la Plateforme — Télémétrie d&apos;Écoutes &amp; Séparation Hermétique
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#A3A9BA]">
            Distinction étanche : les streams sponsorisés ne génèrent aucune redevance pour les ayants droit BUGADA.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#07090E] p-1 rounded-xl border border-white/10 text-[10.5px] font-mono">
            {(['24H', '7D', '30D'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRange(r); setHoverIdx(null); }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                  range === r ? 'bg-emerald-500 text-[#080A0F] font-bold shadow-sm' : 'text-[#A3A9BA] hover:text-white'
                }`}
              >
                {r === '24H' ? '24 Heures' : r === '7D' ? '7 Jours' : '30 Jours'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSpace('01_CATALOGUE')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer"
            title="Inspecter le catalogue musical"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-xl bg-[#07090E] border border-white/[0.06] font-mono">
        <div className="md:col-span-4">
          <span className="text-[10px] text-[#A3A9BA] uppercase block">Tranche active : {activePt.label}</span>
          <span className="text-base font-extrabold text-[#F8FAFC]">{total.toLocaleString('fr-FR')} Streams</span>
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
          <div className="text-[10.5px]">
            <span className="text-emerald-300 font-bold block">{activePt.organic.toLocaleString('fr-FR')} Organiques ({orgPct}%)</span>
            <span className="text-[#A3A9BA] text-[9.5px]">Génèrent des royalties BUGADA</span>
          </div>
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
          <div className="text-[10.5px]">
            <span className="text-amber-300 font-bold block">{activePt.sponsored.toLocaleString('fr-FR')} Sponsorisés ({100 - orgPct}%)</span>
            <span className="text-amber-400/80 text-[9.5px]">Exclus BUGADA • 100% Jetons B2B</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-44 bg-[#07090E] rounded-xl border border-white/[0.05] p-2 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 700 150" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="sponGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="10" y1="40" x2="690" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="10" y1="90" x2="690" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <path d={getPath('organic', true)} fill="url(#orgGrad)" />
          <path d={getPath('organic', false)} fill="none" stroke="#10B981" strokeWidth="2.5" />
          <path d={getPath('sponsored', true)} fill="url(#sponGrad)" />
          <path d={getPath('sponsored', false)} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 3" />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 680 + 10;
            const y = 140 - (d.organic / maxVal) * 125;
            return (
              <circle
                key={d.label}
                cx={x}
                cy={y}
                r={hoverIdx === i ? 6 : 3.5}
                className="cursor-pointer transition-all"
                fill={hoverIdx === i ? '#FFFFFF' : '#10B981'}
                stroke="#080A0F"
                strokeWidth="2"
                onMouseEnter={() => setHoverIdx(i)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

