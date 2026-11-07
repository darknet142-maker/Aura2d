import React, { useMemo } from 'react';
import { Flame, Video, Shuffle, Plus, Sparkles } from 'lucide-react';
import type { AnalyticsAlbumNode, AnalyticsTrackItem, StudioEntityRole } from '../../../components/ReusableAnalyticsSheets';
import type { FeedLensId, SocialFeedPost, SocialTargetSubject, StudioAudioCaptureMode } from '../types/social-feed.types';
import { buildComposerOptionsFromCatalogue } from '../services/social-target-options.service';
import { useInlineDropPreviewAudio } from '../hooks/useInlineDropPreviewAudio';
import type { useSocialFeedController } from '../hooks/useSocialFeedController';
import { WhatsAppStyleStatusRail } from './WhatsAppStyleStatusRail';
import { RecoTrackVinylCard } from './RecoTrackVinylCard';
import { RecoSpotlightVisualCard } from './RecoSpotlightVisualCard';
import { RecoCommentsDrawer } from './RecoCommentsDrawer';
import { StatusFullscreenViewerModal } from './StatusFullscreenViewerModal';
import { PublishRecoAndStatusModal } from './PublishRecoAndStatusModal';

export interface SocialRecommendationsFeedViewProps {
  feedCtrl: ReturnType<typeof useSocialFeedController>;
  currentUser: { id: string; name: string; avatar: string };
  currentTrack: { id: string; title: string; artist: string; category: string; cover: string; artworkType?: AnalyticsTrackItem['artworkType']; bpm?: number };
  allTracksFlat: { track: AnalyticsTrackItem; album: AnalyticsAlbumNode; albumIndex: number; trackIndex: number }[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onPauseMainPlayer: () => void;
  onPlaySpecificTrack: (albumIdx: number, trackIdx: number) => void;
  onOpenTrackSheet: (trackId: string) => void;
  onOpenEntitySheet: (name: string, role?: StudioEntityRole) => void;
  onOpenUserProfile: (userId: string) => void;
  onOpenCameraStudio: (mode: StudioAudioCaptureMode, target: SocialTargetSubject) => void;
  onToast: (msg: string, dotColor?: string) => void;
}

const LENS_TABS: { id: FeedLensId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'FOR_YOU_VIRAL', label: 'Pour Vous', icon: Sparkles },
  { id: 'TRENDING_REDROPS', label: 'En Explosion', icon: Flame },
  { id: 'VIDEO_OPINIONS', label: 'Avis Vidéo 30s', icon: Video },
  { id: 'RANDOM_DISCOVERY', label: 'Découverte', icon: Shuffle },
];

export const SocialRecommendationsFeedView: React.FC<SocialRecommendationsFeedViewProps> = ({
  feedCtrl, currentUser, currentTrack, allTracksFlat, trackRankMap,
  onPauseMainPlayer, onPlaySpecificTrack, onOpenTrackSheet, onOpenEntitySheet, onOpenUserProfile, onOpenCameraStudio, onToast,
}) => {
  const inlineAudio = useInlineDropPreviewAudio(onPauseMainPlayer);
  const defaultTarget: SocialTargetSubject = useMemo(() => ({
    kind: 'TRACK', trackId: currentTrack.id, entityName: currentTrack.artist,
    title: currentTrack.title, subtitle: currentTrack.artist, genre: currentTrack.category,
    cover: currentTrack.cover, artworkType: currentTrack.artworkType, bpm: currentTrack.bpm,
  }), [currentTrack]);

  const { trackOpts, albumOpts, artistOpts } = useMemo(
    () => buildComposerOptionsFromCatalogue(allTracksFlat),
    [allTracksFlat]
  );

  const navigateToTarget = (target: SocialTargetSubject) => {
    if (target.kind === 'ARTIST' || !target.trackId) onOpenEntitySheet(target.entityName, 'ARTIST');
    else onOpenTrackSheet(target.trackId);
  };

  const playPostTarget = (post: SocialFeedPost) => {
    inlineAudio.stopInlinePreview();
    feedCtrl.handleRecordDiscovery(post.id);
    const match = allTracksFlat.find((m) => m.track.id === post.target.trackId || m.track.artist === post.target.entityName);
    if (match) onPlaySpecificTrack(match.albumIndex, match.trackIndex);
  };

  const sharePostLink = (post: SocialFeedPost) => {
    navigator.clipboard?.writeText(`${window.location.origin}/?track=${encodeURIComponent(post.target.trackId || post.target.entityName)}`).catch(() => {});
    onToast('Lien de la recommandation copié dans le presse-papiers !', 'bg-emerald-400');
  };

  const activeCommentsPost = feedCtrl.posts.find((p) => p.id === feedCtrl.activeCommentsPostId) ?? null;

  return (
    <div className="space-y-3.5 pb-4">
      <WhatsAppStyleStatusRail
        currentUserId={currentUser.id} currentUserName={currentUser.name} currentUserAvatar={currentUser.avatar}
        groupedRings={feedCtrl.groupedStatusRings}
        onOpenViewerForUser={(uId) => { inlineAudio.stopInlinePreview(); onPauseMainPlayer(); feedCtrl.setActiveStatusUserId(uId); }}
        onOpenStudioCapture={(mode) => { inlineAudio.stopInlinePreview(); onOpenCameraStudio(mode, defaultTarget); }}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {LENS_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id} type="button"
              onClick={() => { feedCtrl.setActiveLens(id); if (id === 'RANDOM_DISCOVERY') feedCtrl.shuffleDiscoveryFeed(); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                feedCtrl.activeLens === id ? 'bg-amber-400 text-[#080A0F]' : 'bg-[#0D1017] border border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" /><span>{label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => feedCtrl.setIsComposerOpen(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#DE1B34] hover:bg-[#f02842] text-white text-xs font-bold shrink-0 shadow-md cursor-pointer">
          <Plus className="w-3.5 h-3.5 shrink-0" /><span>Publier</span>
        </button>
      </div>

      {feedCtrl.rankedPosts.length === 0 ? (
        <div className="rounded-3xl bg-[#0D1017] border border-white/10 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-[#F8FAFC]">Aucune publication dans cette lentille</p>
          <button type="button" onClick={() => feedCtrl.setActiveLens('FOR_YOU_VIRAL')} className="px-4 py-2 rounded-xl bg-amber-400 text-[#080A0F] text-xs font-bold cursor-pointer">Revenir au Fil Pour Vous</button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {feedCtrl.rankedPosts.map((post) => {
            const t = allTracksFlat.find((m) => m.track.id === post.target.trackId)?.track;
            const common = {
              post, currentUserId: currentUser.id, trackPlays: t?.realPlays,
              onOpenAuthorProfile: onOpenUserProfile,
              onOpenArtistProfile: () => onOpenEntitySheet(post.target.entityName, 'ARTIST'),
              onToggleLike: () => feedCtrl.handleTogglePostLike(post.id),
              onOpenComments: () => feedCtrl.setActiveCommentsPostId(post.id),
              onToggleReDrop: (q?: string) => feedCtrl.handleTogglePostReDrop(post.id, q),
              onOpenStudioReaction: (mode: StudioAudioCaptureMode) => { inlineAudio.stopInlinePreview(); onOpenCameraStudio(mode, post.target); },
              onSharePost: () => sharePostLink(post),
            };
            return post.archetype === 'SPOTLIGHT_VISUAL' || post.archetype === 'VIDEO_OPINION' ? (
              <RecoSpotlightVisualCard key={post.id} {...common} onPlayTarget={() => playPostTarget(post)} onPauseMainPlayer={() => { inlineAudio.stopInlinePreview(); onPauseMainPlayer(); }} onOpenTargetSheet={() => navigateToTarget(post.target)} />
            ) : (
              <RecoTrackVinylCard
                key={post.id} {...common} trackRank={t ? trackRankMap[t.id]?.rank : undefined} waveformPeaks={t?.waveformPeaks}
                isInlinePlaying={inlineAudio.activePostId === post.id}
                inlineElapsedSec={inlineAudio.activePostId === post.id ? inlineAudio.elapsedSec : 0}
                inlineMaxSec={inlineAudio.activePostId === post.id ? inlineAudio.maxSec : Math.min(30, t?.dropDuration || 30)}
                onToggleInlinePreview={() => inlineAudio.toggleInlinePreview(post.id, { id: t?.id || post.id, audioUrl: t?.audioUrl, dropStart: t?.dropStart || 0, dropDuration: t?.dropDuration || 30, bpm: t?.bpm }, () => feedCtrl.handleRecordDiscovery(post.id))}
                onSeekInlinePreview={(r) => inlineAudio.seekInlinePreview(post.id, r)}
                onPlayFullTrack={() => playPostTarget(post)} onOpenTrackSheet={() => navigateToTarget(post.target)}
                onOpenLyricistProfile={(name) => onOpenEntitySheet(name, 'LYRICIST')}
              />
            );
          })}
        </div>
      )}

      <RecoCommentsDrawer post={activeCommentsPost} onClose={() => feedCtrl.setActiveCommentsPostId(null)} onSubmitComment={feedCtrl.handleAddComment} onOpenUserProfile={onOpenUserProfile} />
      <StatusFullscreenViewerModal activeUserId={feedCtrl.activeStatusUserId} currentUserId={currentUser.id} groupedRings={feedCtrl.groupedStatusRings} onClose={() => feedCtrl.setActiveStatusUserId(null)} onSelectUser={feedCtrl.setActiveStatusUserId} onMarkSeen={feedCtrl.handleMarkStatusSeen} onToggleLike={feedCtrl.handleToggleStatusLike} onToggleReDrop={feedCtrl.handleToggleStatusReDrop} onOpenTarget={navigateToTarget} onReplyWithVideo={onOpenCameraStudio} />
      <PublishRecoAndStatusModal isOpen={feedCtrl.isComposerOpen} defaultTrackTarget={defaultTarget} trackOptions={trackOpts} albumOptions={albumOpts} artistOptions={artistOpts} onClose={() => feedCtrl.setIsComposerOpen(false)} onPublishCard={feedCtrl.handleCreateFeedPost} onOpenCameraStudio={onOpenCameraStudio} />
    </div>
  );
};
