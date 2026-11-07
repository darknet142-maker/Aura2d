import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Mic, Music2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { formatCompactPlays } from '../../../components/player/playerEngineHelpers';
import { SUBTLE_ENTRANCE_VARIANTS } from '../../../shared/ui/springMotion';
import type { SocialFeedPost, StudioAudioCaptureMode } from '../types/social-feed.types';
import { loadSocialVideoBlob } from '../services/status-video-storage.service';
import { RecoCardHeaderAndRelay } from './RecoCardHeaderAndRelay';
import { RecoCardActionBar } from './RecoCardActionBar';
import { RecoCardReactionsCluster } from './RecoCardReactionsCluster';

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
  onOpenReactionsDetail?: (type: 'TROPHY' | 'FLAME' | 'HEART' | 'REDROP' | 'VIEWS') => void;
  onDeletePost?: () => void;
  onReportPost?: (postId: string) => void;
}

export const RecoSpotlightVisualCard: React.FC<RecoSpotlightVisualCardProps> = ({
  post, currentUserId, trackPlays = 104_500, onPlayTarget, onPauseMainPlayer,
  onOpenAuthorProfile, onOpenTargetSheet, onOpenArtistProfile,
  onToggleLike, onOpenComments, onToggleReDrop, onOpenStudioReaction, onOpenReactionsDetail, onDeletePost, onReportPost,
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
      <RecoCardHeaderAndRelay
        post={post} isOwnPost={post.authorId === currentUserId}
        onOpenAuthorProfile={onOpenAuthorProfile} onOpenTargetSheet={onOpenTargetSheet}
        onOpenArtistProfile={onOpenArtistProfile} onDeletePost={onDeletePost}
        onReportPost={onReportPost}
      />

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
              <span>{isVoiceOnly ? `Avis Micro • ${post.videoDurationSec || 30}s` : `Vidéo Musicale • ${post.videoDurationSec || 30}s`}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-[#07090E]/80 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-amber-300">
              {post.target.kind === 'ARTIST' ? 'Artiste recommandé' : post.target.kind === 'ALBUM' ? 'Projet recommandé' : 'Chanson recommandée'}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {videoUrl && (
              <button type="button" onClick={() => setIsMuted((m) => !m)} aria-label={isMuted ? 'Activer le son' : 'Couper le son'} className="w-8 h-8 rounded-full bg-[#07090E]/80 border border-white/15 text-[#F8FAFC] flex items-center justify-center cursor-pointer">
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <RecoCardReactionsCluster
              post={post}
              trackPlays={trackPlays}
              onReact={(type) => {
                if (onOpenReactionsDetail) onOpenReactionsDetail(type);
                else if (type === 'HEART') onToggleLike();
                else if (type === 'REDROP') onToggleReDrop();
              }}
            />
          </div>
        </div>

        <div className="absolute bottom-3 inset-x-3 z-10 space-y-2">
          <div className="min-w-0">
            <button type="button" onClick={onOpenTargetSheet} className="text-base sm:text-lg font-extrabold text-[#F8FAFC] hover:text-amber-300 truncate block max-w-full text-left leading-tight cursor-pointer">{post.target.title}</button>
            <button type="button" onClick={onOpenArtistProfile} className="text-xs text-[#A3A9BA] hover:text-[#F8FAFC] truncate block max-w-full text-left cursor-pointer">{post.target.subtitle} • {post.target.genre}</button>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
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

      <RecoCardActionBar
        post={post} currentUserId={currentUserId}
        isPrimaryPlaying={videoUrl ? isVideoPlaying : false}
        onPlayPrimary={videoUrl ? handleToggleEmbeddedVideo : onPlayTarget}
        onToggleLike={onToggleLike} onOpenComments={onOpenComments}
        onToggleReDrop={onToggleReDrop} onOpenStudioReaction={onOpenStudioReaction}
      />
    </motion.article>
  );
};
