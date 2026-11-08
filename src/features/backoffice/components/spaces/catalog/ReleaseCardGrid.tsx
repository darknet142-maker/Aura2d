import React from 'react';
import { ReleaseCard } from './ReleaseCard';
import type { Track } from '../../../../../shared/types/domain.types';
import { Music2 } from 'lucide-react';

export interface ReleaseCardGridProps {
  tracks: Track[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onSelectTrack: (trackId: string) => void;
  onEditTrack: (track: Track) => void;
  onResetFilters: () => void;
}

export const ReleaseCardGrid: React.FC<ReleaseCardGridProps> = ({
  tracks, trackRankMap, onSelectTrack, onEditTrack, onResetFilters,
}) => {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0D1017] rounded-2xl border border-white/[0.08] text-center gap-3">
        <Music2 className="w-10 h-10 text-[#A3A9BA]/40" />
        <p className="text-sm font-semibold text-[#F8FAFC]">Aucune release trouvée avec ces critères</p>
        <p className="text-xs text-[#A3A9BA]">Modifiez votre recherche ou réinitialisez les filtres actifs.</p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-2 px-4 py-2 rounded-xl bg-[#DE1B34] text-white text-xs font-bold hover:bg-[#FF4D64] transition cursor-pointer"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
      {tracks.map((track) => (
        <ReleaseCard
          key={track.id}
          track={track}
          rank={trackRankMap[track.id]?.rank}
          onSelectTrack={onSelectTrack}
          onEditTrack={onEditTrack}
        />
      ))}
    </div>
  );
};
