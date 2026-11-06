import React from 'react';
import { RankMedalSvg } from '../../components/CoverArtwork';

export function RankBadge({ rank, delta }: { rank: number; delta: number }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0 font-mono">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${
          rank === 1
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : rank === 2
              ? 'bg-slate-300/15 text-slate-200 border-slate-300/35'
              : rank === 3
                ? 'bg-orange-500/15 text-orange-300 border-orange-500/35'
                : 'bg-white/[0.04] text-[#A3A9BA] border-white/[0.08]'
        }`}
      >
        <span>#{rank}</span>
        <RankMedalSvg rank={rank} className="w-3.5 h-3.5" />
      </span>

      {delta !== 0 && (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
            delta > 0
              ? 'bg-emerald-500/15 text-[#00D25B] border border-emerald-500/30'
              : 'bg-rose-500/15 text-[#FF3B30] border border-rose-500/30'
          }`}
        >
          {delta > 0 ? (
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 12 12">
              <path d="M6 2L11 10H1L6 2Z" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 12 12">
              <path d="M6 10L1 2H11L6 10Z" />
            </svg>
          )}
          <span>{delta > 0 ? `+${delta}` : `${delta}`}</span>
        </span>
      )}
    </div>
  );
}
