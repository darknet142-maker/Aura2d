import React from 'react';
import { Play, Disc3, CheckCircle2, Repeat, Clock } from 'lucide-react';
import type { Track } from '../../../../../shared/types/domain.types';

export interface UserListeningHistoryTableProps {
  items: { stat: { listenSeconds: number; loopsCount: number }; track: Track }[];
  onSelectTrack: (trackId: string) => void;
}

export const UserListeningHistoryTable: React.FC<UserListeningHistoryTableProps> = ({
  items, onSelectTrack,
}) => {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#A3A9BA] bg-[#07090E] rounded-xl border border-white/[0.05]">
        Aucune session d&apos;écoute enregistrée pour cet auditeur.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#DE1B34]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
            Historique Exhaustif des Sessions &amp; Validation ECG 30s ({items.length} Pistes)
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400">100% Streams Validés</span>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {items.map(({ stat, track }) => {
          const isEcgValidated = stat.listenSeconds >= 30;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track.id)}
              className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#131722] border border-white/10 shrink-0 flex items-center justify-center">
                  {track.cover ? (
                    <img src={track.cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Disc3 className="w-4 h-4 text-[#DE1B34]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#F8FAFC] truncate group-hover:text-[#DE1B34] transition">
                    {track.title}
                  </p>
                  <p className="text-[10.5px] text-[#A3A9BA] truncate">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                <span className="text-[#A3A9BA] text-[11px] flex items-center gap-1">
                  <Repeat className="w-3 h-3 text-amber-400" />
                  {stat.loopsCount}x ↻
                </span>
                <span className="text-[#F8FAFC] font-bold">
                  {formatTime(stat.listenSeconds)}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 ${
                  isEcgValidated
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {isEcgValidated ? 'ECG 30s' : '< 30s'}
                </span>
                <Play className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

