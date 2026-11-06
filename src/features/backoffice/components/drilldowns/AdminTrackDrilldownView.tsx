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
                  className="text-xs text-[#A3A9BA] hover:text-white flex items-center gap-1 truncate cursor-pointer"
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
                      className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-[10px] font-mono text-sky-300 hover:bg-sky-500/25 cursor-pointer"
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
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3A9BA]">
              Crédits Studio &amp; Plume
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#A3A9BA]">
                <Building2 className="w-3.5 h-3.5 text-[#DE1B34]" />
                Label
              </span>
              <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                {selectedTrackDetail.track.labelName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#A3A9BA]">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Beatmaker
              </span>
              <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                {selectedTrackDetail.track.beatmakerName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#A3A9BA]">
                <Headphones className="w-3.5 h-3.5 text-amber-300" />
                Ingé Son
              </span>
              <span className="font-semibold text-[#F5F2EB] truncate max-w-[160px]">
                {selectedTrackDetail.track.soundEngineerName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#A3A9BA]">
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                Parolier (Plume)
              </span>
              <span className="font-semibold text-sky-300 truncate max-w-[160px]">
                {selectedTrackDetail.track.lyricistName}
              </span>
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3A9BA]">
              Paramètres Audio &amp; Impact Texte
            </span>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A3A9BA]">Durée totale</span>
              <span className="text-[#F5F2EB] font-bold">
                {formatTime(selectedTrackDetail.track.duration)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A3A9BA]">Zone de Drop</span>
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
              <span className="text-[#A3A9BA]">Ouvertures / Partages Paroles</span>
              <span className="text-sky-300 font-bold">
                {selectedTrackDetail.track.lyricsOpensCount} vues •{' '}
                {selectedTrackDetail.track.lyricsSharesCount} extraits
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A3A9BA]">Temps d'écoute cumulé</span>
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
