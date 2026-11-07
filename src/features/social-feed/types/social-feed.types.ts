import type { ArtworkType } from '../../../components/CoverArtwork';

export type PostArchetype = 'TRACK_VINYL' | 'SPOTLIGHT_VISUAL' | 'VIDEO_OPINION' | 'LYRIC_EXCERPT';
export type StudioAudioCaptureMode = 'DROP_MUSIC_30S' | 'VOICE_OPINION_NO_MUSIC';
export type SocialTargetKind = 'TRACK' | 'ALBUM' | 'ARTIST';
export type FeedLensId = 'FOR_YOU_VIRAL' | 'TRENDING_REDROPS' | 'VIDEO_OPINIONS' | 'RANDOM_DISCOVERY';
export type ViralCohortTier = 1 | 2 | 3;

export interface SocialTargetSubject {
  kind: SocialTargetKind;
  trackId?: string;
  albumId?: string;
  entityName: string;
  title: string;
  subtitle: string;
  genre: string;
  cover: string;
  artworkType?: ArtworkType;
  bpm?: number;
  camelotKey?: string;
  lyricistName?: string;
}

export interface FeedCommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  body: string;
  createdAtLabel: string;
  awardedPoint: boolean;
}

export interface ReDropRelayActor {
  userId: string;
  userName: string;
  userAvatar: string;
  quote?: string;
  relayedAtIso: string;
}

export interface SocialFeedPost {
  id: string;
  archetype: PostArchetype;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  caption: string;
  createdAtIso: string;
  createdAtLabel: string;
  lastBoostedAtIso: string;
  target: SocialTargetSubject;
  captureMode?: StudioAudioCaptureMode;
  videoIdbKey?: string;
  videoDurationSec?: number;
  likedByUserIds: string[];
  reDroppedByUserIds: string[];
  reDropRelays: ReDropRelayActor[];
  comments: FeedCommentItem[];
  discoveriesCount: number;
  discovererUserIds: string[];
  discovererInitials: string[];
  totalPointsGenerated: number;
  isRandomDiscoverySlot?: boolean;
}

export interface UserStatusStory {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  captureMode: StudioAudioCaptureMode;
  videoIdbKey?: string;
  caption: string;
  durationSec: number;
  target: SocialTargetSubject;
  createdAtIso: string;
  expiresAtIso: string;
  seenByUserIds: string[];
  likedByUserIds: string[];
  reDroppedByUserIds: string[];
}

export interface StudioLaunchConfig {
  captureMode: StudioAudioCaptureMode;
  targetSubject?: SocialTargetSubject;
}
