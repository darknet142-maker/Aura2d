import React from 'react';
import { Scissors, RotateCcw } from 'lucide-react';

export interface TrendStudioVideoTrimmerProps {
  totalDuration: number;
  trimStartSec: number;
  trimEndSec: number;
  onChangeTrim: (start: number, end: number) => void;
  onPreviewSeek?: (timeSec: number) => void;
}

function fmtSec(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rem = (s % 60).toFixed(1);
  return `${m}:${rem.padStart(4, '0')}`;
}

export const TrendStudioVideoTrimmer: React.FC<TrendStudioVideoTrimmerProps> = ({
  totalDuration, trimStartSec, trimEndSec, onChangeTrim, onPreviewSeek,
}) => {
  const safeTotal = Math.max(3, totalDuration);
  const safeEnd = trimEndSec > 0 ? Math.min(safeTotal, trimEndSec) : safeTotal;
  const safeStart = Math.max(0, Math.min(trimStartSec, safeEnd - 2));
  const trimmedDuration = Math.max(2, Math.round((safeEnd - safeStart) * 10) / 10);
  const isTrimmed = safeStart > 0.1 || safeEnd < safeTotal - 0.1;

  const startPct = Math.max(0, Math.min(100, (safeStart / safeTotal) * 100));
  const widthPct = Math.max(5, Math.min(100 - startPct, ((safeEnd - safeStart) / safeTotal) * 100));

  const handleStartChange = (val: number) => {
    const nextStart = Math.min(val, safeEnd - 2);
    onChangeTrim(nextStart, safeEnd);
    onPreviewSeek?.(nextStart);
  };

  const handleEndChange = (val: number) => {
    const nextEnd = Math.max(val, safeStart + 2);
    onChangeTrim(safeStart, nextEnd);
    onPreviewSeek?.(nextEnd);
  };

  const handleReset = () => {
    onChangeTrim(0, safeTotal);
    onPreviewSeek?.(0);
  };

  return (
    <div className="rounded-2xl bg-[#07090E]/85 backdrop-blur-xl border border-white/18 p-2.5 space-y-2 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Scissors className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-bold text-[#F8FAFC] truncate">Extrait à publier</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300">
            {trimmedDuration.toFixed(1)}s
          </span>
        </div>
        {isTrimmed && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] text-[#A3A9BA] hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition cursor-pointer"
            aria-label="Réinitialiser l'extrait complet"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Tout garder</span>
          </button>
        )}
      </div>

      <div className="relative h-2 w-full rounded-full bg-white/12 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-400 to-[#DE1B34] rounded-full shadow-sm transition-all"
          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-0.5">
        <label className="flex flex-col gap-0.5 text-[10px] text-[#A3A9BA]">
          <span className="flex items-center justify-between font-mono">
            <span>Début :</span>
            <strong className="text-[#F8FAFC]">{fmtSec(safeStart)}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, safeEnd - 2)}
            step={0.1}
            value={safeStart}
            onChange={(e) => handleStartChange(parseFloat(e.target.value))}
            aria-label="Curseur début de l'extrait"
            className="w-full h-1.5 rounded-full accent-amber-400 bg-white/20 cursor-pointer"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-[10px] text-[#A3A9BA]">
          <span className="flex items-center justify-between font-mono">
            <span>Fin :</span>
            <strong className="text-[#F8FAFC]">{fmtSec(safeEnd)}</strong>
          </span>
          <input
            type="range"
            min={Math.min(safeTotal, safeStart + 2)}
            max={safeTotal}
            step={0.1}
            value={safeEnd}
            onChange={(e) => handleEndChange(parseFloat(e.target.value))}
            aria-label="Curseur fin de l'extrait"
            className="w-full h-1.5 rounded-full accent-[#DE1B34] bg-white/20 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
