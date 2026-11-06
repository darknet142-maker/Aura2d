import React from 'react';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Headphones,
  Heart,
  Layers,
  Mic2,
  Play,
  Repeat,
  Sliders,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { CertificationBadgeSvg } from '../../../components/ReusableAnalyticsSheets';
import { ArtistRoyaltyAndTipCard } from '../../royalties/ArtistRoyaltyAndTipCard';
import { getAlbumCertification, getTrackCertification } from '../../../utils/rankingEngine';
import type { RoyaltyLedger } from '../../royalties/royaltyLedger';
import type { RoyaltySettings } from '../../economics/economicConfig';
import type { AlbumNode, AppUser, Track, UserTrackStat } from '../../../shared/types/domain.types';
import { RankBadge } from '../../../shared/ui/RankBadge';
import {
  formatCompactCount,
  formatLongDuration,
  formatTime,
} from '../../../shared/utils/mediaFormatters';
import type { EditingTrackState } from '../backoffice.types';

export interface SelectedTrackDetailData {
  album: AlbumNode;
  albumIndex: number;
  trackIndex: number;
  track: Track;
  rankInfo: { rank: number; delta: number };
}

export interface StudioTeamMemberSummary {
  name: string;
  role: 'LABEL' | 'BEATMAKER' | 'ENGINEER' | 'LYRICIST';
  tracksCount: number;
  plays: number;
  loops: number;
}

export interface SelectedArtistAnalyticsData {
  artistName: string;
  primaryCategory: string;
  cover?: string;
  artworkType: Track['artworkType'];
  tracks: Track[];
  totalPlays: number;
  totalLoops: number;
  totalLikes: number;
  totalListenSeconds: number;
  avgRetention: number;
  studioTeam: {
    labels: StudioTeamMemberSummary[];
    beatmakers: StudioTeamMemberSummary[];
    engineers: StudioTeamMemberSummary[];
    lyricists: StudioTeamMemberSummary[];
  };
  topListeners: {
    user: AppUser;
    listenSeconds: number;
    playsCount: number;
    loopsCount: number;
  }[];
}

export interface ConsumerAnalyticsData {
  byListenTime: { stat: UserTrackStat; track: Track }[];
  topLoopedItem: { stat: UserTrackStat; track: Track } | null;
  favoriteGenres: { category: string; seconds: number; plays: number; loops: number }[];
}

interface AdminTrackDrilldownProps {
  selectedTrackDetail: SelectedTrackDetailData;
  onClose: () => void;
  onSelectArtist: (artistName: string) => void;
  onPlayTrackInPlayer: (detail: SelectedTrackDetailData) => void;
  onEditTrack: (editing: EditingTrackState) => void;
  onDeleteTrack: (albumId: string, trackId: string) => void;
}

export const AdminTrackDrilldownView: React.FC<AdminTrackDrilldownProps> = ({
  selectedTrackDetail,
  onClose,
  onSelectArtist,
  onPlayTrackInPlayer,
  onEditTrack,
  onDeleteTrack,
}) => {
  return (
    <div className="w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 gap-4">
      <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <CertificationBadgeSvg
            cert={getTrackCertification(selectedTrackDetail.track.realPlays)}
          />
          <RankBadge
            rank={selectedTrackDetail.rankInfo.rank}
            delta={selectedTrackDetail.rankInfo.delta}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
              <CoverArtwork
                artworkType={selectedTrackDetail.track.artworkType}
                coverUrl={selectedTrackDetail.track.cover}
                title={selectedTrackDetail.track.title}
                artist={selectedTrackDetail.track.artist}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded bg-[#DE1B34]/15 text-[#DE1B34] text-[10px] font-mono">
                {selectedTrackDetail.track.category}
              </span>
              <h2 className="text-base font-bold text-[#F5F2EB] truncate mt-1">
                {selectedTrackDetail.track.title}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => onSelectArtist(selectedTrackDetail.track.artist)}
                  className="text-xs text-[#8E93A4] hover:text-white flex items-center gap-1 truncate cursor-pointer"
                >
                  <span className="truncate">{selectedTrackDetail.track.artist}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#DE1B34]" />
                </button>
                {selectedTrackDetail.track.featuringArtists &&
                  selectedTrackDetail.track.featuringArtists.map((feat) => (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => onSelectArtist(feat)}
                      className="px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-[10px] font-mono text-violet-300 hover:bg-violet-500/25 cursor-pointer"
                    >
                      feat. {feat}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => onPlayTrackInPlayer(selectedTrackDetail)}
              className="px-3.5 py-2 rounded-xl bg-[#DE1B34] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Lire</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onEditTrack({
                  albumId: selectedTrackDetail.album.id,
                  track: { ...selectedTrackDetail.track },
                  durationFormatted: formatTime(selectedTrackDetail.track.duration),
                  featuringInput: (selectedTrackDetail.track.featuringArtists || []).join(', '),
                })
              }
              className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[#F5F2EB] cursor-pointer"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                onDeleteTrack(selectedTrackDetail.album.id, selectedTrackDetail.track.id)
              }
              className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 cursor-pointer"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
            <Play className="w-4 h-4 fill-current text-[#DE1B34]" />
            <span className="font-mono text-sm font-bold text-[#F5F2EB]">
              {formatCompactCount(
                selectedTrackDetail.track.realPlays,
                selectedTrackDetail.track.displayPlaysFormatted
              )}
            </span>
          </div>
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
            <Repeat className="w-4 h-4 text-amber-300" />
            <span className="font-mono text-sm font-bold text-amber-300">
              {selectedTrackDetail.track.loopPlaysCount}
            </span>
          </div>
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
            <Heart className="w-4 h-4 fill-current text-rose-400" />
            <span className="font-mono text-sm font-bold text-rose-400">
              {selectedTrackDetail.track.likesCount} •{' '}
              {selectedTrackDetail.track.recommendationsCount} recos
            </span>
          </div>
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm font-bold text-emerald-400">
              30s: {selectedTrackDetail.track.retention30sPct}% / Fin:{' '}
              {selectedTrackDetail.track.avgRetentionPct}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Crédits Studio &amp; Plume
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#8E93A4]">
                <Building2 className="w-3.5 h-3.5 text-[#DE1B34]" />
                Label
              </span>
              <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                {selectedTrackDetail.track.labelName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#8E93A4]">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Beatmaker
              </span>
              <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                {selectedTrackDetail.track.beatmakerName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#8E93A4]">
                <Headphones className="w-3.5 h-3.5 text-amber-300" />
                Ingé Son
              </span>
              <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                {selectedTrackDetail.track.soundEngineerName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#8E93A4]">
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                Parolier (Plume)
              </span>
              <span className="font-semibold text-sky-300 truncate max-w-[160px]">
                {selectedTrackDetail.track.lyricistName}
              </span>
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Paramètres Audio &amp; Impact Texte
            </span>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8E93A4]">Durée totale</span>
              <span className="text-[#F5F2EB] font-bold">
                {formatTime(selectedTrackDetail.track.duration)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8E93A4]">Zone de Drop</span>
              <span className="text-[#F59E0B] font-bold">
                {formatTime(selectedTrackDetail.track.dropStart)} →{' '}
                {formatTime(
                  Math.min(
                    selectedTrackDetail.track.duration,
                    selectedTrackDetail.track.dropStart + selectedTrackDetail.track.dropDuration
                  )
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8E93A4]">Ouvertures / Partages Paroles</span>
              <span className="text-sky-300 font-bold">
                {selectedTrackDetail.track.lyricsOpensCount} vues •{' '}
                {selectedTrackDetail.track.lyricsSharesCount} extraits
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8E93A4]">Temps d'écoute cumulé</span>
              <span className="text-emerald-400 font-bold">
                {formatLongDuration(selectedTrackDetail.track.totalListenSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdminArtistDrilldownProps {
  selectedArtistAnalytics: SelectedArtistAnalyticsData;
  artistSubscribers: Record<string, number>;
  subscribedArtists: Record<string, boolean>;
  onToggleSubscribeArtist: (artistName: string) => void;
  royaltyLedger: RoyaltyLedger;
  royaltySettings: RoyaltySettings;
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
  onSelectConsumerUser: (userId: string) => void;
}

export const AdminArtistDrilldownView: React.FC<AdminArtistDrilldownProps> = ({
  selectedArtistAnalytics,
  artistSubscribers,
  subscribedArtists,
  onToggleSubscribeArtist,
  royaltyLedger,
  royaltySettings,
  trackRankMap,
  onClose,
  onSelectTrack,
  onSelectConsumerUser,
}) => {
  return (
    <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-hidden gap-4">
      <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <div className="flex items-center gap-2">
          <CertificationBadgeSvg
            cert={getAlbumCertification(selectedArtistAnalytics.totalPlays)}
          />
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#DE1B34]/15 text-[#DE1B34] border border-[#DE1B34]/30 truncate">
            {selectedArtistAnalytics.primaryCategory}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
        <div className="flex flex-wrap items-center justify-between gap-3.5 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden cover-card-bevel cover-gloss-sheen shrink-0">
              <CoverArtwork
                artworkType={selectedArtistAnalytics.artworkType}
                coverUrl={selectedArtistAnalytics.cover}
                title={selectedArtistAnalytics.artistName}
                artist={selectedArtistAnalytics.artistName}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                {selectedArtistAnalytics.artistName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8E93A4] mt-1">
                <span className="flex items-center gap-1 text-[#F5F2EB]">
                  <Play className="w-3 h-3 fill-current text-[#DE1B34]" />
                  {formatCompactCount(selectedArtistAnalytics.totalPlays)}
                </span>
                <span className="flex items-center gap-1 text-violet-300">
                  <Users className="w-3 h-3" />
                  {formatCompactCount(
                    artistSubscribers[selectedArtistAnalytics.artistName] ?? 1200
                  )}{' '}
                  fans
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Repeat className="w-3 h-3" />
                  {selectedArtistAnalytics.totalLoops}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Zap className="w-3 h-3" />
                  {selectedArtistAnalytics.avgRetention}%
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleSubscribeArtist(selectedArtistAnalytics.artistName)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border shrink-0 cursor-pointer ${
              subscribedArtists[selectedArtistAnalytics.artistName]
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#DE1B34] border-[#DE1B34] text-white'
            }`}
          >
            {subscribedArtists[selectedArtistAnalytics.artistName] ? (
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Abonné</span>
              </span>
            ) : (
              "+ S'abonner"
            )}
          </button>
        </div>

        <ArtistRoyaltyAndTipCard
          entityName={selectedArtistAnalytics.artistName}
          entityRole="ARTIST"
          rightsLines={royaltyLedger.rightsLines}
          statement={royaltyLedger.statements.find(
            (s) =>
              s.holderName.trim().toLowerCase() ===
              selectedArtistAnalytics.artistName.trim().toLowerCase()
          )}
          settings={royaltySettings}
        />

        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
            Discographie &amp; Featurings ({selectedArtistAnalytics.tracks.length})
          </span>
          {selectedArtistAnalytics.tracks.map((t) => {
            const rInfo = trackRankMap[t.id] || { rank: 1, delta: 0 };
            const cert = getTrackCertification(t.realPlays);
            return (
              <div
                key={t.id}
                onClick={() => onSelectTrack(t.id)}
                className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] hover:border-white/20 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden cover-card-bevel shrink-0">
                    <CoverArtwork
                      artworkType={t.artworkType}
                      coverUrl={t.cover}
                      title={t.title}
                      artist={t.artist}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#F5F2EB] truncate">{t.title}</span>
                      <CertificationBadgeSvg cert={cert} compact />
                    </div>
                    <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                      {t.artist}
                      {t.featuringArtists && t.featuringArtists.length > 0
                        ? ` feat. ${t.featuringArtists.join(', ')}`
                        : ''}{' '}
                      • {formatTime(t.duration)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <RankBadge rank={rInfo.rank} delta={rInfo.delta} />
                  <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Équipe Studio &amp; Plumes
            </span>
            {[
              ...selectedArtistAnalytics.studioTeam.labels,
              ...selectedArtistAnalytics.studioTeam.beatmakers,
              ...selectedArtistAnalytics.studioTeam.engineers,
              ...selectedArtistAnalytics.studioTeam.lyricists,
            ].map((member) => (
              <div
                key={`${member.role}-${member.name}`}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {member.role === 'LABEL' && (
                    <Building2 className="w-3.5 h-3.5 text-[#DE1B34] shrink-0" />
                  )}
                  {member.role === 'BEATMAKER' && (
                    <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  {member.role === 'ENGINEER' && (
                    <Mic2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  )}
                  {member.role === 'LYRICIST' && (
                    <Edit3 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                  <span className="font-semibold text-[#F5F2EB] truncate">{member.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#8E93A4] shrink-0">
                  {member.tracksCount} titre(s)
                </span>
              </div>
            ))}
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Top Auditeurs Fidèles
            </span>
            {selectedArtistAnalytics.topListeners.map((listener, idx) => (
              <div
                key={listener.user.id}
                onClick={() => onSelectConsumerUser(listener.user.id)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] hover:border-emerald-500/40 cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RankBadge rank={idx + 1} delta={0} />
                  <span className="font-semibold text-[#F5F2EB] truncate">
                    {listener.user.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8E93A4] shrink-0">
                  <span>{formatLongDuration(listener.listenSeconds)}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdminConsumerUserDrilldownProps {
  selectedConsumerUser: AppUser;
  consumerAnalytics: ConsumerAnalyticsData;
  users: AppUser[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
}

export const AdminConsumerUserDrilldownView: React.FC<AdminConsumerUserDrilldownProps> = ({
  selectedConsumerUser,
  consumerAnalytics,
  users,
  trackRankMap,
  onClose,
  onSelectTrack,
}) => {
  return (
    <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-hidden gap-4">
      <div className="w-full flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-[#F5F2EB] flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <RankBadge
          rank={
            [...users]
              .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
              .findIndex((u) => u.id === selectedConsumerUser.id) + 1
          }
          delta={0}
        />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
        <div className="flex items-center justify-between gap-3 bg-[#07080C] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center font-bold text-sm text-emerald-300 shrink-0">
              {selectedConsumerUser.avatar}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                {selectedConsumerUser.name}
              </h2>
              <div className="text-xs text-[#8E93A4] font-mono truncate">
                {selectedConsumerUser.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <span className="flex items-center gap-1 text-[#F5F2EB]">
              <Clock className="w-3.5 h-3.5 text-[#DE1B34]" />
              {formatLongDuration(selectedConsumerUser.totalListenSeconds)}
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Play className="w-3.5 h-3.5 fill-current" />
              {selectedConsumerUser.totalValidatedPlays}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              Titre le plus écouté en boucle
            </span>
            {consumerAnalytics.topLoopedItem ? (
              <div
                onClick={() => onSelectTrack(consumerAnalytics.topLoopedItem!.track.id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden cover-card-bevel shrink-0">
                  <CoverArtwork
                    artworkType={consumerAnalytics.topLoopedItem.track.artworkType}
                    coverUrl={consumerAnalytics.topLoopedItem.track.cover}
                    title={consumerAnalytics.topLoopedItem.track.title}
                    artist={consumerAnalytics.topLoopedItem.track.artist}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#F5F2EB] truncate">
                    {consumerAnalytics.topLoopedItem.track.title}
                  </div>
                  <div className="text-[11px] text-[#8E93A4] truncate">
                    {consumerAnalytics.topLoopedItem.track.artist}
                  </div>
                  <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                    {consumerAnalytics.topLoopedItem.stat.loopsCount}x boucles (Max:{' '}
                    {consumerAnalytics.topLoopedItem.stat.maxConsecutiveLoops}x)
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#8E93A4]">Aucune boucle.</div>
            )}
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#DE1B34] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Genres favoris
            </span>
            {consumerAnalytics.favoriteGenres.map((g, i) => (
              <div
                key={g.category}
                className="flex items-center justify-between text-xs font-mono"
              >
                <span className="text-[#F5F2EB] truncate">
                  #{i + 1} {g.category}
                </span>
                <span className="text-[#8E93A4]">{formatLongDuration(g.seconds)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E93A4]">
            Historique par titre
          </span>
          {consumerAnalytics.byListenTime.map(({ stat, track }) => {
            const rInfo = trackRankMap[track.id] || { rank: 1, delta: 0 };
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.05] hover:border-white/20 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg overflow-hidden cover-card-bevel shrink-0">
                    <CoverArtwork
                      artworkType={track.artworkType}
                      coverUrl={track.cover}
                      title={track.title}
                      artist={track.artist}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#F5F2EB] truncate">{track.title}</div>
                    <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                      {formatTime(stat.listenSeconds)} • {stat.loopsCount}x ↻
                    </div>
                  </div>
                </div>
                <RankBadge rank={rInfo.rank} delta={rInfo.delta} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
