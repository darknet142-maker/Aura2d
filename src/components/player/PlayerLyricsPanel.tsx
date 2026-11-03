import React from 'react';
import { X, ChevronRight, Share2 } from 'lucide-react';
import { LyricLine, PlayerTrackItem } from './types';

export interface PlayerLyricsPanelProps {
  isOpen: boolean;
  isPro: boolean;
  currentTrack: PlayerTrackItem;
  currentTime: number;
  activeLyricIdx: number;
  currentLyricist: string;
  onClose: () => void;
  onSeek: (time: number) => void;
  onOpenLyricistProfile: (lyricist: string) => void;
  onShareExcerpt: (excerptText: string) => void;
  formatTime: (sec: number) => string;
}

export const PlayerLyricsPanel: React.FC<PlayerLyricsPanelProps> = ({
  isOpen,
  isPro,
  currentTrack,
  currentTime,
  activeLyricIdx,
  currentLyricist,
  onClose,
  onSeek,
  onOpenLyricistProfile,
  onShareExcerpt,
  formatTime,
}) => {
  if (!isOpen || !isPro) return null;

  const trackLyrics: LyricLine[] =
    currentTrack.lyrics && currentTrack.lyrics.length > 0
      ? currentTrack.lyrics
      : [
          { time: 0, text: 'Rythme & Groove du titre...' },
          { time: currentTrack.dropStart, text: '🔥 [DROP] Entrée du refrain' },
          { time: currentTrack.dropStart + 12, text: 'Puissance maximale DROP' },
        ];

  return (
    <div className="absolute inset-x-4 sm:inset-x-5 inset-y-1 z-30 rounded-[28px] bg-zinc-950/95 border border-white/15 backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl transition-all animate-fade-in">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wide text-amber-300">
              Paroles Synchronisées
            </span>
            <span className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-400/35 text-violet-300 text-[10px] font-mono">
              Score Plume Actif
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLyricistProfile(currentLyricist);
            }}
            className="text-[11px] text-zinc-300 hover:text-amber-300 flex items-center gap-1 mt-0.5 truncate transition"
          >
            <span className="text-zinc-400">Parolier / Auteur :</span>
            <span className="font-semibold text-white underline decoration-white/30">
              {currentLyricist}
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer les paroles"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="lyrics-scroll flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
        {trackLyrics.map((line, i) => {
          const cleanLine = line.text.replace(/^🔥\s*/, '');
          const isActiveLine = i === activeLyricIdx;
          return (
            <div
              key={i}
              className={`group flex items-center justify-between gap-2 p-2 rounded-xl transition ${
                isActiveLine
                  ? 'bg-white/[0.08] border border-amber-400/35'
                  : 'hover:bg-white/[0.04]'
              }`}
            >
              <p
                onClick={() => onSeek(line.time)}
                className={`lyrics-line flex-1 text-sm sm:text-base font-bold leading-snug cursor-pointer ${
                  isActiveLine ? 'active-lyric text-white' : 'text-zinc-300'
                }`}
              >
                {cleanLine}
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShareExcerpt(`« ${cleanLine.replace('[DROP] ', '')} »`);
                }}
                className="px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/40 text-violet-200 text-[10px] font-mono font-bold shrink-0 transition flex items-center gap-1 active:scale-95"
                title="Partager cet extrait dans le fil commun DROP et valoriser le parolier"
              >
                <span>Extrait</span>
                <Share2 className="w-2.5 h-2.5 text-violet-300" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
        <span>Touchez une phrase pour synchroniser ou « Extrait » pour partager</span>
        <span className="font-mono text-zinc-300">{formatTime(currentTime)}</span>
      </div>
    </div>
  );
};
