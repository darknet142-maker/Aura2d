import React, { useState, useRef, useCallback } from 'react';
import {
  Heart,
  Share2,
  Play,
  UserPlus,
  UserCheck,
  ArrowDownToLine,
  Flame,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AutoMarqueeText,
  CertificationBadgeSvg,
  StudioEntityRole,
} from '../ReusableAnalyticsSheets';
import { RankMedalSvg } from '../CoverArtwork';
import { CertificationInfo } from '../../utils/rankingEngine';
import { triggerBeatAudioDownload } from '../../services/musicService';
import { SPRING_SNAPPY } from '../../shared/ui/springMotion';
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
  onOpenEntityProfile?: (name: string, role: StudioEntityRole) => void;
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
  onOpenEntityProfile,
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
    Math.max(4, (currentTrack.dropDuration / duration) * 100)
  );
  const isInsideDropZone =
    currentTime >= currentTrack.dropStart &&
    currentTime <= currentTrack.dropStart + currentTrack.dropDuration;

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
    <section className="relative z-20 px-4 sm:px-5 pt-0.5 pb-1 sm:pb-1.5 shrink-0">
      {/* 1. Titre, Artiste & Actions Sociales */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          {/* Titre du morceau + Badge Certification */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onOpenTrackSheet}
              title="Inspecter la fiche analytique, les crédits studio et les paramètres du titre"
              className="min-w-0 flex-1 text-left text-[19px] sm:text-[22px] leading-tight font-extrabold text-[#F8FAFC] hover:text-amber-300 tracking-tight transition-colors cursor-pointer"
            >
              <AutoMarqueeText text={currentTrack.title} />
            </button>
            <CertificationBadgeSvg
              cert={currentTrackCert}
              compact
              entityTitle={currentTrack.title}
              entityArtist={currentTrack.artist}
              playsCount={currentTrack.realPlays}
              isPro={isPro}
            />
          </div>

          {/* Ligne Artiste Principal + Featurings cliquables + Icône S'abonner */}
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={onOpenArtistProfile}
                title={`Ouvrir le profil artiste de ${currentTrack.artist}`}
                className="text-[13px] sm:text-[14.5px] leading-snug font-bold text-[#F8FAFC] hover:text-amber-300 transition-colors cursor-pointer truncate max-w-[180px] sm:max-w-[220px]"
              >
                {currentTrack.artist}
              </button>

              {currentTrack.featuringArtists &&
                currentTrack.featuringArtists.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-mono text-[#A3A9BA]">feat.</span>
                    {currentTrack.featuringArtists.map((feat) => (
                      <button
                        key={feat}
                        type="button"
                        onClick={() =>
                          onOpenEntityProfile
                            ? onOpenEntityProfile(feat, 'ARTIST')
                            : onOpenArtistProfile()
                        }
                        title={`Ouvrir le profil de ${feat}`}
                        className="px-1.5 py-0.5 rounded-md bg-white/[0.06] hover:bg-amber-400/20 border border-white/10 text-[11px] font-semibold text-amber-300 transition cursor-pointer whitespace-nowrap"
                      >
                        {feat}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* Bouton d'Abonnement Mobile */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              transition={SPRING_SNAPPY}
              onClick={() => {
                onToggleSubscribeArtist?.(currentTrack.artist);
                onToast(
                  !currentArtistSubscribed
                    ? `Abonné à ${currentTrack.artist}`
                    : `Abonnement retiré pour ${currentTrack.artist}`,
                  !currentArtistSubscribed ? 'bg-emerald-400' : 'bg-zinc-400'
                );
              }}
              className={`w-7 h-7 rounded-full text-[10.5px] font-bold border shrink-0 flex items-center justify-center ${
                currentArtistSubscribed
                  ? 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300'
                  : 'bg-[#0C0F17] hover:bg-[#131824] border-white/15 text-[#F8FAFC]'
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
            </motion.button>
          </div>

          {/* Barre d'accès rapide aux Crédits & Paramètres Studio (Beatmaker, Label, Album, Fiche) */}
          <div className="flex items-center gap-1.5 mt-1 overflow-x-auto no-scrollbar">
            {currentTrack.beatmakerName && (
              <button
                type="button"
                onClick={() =>
                  onOpenEntityProfile?.(currentTrack.beatmakerName!, 'BEATMAKER')
                }
                title={`Ouvrir le profil Beatmaker de ${currentTrack.beatmakerName}`}
                className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-[10px] font-mono font-semibold text-emerald-300 shrink-0 transition cursor-pointer"
              >
                Prod. {currentTrack.beatmakerName}
              </button>
            )}
            {currentTrack.labelName && (
              <button
                type="button"
                onClick={() =>
                  onOpenEntityProfile?.(currentTrack.labelName, 'LABEL')
                }
                title={`Ouvrir le profil Label de ${currentTrack.labelName}`}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[10px] font-mono text-[#A3A9BA] hover:text-[#F8FAFC] shrink-0 transition cursor-pointer truncate max-w-[140px]"
              >
                {currentTrack.labelName}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTrackSheet}
              title="Ouvrir tous les paramètres, crédits et royalties du titre"
              className="px-2 py-0.5 rounded-md bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-[10px] font-mono font-bold text-amber-300 shrink-0 transition cursor-pointer"
            >
              Crédits &amp; Split →
            </button>
          </div>
        </div>

        {/* Actions Sociales : Beat (si applicable) + Partager/Recommander + Like */}
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          {(currentTrack.isInstrumental ||
            currentTrack.category === 'Beats & Instrumentales') && (
            <motion.button
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.94 }}
              transition={SPRING_SNAPPY}
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
                  'bg-amber-400'
                );
              }}
              className="h-9 px-2.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 flex items-center gap-1"
              title="Télécharger cette instrumentale / Beat (WAV Studio)"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="text-[11px] font-extrabold tracking-tight">Beat</span>
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING_SNAPPY}
            onClick={onOpenRecommendModal}
            className={`h-9 px-2.5 sm:px-3 rounded-full border flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
              isCurrentRecommended
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                : 'bg-[#0C0F17]/90 hover:bg-[#131824] border-white/[0.1] text-[#F8FAFC]'
            }`}
            aria-label="Partager ou recommander ce titre"
            title="Partager en vidéo Trend 30s ou recommander dans le Fil DROP"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 stroke-[2.1]" />
            <span className="text-xs font-mono font-bold">
              {formatCompactPlays(currentRecsCount)}
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING_SNAPPY}
            onClick={(e) => {
              setHeartAnimKey((prev) => prev + 1);
              onToggleLike(e);
              onToast(
                !isCurrentLiked ? 'Ajouté aux titres aimés' : 'Retiré des titres aimés',
                !isCurrentLiked ? 'bg-rose-500' : 'bg-zinc-400'
              );
            }}
            className="w-9 h-9 rounded-full bg-[#0C0F17]/90 hover:bg-[#131824] border border-white/[0.1] flex items-center justify-center relative shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              key={heartAnimKey}
              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-all ${
                heartAnimKey > 0 ? 'heart-animate' : ''
              } ${
                isCurrentLiked
                  ? 'text-[#DE1B34] fill-[#DE1B34] drop-shadow-[0_0_10px_rgba(222,27,52,0.5)]'
                  : 'text-[#CBD5E1] stroke-[2]'
              }`}
            />
          </motion.button>
        </div>
      </div>

      {/* 2. Ligne Classement, Bouton Tactile [CUE DROP] & Lectures Certifiées */}
      <div className="flex items-center justify-between mt-1.5 text-[12px] tabular-nums gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-[#F8FAFC] tracking-tight inline-flex items-center gap-1 shrink-0">
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

          {/* Bouton CUE DROP : Saut instantané vers le refrain / Drop ambré */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_SNAPPY}
            onClick={() => {
              onSeek(currentTrack.dropStart);
              onToast(`Saut direct au Drop (${formatTime(currentTrack.dropStart)})`, 'bg-amber-400');
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 border shrink-0 cursor-pointer ${
              isDropMode || isInsideDropZone
                ? 'bg-amber-400 text-[#080A0F] border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                : 'bg-amber-400/12 hover:bg-amber-400/22 border-amber-400/35 text-amber-300'
            }`}
            title="Aller directement au segment Drop de ce titre"
          >
            <Flame className="w-2.5 h-2.5 fill-current shrink-0" />
            <span>DROP {formatTime(currentTrack.dropStart)}</span>
          </motion.button>
        </div>

        <div className="flex items-center gap-1.5 text-[#A3A9BA] shrink-0">
          <Play className="w-3 h-3 text-[#F8FAFC] fill-current" />
          <span className="font-bold text-[#F8FAFC] font-mono text-xs">
            {formatCompactPlays(currentTrack.realPlays, currentTrack.displayPlaysFormatted)}
          </span>
        </div>
      </div>

      {/* 3. Barre de Progression Interactive avec Segment Drop Ambré */}
      <div className="mt-1.5 sm:mt-2">
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
                isDropMode || isInsideDropZone
                  ? 'bg-amber-400/70 ring-1 ring-amber-300/90 shadow-[0_0_16px_rgba(251,191,36,0.85)]'
                  : 'bg-amber-400/40 border-x border-amber-300/75'
              }`}
            />

            {/* Remplissage de progression */}
            <div className="scrubber-fill" style={{ width: `${progressPct}%` }}>
              <div className="scrubber-thumb" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11.5px] font-mono text-[#A3A9BA] mt-0.5 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>
    </section>
  );
};
