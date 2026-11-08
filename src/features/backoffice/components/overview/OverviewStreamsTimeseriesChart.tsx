import React, { useState } from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewStreamsTimeseriesChartProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
}

const DATA_24H = [
  { label: '00h', organic: 1200, sponsored: 180 },
  { label: '04h', organic: 850, sponsored: 120 },
  { label: '08h', organic: 3400, sponsored: 450 },
  { label: '12h', organic: 5200, sponsored: 680 },
  { label: '16h', organic: 4900, sponsored: 620 },
  { label: '20h', organic: 7100, sponsored: 980 },
  { label: '23h', organic: 6400, sponsored: 820 },
];

const DATA_7D = [
  { label: 'Lun', organic: 34000, sponsored: 4200 },
  { label: 'Mar', organic: 38500, sponsored: 4900 },
  { label: 'Mer', organic: 41200, sponsored: 5300 },
  { label: 'Jeu', organic: 39800, sponsored: 5100 },
  { label: 'Ven', organic: 52400, sponsored: 6900 },
  { label: 'Sam', organic: 61800, sponsored: 8400 },
  { label: 'Dim', organic: 58900, sponsored: 7800 },
];

export const OverviewStreamsTimeseriesChart: React.FC<OverviewStreamsTimeseriesChartProps> = ({
  onNavigateToSpace,
}) => {
  const [range, setRange] = useState<'24H' | '7D'>('24H');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activeData = range === '7D' ? DATA_7D : DATA_24H;
  const maxVal = Math.max(...activeData.map((d) => d.organic + d.sponsored)) * 1.15;
  const activePoint = hoverIndex !== null && activeData[hoverIndex] ? activeData[hoverIndex] : activeData[activeData.length - 1];

  const totalStreamPoint = activePoint.organic + activePoint.sponsored;
  const organicPct = Math.round((activePoint.organic / totalStreamPoint) * 100);
  const royaltiesGenerated = Math.round(activePoint.organic * 1.5);

  const buildPath = (key: 'organic' | 'sponsored', close = false) => {
    const pts = activeData.map((d, i) => {
      const x = (i / (activeData.length - 1)) * 680 + 10;
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
              Activité de la Plateforme — Télémétrie d&apos;Écoutes &amp; Séparation Royalties
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#A3A9BA]">
            Distinction étanche : les streams sponsorisés ne génèrent aucune redevance pour les ayants droit.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#07090E] p-1 rounded-xl border border-white/10 text-[10.5px] font-mono">
            {(['24H', '7D'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRange(r); setHoverIndex(null); }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                  range === r ? 'bg-emerald-500 text-[#080A0F] font-bold shadow-sm' : 'text-[#A3A9BA] hover:text-white'
                }`}
              >
                {r === '24H' ? '24 Heures' : '7 Jours'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigateToSpace('01_CATALOGUE')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer"
            title="Inspecter le catalogue"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inspecteur Interactif au Survol */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-xl bg-[#07090E] border border-white/[0.06] items-center font-mono">
        <div className="md:col-span-4">
          <span className="text-[10px] text-[#A3A9BA] uppercase block">Tranche : {activePoint.label}</span>
          <span className="text-base font-extrabold text-[#F8FAFC]">
            {totalStreamPoint.toLocaleString('fr-FR')} Streams
          </span>
        </div>
        <div className="md:col-span-4 border-l border-white/10 pl-3">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span>■ Organiques ({organicPct}%)</span>
            <span>{activePoint.organic.toLocaleString('fr-FR')}</span>
          </div>
          <span className="text-[9.5px] text-[#A3A9BA] block">
            Droits : <strong className="text-white">{royaltiesGenerated.toLocaleString('fr-FR')} FCFA</strong>
          </span>
        </div>
        <div className="md:col-span-4 border-l border-white/10 pl-3">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span>■ Sponsorisés ({100 - organicPct}%)</span>
            <span>{activePoint.sponsored.toLocaleString('fr-FR')}</span>
          </div>
          <span className="text-[9.5px] text-amber-300 font-bold block">0 FCFA Droits (Exclus BUGADA)</span>
        </div>
      </div>

      {/* Courbes SVG */}
      <div className="relative h-40 w-full pt-1">
        <svg viewBox="0 0 700 160" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="sponGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="0" y1="90" x2="700" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="0" y1="140" x2="700" y2="140" stroke="rgba(255,255,255,0.06)" />

          <path d={buildPath('organic', true)} fill="url(#orgGrad)" />
          <path d={buildPath('organic', false)} fill="none" stroke="#10B981" strokeWidth="2.5" />
          <path d={buildPath('sponsored', true)} fill="url(#sponGrad)" />
          <path d={buildPath('sponsored', false)} fill="none" stroke="#F59E0B" strokeWidth="2" />

          {activeData.map((d, i) => {
            const x = (i / (activeData.length - 1)) * 680 + 10;
            const yOrg = 140 - (d.organic / maxVal) * 125;
            const isHover = hoverIndex === i;
            return (
              <g key={d.label} onMouseEnter={() => setHoverIndex(i)} className="cursor-pointer">
                <circle cx={x} cy={yOrg} r={isHover ? 5.5 : 3.5} fill="#10B981" stroke="#080A0F" strokeWidth="2" />
                <text x={x} y="156" textAnchor="middle" fill="#A3A9BA" fontSize="9" fontFamily="monospace">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
