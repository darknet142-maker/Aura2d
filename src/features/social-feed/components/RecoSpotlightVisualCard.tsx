import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic, Music2, Repeat2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { formatCompactPlays } from '../../../components/player/playerEngineHelpers';
import { SUBTLE_ENTRANCE_VARIANTS, SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { SocialFeedPost, StudioAudioCaptureMode } from '../types/social-feed.types';
import { loadSocialVideoBlob } from '../services/status-video-storage.service';
import { RecoCardHeaderAndRelay } from './RecoCardHeaderAndRelay';
import { RecoCardActionBar } from './RecoCardActionBar';

export interface RecoSpotlightVisualCardProps {
  post: SocialFeedPost;
  currentUserId: string;
  trackPlays?: number;
  onPlayTarget: () => void;
  onPauseMainPlayer: () => void;
  onOpenAuthorProfile: (userId: string) => void;
  onOpenTargetSheet: () => void;
  onOpenArtistProfile: () => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onToggleReDrop: (quote?: string) => void;
  onOpenStudioReaction: (mode: StudioAudioCaptureMode) => void;
  onSharePost: () => void;
}

export const RecoSpotlightVisualCard: React.FC<RecoSpotlightVisualCardProps> = ({
  post, currentUserId, trackPlays = 104_500, onPlayTarget, onPauseMainPlayer,
  onOpenAuthorProfile, onOpenTargetSheet, onOpenArtistProfile,
  onToggleLike, onOpenComments, onToggleReDrop, onOpenStudioReaction, onSharePost,
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    if (post.videoIdbKey) {
      loadSocialVideoBlob(post.videoIdbKey).then((blob) => {
        if (blob) { revoked = URL.createObjectURL(blob); setVideoUrl(revoked); }
      });
    }
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, [post.videoIdbKey]);

  const isVideoPost = post.archetype === 'VIDEO_OPINION';
  const isVoiceOnly = post.captureMode === 'VOICE_OPINION_NO_MUSIC';
  const isReDropped = post.reDroppedByUserIds.includes(currentUserId);
  const firstAuthorName = post.authorName.split(' ')[0];

  const handleToggleEmbeddedVideo = () => {
    const vid = videoRef.current;
    if (!vid) { onPlayTarget(); return; }
    if (vid.paused) { onPauseMainPlayer(); vid.play().then(() => setIsVideoPlaying(true)).catch(() => {}); }
    else { vid.pause(); setIsVideoPlaying(false); }
  };

  return (
    <motion.article
      variants={SUBTLE_ENTRANCE_VARIANTS} initial="hidden" animate="visible"
      className="rounded-3xl bg-[#0D1017] border border-white/10 p-3.5 sm:p-4 space-y-3 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]"
    >
      <RecoCardHeaderAndRelay post={post} onOpenAuthorProfile={onOpenAuthorProfile} onOpenTargetSheet={onOpenTargetSheet} onOpenArtistProfile={onOpenArtistProfile} />

      <div className="relative w-full aspect-[4/4.3] max-h-[380px] rounded-2xl overflow-hidden bg-[#131722] border border-white/10">
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} loop playsInline muted={isMuted} onClick={handleToggleEmbeddedVideo} className="w-full h-full object-cover cursor-pointer" />
        ) : (
          <div onClick={onOpenTargetSheet} className="w-full h-full cursor-pointer">
            <CoverArtwork artworkType={post.target.artworkType} coverUrl={post.target.cover} title={post.target.title} artist={post.target.entityName} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/95 via-[#07090E]/20 to-[#07090E]/45 pointer-events-none" />

        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
          {isVideoPost ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#07090E]/80 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-[#F8FAFC]">
              {isVoiceOnly ? <Mic className="w-3 h-3 text-amber-400" /> : <Music2 className="w-3 h-3 text-emerald-400" />}
              <span>{isVoiceOnly ? `Avis Micro • ${post.videoDurationSec || 30}s` : `Drop Vidéo • ${post.videoDurationSec || 30}s`}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-[#07090E]/80 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-amber-300">
              {post.target.kind === 'ARTIST' ? 'Spotlight Artiste' : post.target.kind === 'ALBUM' ? 'Spotlight Projet' : 'Spotlight Titre'}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {videoUrl && (
              <button type="button" onClick={() => setIsMuted((m) => !m)} aria-label={isMuted ? 'Activer le son' : 'Couper le son'} className="w-8 h-8 rounded-full bg-[#07090E]/80 border border-white/15 text-[#F8FAFC] flex items-center justify-center cursor-pointer">
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <span className="px-2.5 py-1 rounded-full bg-[#07090E]/80 backdrop-blur-md border border-emerald-500/30 font-mono text-[11px] font-bold text-emerald-300 tabular-nums">
              {formatCompactPlays(trackPlays)} ECG
            </span>
          </div>
        </div>

        <div className="absolute bottom-3 inset-x-3 z-10 space-y-2.5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <button type="button" onClick={onOpenTargetSheet} className="text-base sm:text-lg font-extrabold text-[#F8FAFC] hover:text-amber-300 truncate block max-w-full text-left leading-tight cursor-pointer">{post.target.title}</button>
              <button type="button" onClick={onOpenArtistProfile} className="text-xs text-[#A3A9BA] hover:text-[#F8FAFC] truncate block max-w-full text-left cursor-pointer">{post.target.subtitle} • {post.target.genre}</button>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <motion.button type="button" whileTap={{ scale: 0.94 }} transition={SPRING_SNAPPY} onClick={videoUrl ? handleToggleEmbeddedVideo : onPlayTarget} aria-label="Lire" className="w-11 h-11 rounded-full bg-[#DE1B34] hover:bg-[#f02842] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(222,27,52,0.5)] cursor-pointer">
                {videoUrl && isVideoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </motion.button>
              <motion.button
                type="button" whileTap={{ scale: 0.95 }} transition={SPRING_SNAPPY} onClick={() => onToggleReDrop()}
                className={`px-3.5 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer ${
                  isReDropped ? 'bg-emerald-500 text-[#080A0F] border-emerald-400 shadow-[0_6px_20px_rgba(16,185,129,0.4)]' : 'bg-[#131722]/95 hover:bg-emerald-500 hover:text-[#080A0F] text-[#F8FAFC] border-emerald-500/45'
                }`}
              >
                {isReDropped ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Repeat2 className="w-3.5 h-3.5 shrink-0" />}<span>Re-Drop</span>
              </motion.button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {post.discovererInitials.length > 0 && (
              <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
                {post.discovererInitials.slice(0, 3).map((ini, idx) => (
                  <span key={idx} className="w-5 h-5 rounded-full bg-[#131722] border border-emerald-400/50 text-[9px] font-bold text-[#F8FAFC] flex items-center justify-center">{ini}</span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-[#A3A9BA] truncate tabular-nums">
              {post.discoveriesCount > 0
                ? `${post.discoveriesCount} personne${post.discoveriesCount > 1 ? 's ont' : ' a'} découvert ce son grâce à ${firstAuthorName}`
                : `Soyez le premier à découvrir cette sélection de ${firstAuthorName}`}
            </p>
          </div>
        </div>
      </div>

      <RecoCardActionBar post={post} currentUserId={currentUserId} onToggleLike={onToggleLike} onOpenComments={onOpenComments} onToggleReDrop={onToggleReDrop} onOpenStudioReaction={onOpenStudioReaction} onSharePost={onSharePost} />
    </motion.article>
  );
};
