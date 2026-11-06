import React from 'react';
import { X } from 'lucide-react';
import { DropOfficialLogo, CoverArtwork } from '../../CoverArtwork';
import { PlayerAlbumNode } from '../types';

export interface QueueModalProps {
  isOpen: boolean;
  catalogue: PlayerAlbumNode[];
  albumIdx: number;
  trackIdx: number;
  isPlaying: boolean;
  onClose: () => void;
  onSelectTrack: (albumIdx: number, trackIdx: number) => void;
  formatCompactPlays: (count: number, fallback?: string) => string;
  formatTime: (sec: number) => string;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  catalogue,
  albumIdx,
  trackIdx,
  isPlaying,
  onClose,
  onSelectTrack,
  formatCompactPlays,
  formatTime,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-[#07090E]/75 backdrop-blur-md flex flex-col justify-end p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DropOfficialLogo className="h-[18px] w-auto max-w-[90px]" />
            <span className="text-xs text-zinc-400 font-medium">• File de lecture</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {catalogue.map((alb, aIdx) =>
            alb.tracks.map((t, tIdx) => {
              const isCurrent = aIdx === albumIdx && tIdx === trackIdx;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTrack(aIdx, tIdx);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition text-left ${
                    isCurrent
                      ? 'bg-white/15 border-amber-400/50'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                    <CoverArtwork
                      artworkType={t.artworkType}
                      coverUrl={t.cover}
                      title={t.title}
                      artist={t.artist}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {t.artist}
                      {t.featuringArtists && t.featuringArtists.length > 0
                        ? ` feat. ${t.featuringArtists.join(', ')}`
                        : ''}{' '}
                      • {formatCompactPlays(t.realPlays, t.displayPlaysFormatted)} écoutes
                    </p>
                  </div>
                  <span className="text-xs font-medium text-amber-400">
                    {isCurrent
                      ? isPlaying
                        ? 'En écoute'
                        : 'En pause'
                      : formatTime(t.duration)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
