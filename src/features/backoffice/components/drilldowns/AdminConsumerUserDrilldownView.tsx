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
              <div className="text-xs text-[#A3A9BA] font-mono truncate">
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
                  <div className="text-[11px] text-[#A3A9BA] truncate">
                    {consumerAnalytics.topLoopedItem.track.artist}
                  </div>
                  <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                    {consumerAnalytics.topLoopedItem.stat.loopsCount}x boucles (Max:{' '}
                    {consumerAnalytics.topLoopedItem.stat.maxConsecutiveLoops}x)
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#A3A9BA]">Aucune boucle.</div>
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
                <span className="text-[#A3A9BA]">{formatLongDuration(g.seconds)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A9BA]">
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
                    <div className="text-[11px] font-mono text-[#A3A9BA] truncate">
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
