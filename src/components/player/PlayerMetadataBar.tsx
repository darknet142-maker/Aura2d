import React, { useState, useRef, useCallback } from 'react';
import {
  Heart,
  Share2,
  Play,
  UserPlus,
  UserCheck,
  ArrowDownToLine,
} from 'lucide-react';
import {
  AutoMarqueeText,
  CertificationBadgeSvg,
} from '../ReusableAnalyticsSheets';
import { RankMedalSvg } from '../CoverArtwork';
import { CertificationInfo } from '../../utils/rankingEngine';
import { triggerBeatAudioDownload } from '../../services/musicService';
import { PlayerTrackItem } from './types';

export interface PlayerMetadataBarProps {
  currentTrack: PlayerTrackItem;
  currentTrackCert: CertificationInfo;
  isPro: boolean;
  currentArtistSubscribed: boolean;
  currentArtistSubscribersCount: number;
  onToggleSubscribeArtist?: (artist: string) => void;
  isCurrentRecommended: boolean;
  currentRecsCount: number;
  onOpenRecommendModal: () => void;
  isCurrentLiked: boolean;
  onToggleLike: (e: React.MouseEvent) => void;
  onOpenTrackSheet: () => void;
  onOpenArtistProfile: () => void;
  safeRankInfo: { rank: number; delta: number };
  isDropMode: boolean;
  currentTime: number;
  onSeek: (seconds: number) => void;
  formatTime: (sec: number) => string;
  formatCompactPlays: (count: number, fallback?: string) => string;
  onToast: (msg: string, color?: string) => void;
}

export const PlayerMetadataBar: React.FC<PlayerMetadataBarProps> = ({
  currentTrack,
  currentTrackCert,
  isPro,
  currentArtistSubscribed,
  currentArtistSubscribersCount,
  onToggleSubscribeArtist,
  isCurrentRecommended,
  currentRecsCount,
  onOpenRecommendModal,
  isCurrentLiked,
  onToggleLike,
  onOpenTrackSheet,
  onOpenArtistProfile,
  safeRankInfo,
  isDropMode,
  currentTime,
  onSeek,
  formatTime,
  formatCompactPlays,
  onToast,
}) => {
  const [heartAnimKey, setHeartAnimKey] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  // Scrubber geometry
  const duration = Math.max(1, currentTrack.duration);
  const progressPct = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  const dropStartPct = Math.min(100, Math.max(0, (currentTrack.dropStart / duration) * 100));
  const dropWidthPct = Math.min(
    100 - dropStartPct,
    Math.max(0, (currentTrack.dropDuration / duration) * 100)
  );

  const calculateScrubPosition = useCallback(
    (clientX: number) => {
      const el = scrubberRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = clickX / rect.width;
      const targetSec = ratio * duration;
      onSeek(targetSec);
    },
    [duration, onSeek]
  );

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    calculateScrubPosition(e.clientX);
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    calculateScrubPosition(e.clientX);
  };

  const handleScrubberPointerUp = () => {
    setIsScrubbing(false);
  };

  return (
    <section className="relative z-20 px-5 sm:px-6 pt-0.5 pb-1 sm:pb-2 shrink-0">
      {/* 1. Titre, Artiste & Actions Sociales */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          {/* Titre du morceau + Badge Certification */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              onClick={onOpenTrackSheet}
              title={
                isPro
                  ? 'Ouvrir la fiche du titre'
                  : 'Fiche détaillée réservée aux comptes DROP Pro'
              }
              className={`min-w-0 flex-1 text-[20px] sm:text-[24px] leading-tight font-bold text-white tracking-tight transition-colors ${
                isPro ? 'cursor-pointer hover:text-amber-200' : 'cursor-default opacity-90'
              }`}
            >
              <AutoMarqueeText text={currentTrack.title} />
            </div>
            <CertificationBadgeSvg
              cert={currentTrackCert}
              compact
              entityTitle={currentTrack.title}
              entityArtist={currentTrack.artist}
              playsCount={currentTrack.realPlays}
              isPro={isPro}
            />
          </div>

          {/* Ligne Artiste Principal + Featurings + Icône S'abonner */}
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            <div
              onClick={onOpenArtistProfile}
              title={
                isPro
                  ? 'Ouvrir le profil artiste'
                  : 'Profil artiste réservé aux comptes DROP Pro'
              }
              className={`min-w-0 flex-1 text-[13.5px] sm:text-[15px] leading-snug font-semibold text-zinc-200 transition-colors ${
                isPro ? 'cursor-pointer hover:text-amber-300' : 'cursor-default opacity-80'
              }`}
            >
              <AutoMarqueeText
                text={
                  currentTrack.featuringArtists &&
                  currentTrack.featuringArtists.length > 0
                    ? `${currentTrack.artist} feat. ${currentTrack.featuringArtists.join(', ')}`
                    : currentTrack.artist
                }
              />
            </div>

            {/* Bouton d'Abonnement Mobile */}
            <button
              type="button"
              onClick={() => {
                onToggleSubscribeArtist?.(currentTrack.artist);
                onToast(
                  !currentArtistSubscribed
                    ? `Abonné à ${currentTrack.artist}`
                    : `Abonnement retiré pour ${currentTrack.artist}`,
                  !currentArtistSubscribed ? 'bg-emerald-400' : 'bg-zinc-400'
                );
              }}
              className={`w-7 h-7 rounded-full text-[10.5px] font-bold border shrink-0 transition flex items-center justify-center ${
                currentArtistSubscribed
                  ? 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white active:scale-95'
              }`}
              aria-label={
                currentArtistSubscribed
                  ? `Abonné à ${currentTrack.artist}`
                  : `S’abonner à ${currentTrack.artist}`
              }
              title={
                currentArtistSubscribed
                  ? `Abonné à ${currentTrack.artist} (${formatCompactPlays(currentArtistSubscribersCount)})`
                  : `S’abonner à ${currentTrack.artist}`
              }
            >
              {currentArtistSubscribed ? (
                <UserCheck className="w-3.5 h-3.5 shrink-0 stroke-[2.4]" />
              ) : (
                <UserPlus className="w-3.5 h-3.5 shrink-0 stroke-[2.4]" />
              )}
            </button>
          </div>
        </div>

        {/* Actions Sociales : Beat (si applicable) + Partager/Recommander + Like */}
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          {(currentTrack.isInstrumental ||
            currentTrack.category === 'Beats & Instrumentales') && (
            <button
              type="button"
              onClick={() => {
                triggerBeatAudioDownload({
                  title: currentTrack.title,
                  artist: currentTrack.artist,
                  bpm: currentTrack.bpm,
                  duration: currentTrack.duration,
                  audioUrl: currentTrack.audioUrl,
                  synthNotes: currentTrack.synthNotes,
                  dropContentId: currentTrack.dropContentId,
                });
                onToast(
                  `Téléchargement du Beat « ${currentTrack.title} » lancé !`,
                  'bg-cyan-400'
                );
              }}
              className="h-10 px-2.5 sm:px-3 rounded-full bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 flex items-center gap-1.5 active:scale-90 transition shadow-[0_0_14px_rgba(6,182,212,0.28)]"
              title="Télécharger cette instrumentale / Beat (WAV Studio)"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="text-[11px] font-extrabold tracking-tight">Beat</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenRecommendModal}
            className={`h-10 px-2.5 sm:px-3 rounded-full border flex items-center gap-1.5 active:scale-90 transition ${
              isCurrentRecommended
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                : 'bg-white/[0.07] hover:bg-white/[0.14] border-white/15 text-zinc-200'
            }`}
            aria-label="Partager ou recommander ce titre"
            title="Partager en vidéo Trend 30s ou recommander dans le Fil DROP"
          >
            <Share2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[2.1]" />
            <span className="text-xs font-mono font-bold">
              {formatCompactPlays(currentRecsCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              setHeartAnimKey((prev) => prev + 1);
              onToggleLike(e);
              onToast(
                !isCurrentLiked ? 'Ajouté aux titres aimés' : 'Retiré des titres aimés',
                !isCurrentLiked ? 'bg-rose-500' : 'bg-zinc-400'
              );
            }}
            className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center active:scale-90 transition relative shrink-0"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              key={heartAnimKey}
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${
                heartAnimKey > 0 ? 'heart-animate' : ''
              } ${
                isCurrentLiked
                  ? 'text-[#ef233c] fill-[#ef233c] drop-shadow-[0_0_12px_rgba(239,35,60,0.45)]'
                  : 'text-zinc-300 stroke-[2]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Ligne Classement & Lectures */}
      <div className="flex items-center justify-between mt-1.5 sm:mt-2 text-[12px] sm:text-[13px] tabular-nums gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-tight inline-flex items-center gap-1 shrink-0">
            <span>#{safeRankInfo.rank}</span>
            <RankMedalSvg rank={safeRankInfo.rank} className="w-3.5 h-3.5" />
          </span>
          {safeRankInfo.delta !== 0 && (
            <span
              className={`text-[11px] font-mono font-bold flex items-center gap-0.5 shrink-0 ${
                safeRankInfo.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <svg
                className={`w-2.5 h-2.5 fill-current ${
                  safeRankInfo.delta < 0 ? 'rotate-180' : ''
                }`}
                viewBox="0 0 12 12"
              >
                <path d="M6 2L11 10H1L6 2Z" />
              </svg>
              <span>{safeRankInfo.delta > 0 ? `+${safeRankInfo.delta}` : `${safeRankInfo.delta}`}</span>
            </span>
          )}
          {isDropMode && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[10px] font-mono font-bold shrink-0">
              Aperçu Drop
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-zinc-300/90 shrink-0">
          <Play className="w-3.5 h-3.5 text-white fill-current" />
          <span className="font-bold text-white">
            {formatCompactPlays(currentTrack.realPlays, currentTrack.displayPlaysFormatted)}
          </span>
        </div>
      </div>

      {/* 3. Barre de Progression Interactive avec Segment Drop Ambré */}
      <div className="mt-2 sm:mt-2.5">
        <div
          ref={scrubberRef}
          onPointerDown={handleScrubberPointerDown}
          onPointerMove={handleScrubberPointerMove}
          onPointerUp={handleScrubberPointerUp}
          onPointerCancel={handleScrubberPointerUp}
          className={`scrubber-container ${isScrubbing ? 'dragging' : ''}`}
          role="slider"
          aria-label="Progression du titre et zone de Drop"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
        >
          <div className="scrubber-track">
            {/* Segment Drop */}
            <div
              style={{
                left: `${dropStartPct}%`,
                width: `${dropWidthPct}%`,
              }}
              className={`absolute -top-[1.5px] -bottom-[1.5px] rounded-full transition-all pointer-events-none ${
                isDropMode
                  ? 'bg-amber-400/60 ring-1 ring-amber-300/90 shadow-[0_0_16px_rgba(251,191,36,0.85)]'
                  : 'bg-amber-400/35 border-x border-amber-300/70'
              }`}
            />

            {/* Remplissage de progression */}
            <div className="scrubber-fill" style={{ width: `${progressPct}%` }}>
              <div className="scrubber-thumb" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px] font-medium text-zinc-300/80 mt-0.5 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>
    </section>
  );
};
