import React from 'react';
import { Play, Edit3, Disc3 } from 'lucide-react';
import type { Track } from '../../../../../shared/types/domain.types';

export interface ReleaseTableViewProps {
  tracks: Track[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onSelectTrack: (trackId: string) => void;
  onEditTrack: (track: Track) => void;
}

export const ReleaseTableView: React.FC<ReleaseTableViewProps> = ({
  tracks, trackRankMap, onSelectTrack, onEditTrack,
}) => {
  return (
    <div className="w-full overflow-x-auto bg-[#0D1017] rounded-2xl border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/[0.08] text-[11px] font-mono uppercase text-[#A3A9BA] bg-[#07090E]/60">
            <th className="py-3 px-4 w-12 text-center">Rang</th>
            <th className="py-3 px-4">Titre &amp; Artiste</th>
            <th className="py-3 px-4 hidden md:table-cell">Album / Projet</th>
            <th className="py-3 px-4 hidden sm:table-cell">Format</th>
            <th className="py-3 px-4">Mastering LUFS</th>
            <th className="py-3 px-4 hidden lg:table-cell">CID / ISRC</th>
            <th className="py-3 px-4 text-right">Durée</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04] text-xs">
          {tracks.map((track) => {
            const rank = trackRankMap[track.id]?.rank;
            const lufs = track.lufsMasterLevel ?? -14.0;
            const isLufsCompliant = lufs <= -13.5 && lufs >= -14.5;
            const durationSec = track.duration || 0;
            const formattedDuration = `${Math.floor(durationSec / 60)}:${Math.floor(durationSec % 60).toString().padStart(2, '0')}`;

            return (
              <tr
                key={track.id}
                className="hover:bg-white/[0.03] transition group"
              >
                <td className="py-2.5 px-4 text-center font-mono text-[11px] text-[#A3A9BA]">
                  {rank !== undefined ? `#${rank}` : '—'}
                </td>
                <td className="py-2.5 px-4 min-w-[180px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#07090E] shrink-0 border border-white/10 flex items-center justify-center">
                      {track.cover ? (
                        <img src={track.cover} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Disc3 className="w-4 h-4 text-[#DE1B34]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        onClick={() => onSelectTrack(track.id)}
                        className="font-extrabold text-[#F8FAFC] truncate hover:text-[#DE1B34] cursor-pointer"
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#A3A9BA] truncate">{track.artist}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 hidden md:table-cell text-[#A3A9BA] truncate max-w-[140px]">
                  {track.album || 'Single Broadcast'}
                </td>
                <td className="py-2.5 px-4 hidden sm:table-cell">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    track.isInstrumental
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-white/10 text-white/80'
                  }`}>
                    {track.isInstrumental ? 'Beat / Instru' : 'Standard'}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-[11px]">
                  <span className={isLufsCompliant ? 'text-emerald-400' : 'text-amber-400'}>
                    {lufs.toFixed(1)} LUFS
                  </span>
                </td>
                <td className="py-2.5 px-4 hidden lg:table-cell font-mono text-[10.5px] text-[#A3A9BA]">
                  {track.id.slice(0, 8)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-[#F8FAFC]">
                  {formattedDuration}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditTrack(track)}
                      className="p-1.5 rounded-lg bg-[#07090E] hover:bg-[#DE1B34] text-white border border-white/10 cursor-pointer transition"
                      title="Éditer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTrack(track.id)}
                      className="p-1.5 rounded-lg bg-[#DE1B34] hover:bg-[#FF4D64] text-white cursor-pointer transition"
                      title="Inspecter le master"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
