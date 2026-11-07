import React, { useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { RankBadgeSvg } from '../../../components/ReusableAnalyticsSheets';
import { computeDeterministicWaveformPeaks } from '../../../services/musicService';
import { formatCompactPlays, formatTime } from '../../../components/player/playerEngineHelpers';
import { SUBTLE_ENTRANCE_VARIANTS } from '../../../shared/ui/springMotion';
import type { SocialFeedPost, StudioAudioCaptureMode } from '../types/social-feed.types';
import { RecoCardHeaderAndRelay } from './RecoCardHeaderAndRelay';
import { RecoCardActionBar } from './RecoCardActionBar';

export interface RecoTrackVinylCardProps {
  post: SocialFeedPost;
  currentUserId: string;
  trackPlays?: number;
  trackRank?: number;
  waveformPeaks?: number[];
  isInlinePlaying: boolean;
  inlineElapsedSec: number;
  inlineMaxSec: number;
  onToggleInlinePreview: () => void;
  onSeekInlinePreview: (ratio01: number) => void;
  onPlayFullTrack: () => void;
  onOpenAuthorProfile: (userId: string) => void;
  onOpenTrackSheet: () => void;
  onOpenArtistProfile: () => void;
  onOpenLyricistProfile?: (name: string) => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onToggleReDrop: (quote?: string) => void;
  onOpenStudioReaction: (mode: StudioAudioCaptureMode) => void;
  onDeletePost?: () => void;
}

export const RecoTrackVinylCard: React.FC<RecoTrackVinylCardProps> = ({
  post, currentUserId, trackPlays = 48_500, trackRank, waveformPeaks,
  isInlinePlaying, inlineElapsedSec, inlineMaxSec, onToggleInlinePreview, onSeekInlinePreview,
  onPlayFullTrack, onOpenAuthorProfile, onOpenTrackSheet, onOpenArtistProfile, onOpenLyricistProfile,
  onToggleLike, onOpenComments, onToggleReDrop, onOpenStudioReaction, onDeletePost,
}) => {
  const bars = useMemo(
    () => (waveformPeaks && waveformPeaks.length >= 24
      ? waveformPeaks.slice(0, 32)
      : computeDeterministicWaveformPeaks(post.target.title + post.target.entityName, 32)),
    [waveformPeaks, post.target.title, post.target.entityName]
  );
  const progressRatio = isInlinePlaying && inlineMaxSec > 0 ? Math.min(1, inlineElapsedSec / inlineMaxSec) : 0;

  return (
    <motion.article
      variants={SUBTLE_ENTRANCE_VARIANTS} initial="hidden" animate="visible"
      className="rounded-3xl bg-[#0D1017] border border-white/10 p-3.5 sm:p-4 space-y-3 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]"
    >
      <RecoCardHeaderAndRelay
        post={post} isOwnPost={post.authorId === currentUserId}
        onOpenAuthorProfile={onOpenAuthorProfile} onOpenTargetSheet={onOpenTrackSheet}
        onOpenArtistProfile={onOpenArtistProfile} onDeletePost={onDeletePost}
      />

      {post.archetype === 'LYRIC_EXCERPT' && post.target.lyricistName && (
        <button type="button" onClick={() => onOpenLyricistProfile?.(post.target.lyricistName!)} className="text-[11px] font-mono text-amber-300 hover:underline text-left block truncate cursor-pointer">
          Plume créditée : {post.target.lyricistName}
        </button>
      )}

      <div className="relative rounded-2xl bg-[#131722] border border-white/10 p-3 flex items-center gap-3.5 group/vinyl">
        <div className="relative w-[76px] sm:w-[84px] h-[76px] sm:h-[84px] shrink-0 mr-3">
          <div
            className={`absolute top-1 bottom-1 -right-4 w-[68px] sm:w-[76px] rounded-full transition-transform duration-200 ease-out pointer-events-none ${
              isInlinePlaying ? 'translate-x-2.5 animate-spin' : 'group-hover/vinyl:translate-x-2'
            }`}
            style={{ animationDuration: '6s' }} aria-hidden="true"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <circle cx="50" cy="50" r="49" fill="#090C13" stroke="#262C3D" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#1C2232" strokeWidth="1" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#1C2232" strokeWidth="1" />
              <circle cx="50" cy="50" r="16" fill="#DE1B34" />
              <circle cx="50" cy="50" r="4.5" fill="#090C13" />
            </svg>
          </div>
          <button type="button" onClick={onOpenTrackSheet} aria-label={`Ouvrir la fiche de ${post.target.title}`} className="relative z-10 w-full h-full rounded-xl overflow-hidden border border-white/15 shadow-lg block cursor-pointer">
            <CoverArtwork artworkType={post.target.artworkType} coverUrl={post.target.cover} title={post.target.title} artist={post.target.entityName} />
          </button>
          {trackRank && trackRank <= 25 && (
            <div className="absolute -top-2 -left-2 z-20 scale-90 origin-top-left pointer-events-none">
              <RankBadgeSvg rank={trackRank} delta={1} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="min-w-0">
            <button type="button" onClick={onOpenTrackSheet} className="text-sm font-extrabold text-[#F8FAFC] hover:text-amber-300 truncate block max-w-full text-left cursor-pointer">{post.target.title}</button>
            <button type="button" onClick={onOpenArtistProfile} className="text-xs text-[#A3A9BA] hover:text-[#F8FAFC] truncate block max-w-full text-left cursor-pointer">{post.target.subtitle}</button>
            <p className="text-[11px] text-[#A3A9BA]/85 truncate">
              {post.target.genre} • <span className="font-mono text-emerald-300 tabular-nums">{formatCompactPlays(trackPlays)} écoutes</span>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button type="button" onClick={onToggleInlinePreview} aria-label={isInlinePlaying ? 'Pause aperçu' : 'Aperçu 30s'} className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#DE1B34] text-[#F8FAFC] flex items-center justify-center shrink-0 transition cursor-pointer">
              {isInlinePlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>
            <div
              role="slider" tabIndex={0} aria-label="Aperçu du refrain 30s" aria-valuemin={0} aria-valuemax={inlineMaxSec} aria-valuenow={Math.round(inlineElapsedSec)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (!isInlinePlaying) onToggleInlinePreview();
                else onSeekInlinePreview((e.clientX - rect.left) / Math.max(1, rect.width));
              }}
              className="flex-1 min-w-0 h-6 flex items-center gap-[2px] cursor-pointer"
            >
              {bars.map((amp, idx) => {
                const active = isInlinePlaying ? (idx + 0.5) / bars.length <= progressRatio : idx < 12;
                return (
                  <span key={idx} className={`flex-1 rounded-full transition-colors duration-150 ${active ? (isInlinePlaying ? 'bg-[#DE1B34]' : 'bg-[#DE1B34]/65') : 'bg-white/18'}`} style={{ height: `${Math.max(22, Math.min(100, Math.round(amp * 100)))}%` }} />
                );
              })}
            </div>
            <span className="text-[10px] font-mono text-[#A3A9BA] tabular-nums shrink-0">
              {formatTime(isInlinePlaying ? inlineElapsedSec : 0)}/{formatTime(inlineMaxSec)}
            </span>
          </div>
        </div>
      </div>

      <RecoCardActionBar
        post={post} currentUserId={currentUserId} onPlayPrimary={onPlayFullTrack}
        onToggleLike={onToggleLike} onOpenComments={onOpenComments}
        onToggleReDrop={onToggleReDrop} onOpenStudioReaction={onOpenStudioReaction}
      />
    </motion.article>
  );
};
