import React from 'react';
import { Play, Edit3, Disc3 } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../../shared/ui/springMotion';
import type { Track } from '../../../../../shared/types/domain.types';

export interface ReleaseCardProps {
  track: Track;
  rank?: number;
  onSelectTrack: (trackId: string) => void;
  onEditTrack: (track: Track) => void;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({
  track, rank, onSelectTrack, onEditTrack,
}) => {
  const isBeat = Boolean(track.isInstrumental);
  const lufs = track.lufsMasterLevel ?? -14.0;
  const isLufsCompliant = lufs <= -13.5 && lufs >= -14.5;
  const durationSec = track.duration || 0;
  const formattedDuration = `${Math.floor(durationSec / 60)}:${Math.floor(durationSec % 60).toString().padStart(2, '0')}`;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={SPRING_SNAPPY}
      className="group relative flex flex-col bg-[#0D1017] rounded-2xl border border-white/[0.08] overflow-hidden shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] hover:border-white/20 transition-all"
    >
      <div className="relative aspect-square w-full bg-[#07090E] overflow-hidden flex items-center justify-center">
        {track.cover ? (
          <img
            src={track.cover}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-[#A3A9BA]/40 p-4 text-center">
            <Disc3 className="w-12 h-12 text-[#DE1B34]/60 animate-spin-slow" />
            <span className="text-[10px] font-mono tracking-widest uppercase">DROP MASTER</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-transparent to-transparent opacity-80" />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {track.releaseStatus === 'DRAFT' ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-700/60 border border-zinc-500/40 text-zinc-200 backdrop-blur-md">
              Brouillon
            </span>
          ) : track.releaseStatus === 'PENDING' ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/30 border border-amber-500/50 text-amber-200 backdrop-blur-md">
              En attente
            </span>
          ) : track.releaseStatus === 'SCHEDULED' ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 backdrop-blur-md">
              Programmé
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md">
              En ligne
            </span>
          )}
          {track.isSponsoredAnnouncement && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#DE1B34]/30 border border-[#DE1B34]/60 text-rose-300 backdrop-blur-md shadow-sm">
              ✦ Sponsorisé
            </span>
          )}
          {Boolean(track.isSpatialAudio || track.category === 'Immersif 3D') && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 border border-sky-500/40 text-sky-300 backdrop-blur-md">
              3D
            </span>
          )}
          {isBeat && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md">
              Beat
            </span>
          )}
        </div>

        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={() => onEditTrack(track)}
            className="p-2 rounded-xl bg-[#080A0F]/90 hover:bg-[#DE1B34] text-white border border-white/20 cursor-pointer shadow-lg transition"
            title="Modifier les métadonnées"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTrack(track.id)}
            className="p-2 rounded-xl bg-[#DE1B34] hover:bg-[#FF4D64] text-white cursor-pointer shadow-lg transition"
            title="Ouvrir la fiche master"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4
              onClick={() => onSelectTrack(track.id)}
              className="text-xs font-extrabold text-[#F8FAFC] truncate hover:text-[#DE1B34] cursor-pointer transition"
            >
              {track.title}
            </h4>
            <p className="text-[11px] text-[#A3A9BA] truncate font-medium">{track.artist}</p>
          </div>
          {rank !== undefined && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/90 shrink-0">
              #{rank}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#A3A9BA] pt-2 border-t border-white/[0.06] mt-1">
          <span className="truncate">{track.album || 'Single Broadcast'}</span>
          <span
            className={`shrink-0 font-bold ${
              isLufsCompliant ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {lufs.toFixed(1)} LUFS
          </span>
        </div>

        <div className="flex items-center justify-between text-[9.5px] font-mono text-[#A3A9BA]/80">
          <span className="truncate">CID: {track.id.slice(0, 8)}</span>
          <span className="shrink-0 text-white/90 font-bold">{formattedDuration}</span>
        </div>
      </div>
    </motion.div>
  );
};
