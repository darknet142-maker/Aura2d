import React from 'react';
import {
  Building2, Check, ChevronLeft, ChevronRight, Clock, Edit3, Headphones,
  Heart, Layers, Mic2, Play, Repeat, Sliders, Trash2, Users, Zap,
} from 'lucide-react';
import { CoverArtwork } from '../../../../components/CoverArtwork';
import { CertificationBadgeSvg } from '../../../../components/ReusableAnalyticsSheets';
import { ArtistRoyaltyAndTipCard } from '../../../royalties/ArtistRoyaltyAndTipCard';
import { getAlbumCertification, getTrackCertification } from '../../../../utils/rankingEngine';
import type { RoyaltyLedger } from '../../../royalties/royaltyLedger';
import type { RoyaltySettings } from '../../../economics/economicConfig';
import type { AppUser } from '../../../../shared/types/domain.types';
import { RankBadge } from '../../../../shared/ui/RankBadge';
import { formatCompactCount, formatLongDuration, formatTime } from '../../../../shared/utils/mediaFormatters';
import type { EditingTrackState } from '../../backoffice.types';
import type { SelectedTrackDetailData, SelectedArtistAnalyticsData, ConsumerAnalyticsData } from './drilldown.types';

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
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#A3A9BA] mt-1">
                <span className="flex items-center gap-1 text-[#F5F2EB]">
                  <Play className="w-3 h-3 fill-current text-[#DE1B34]" />
                  {formatCompactCount(selectedArtistAnalytics.totalPlays)}
                </span>
                <span className="flex items-center gap-1 text-sky-300">
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
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3A9BA]">
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
                    <div className="text-[11px] font-mono text-[#A3A9BA] truncate">
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
                  <ChevronRight className="w-4 h-4 text-[#A3A9BA]" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3A9BA]">
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
                <span className="text-[10px] font-mono text-[#A3A9BA] shrink-0">
                  {member.tracksCount} titre(s)
                </span>
              </div>
            ))}
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3A9BA]">
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
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#A3A9BA] shrink-0">
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
