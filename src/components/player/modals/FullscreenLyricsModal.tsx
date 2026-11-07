import React, { useEffect, useRef } from 'react';
import { X, Play, Pause, ChevronRight, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatTime } from '../playerEngineHelpers';
import type { LyricLine, PlayerTrackItem } from '../types';
import { CoverArtwork } from '../../CoverArtwork';

export interface FullscreenLyricsModalProps {
  isOpen: boolean;
  currentTrack: PlayerTrackItem;
  currentTime: number;
  isPlaying: boolean;
  activeLyricIdx: number;
  currentLyricist?: string;
  onClose: () => void;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
  onOpenLyricistProfile?: (lyricist: string) => void;
  onShareExcerpt?: (quoteText: string) => void;
}

export const FullscreenLyricsModal: React.FC<FullscreenLyricsModalProps> = ({
  isOpen, currentTrack, currentTime, isPlaying, activeLyricIdx, currentLyricist,
  onClose, onTogglePlay, onSeek, onOpenLyricistProfile, onShareExcerpt,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const trackLyrics: LyricLine[] = currentTrack.lyrics?.length
    ? currentTrack.lyrics
    : [
        { time: 0, text: 'Rythme & Groove du titre...' },
        { time: currentTrack.dropStart, text: '🔥 [DROP] Entrée du refrain' },
        { time: currentTrack.dropStart + 12, text: 'Puissance maximale DROP' },
      ];

  useEffect(() => {
    if (isOpen && activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIdx, isOpen]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Paroles plein écran : ${currentTrack.title}`} className="fixed inset-0 z-[125] bg-[#080A0F] text-[#F8FAFC] flex flex-col overflow-hidden animate-fade-in select-none">
      <div className="absolute inset-0 pointer-events-none opacity-20 filter blur-3xl scale-125">
        <CoverArtwork coverUrl={currentTrack.cover} artworkType={currentTrack.artworkType} title={currentTrack.title} artist={currentTrack.artist} />
      </div>

      <header className="relative z-20 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-white/10 bg-[#080A0F]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/15 shrink-0 shadow-md">
            <CoverArtwork coverUrl={currentTrack.cover} artworkType={currentTrack.artworkType} title={currentTrack.title} artist={currentTrack.artist} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-[#F8FAFC] truncate">{currentTrack.title}</h2>
            <div className="flex items-center gap-2 text-xs text-[#A3A9BA] truncate">
              <span className="font-semibold">{currentTrack.artist}</span>
              {currentLyricist && (
                <button type="button" onClick={() => onOpenLyricistProfile?.(currentLyricist)} className="text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span>• Plume : {currentLyricist}</span><ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button type="button" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Lecture'} className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#DE1B34] text-[#F8FAFC] flex items-center justify-center transition cursor-pointer">
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <span className="font-mono text-xs text-[#A3A9BA] tabular-nums hidden sm:inline">{formatTime(currentTime)} / {formatTime(currentTrack.duration)}</span>
          <button type="button" onClick={onClose} aria-label="Fermer les paroles plein écran" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-[#F8FAFC] flex items-center justify-center transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div ref={scrollContainerRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 py-12 space-y-6 sm:space-y-8 scroll-smooth no-scrollbar">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {trackLyrics.map((line, idx) => {
            const isActive = idx === activeLyricIdx;
            const isPast = idx < activeLyricIdx;
            const cleanText = line.text.replace(/^🔥\s*/, '');
            return (
              <motion.div
                key={idx} ref={isActive ? activeLineRef : null} onClick={() => onSeek(line.time)} layout
                className={`group flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive ? 'bg-white/[0.08] border border-amber-400/40 shadow-[0_8px_30px_rgba(245,158,11,0.15)] scale-[1.02]' : isPast ? 'opacity-40 hover:opacity-80 hover:bg-white/[0.03]' : 'opacity-55 hover:opacity-90 hover:bg-white/[0.03]'
                }`}
              >
                <p className={`text-lg sm:text-2xl md:text-3xl font-extrabold leading-snug tracking-tight transition-colors ${isActive ? 'text-[#F8FAFC]' : 'text-[#A3A9BA]'}`}>
                  {cleanText}
                </p>
                {onShareExcerpt && (
                  <button
                    type="button" onClick={(e) => { e.stopPropagation(); onShareExcerpt(cleanText); }}
                    title="Citer cette punchline" aria-label={`Partager : ${cleanText}`}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-[#080A0F] text-[#F8FAFC] shrink-0 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
