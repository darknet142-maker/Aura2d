import React from 'react';
import { Flame, CheckCircle2, Filter, ChevronRight } from 'lucide-react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { CertificationBadgeSvg } from '../../../components/ReusableAnalyticsSheets';
import {
  getTrackCertification,
  type DropAwardCategoryResult,
} from '../../../utils/rankingEngine';
import type { Track } from '../../../shared/types/domain.types';
import { RankBadge } from '../../../shared/ui/RankBadge';

export type AlgoDimensionId =
  | 'GENERAL'
  | 'AWARDS'
  | 'ARTIST'
  | 'LABEL'
  | 'BEATMAKER'
  | 'ENGINEER'
  | 'LYRICIST'
  | 'CATEGORY';

export interface GroupedDimensionRankingItem {
  name: string;
  totalPoints: number;
  primaryMetricLabel?: string;
  deltaImpactFactor?: number;
  versatilityMultiplier?: number;
  maxSingleTrackSharePct?: number;
}

export interface AdminCatalogueAlgoProps {
  algoDimension: AlgoDimensionId;
  setAlgoDimension: React.Dispatch<React.SetStateAction<AlgoDimensionId>>;
  algoFilterValue: string;
  setAlgoFilterValue: React.Dispatch<React.SetStateAction<string>>;
  algoFilterOptions: string[];
  dropAwardsList: DropAwardCategoryResult[];
  groupedDimensionRankings: GroupedDimensionRankingItem[];
  rankedFilteredTracks: Track[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onSelectArtist: (artistName: string) => void;
  onSelectTrack: (trackId: string) => void;
  onSaveAndSyncAll: (sectionLabel?: string) => void;
}

export const AdminCatalogueAlgo: React.FC<AdminCatalogueAlgoProps> = ({
  algoDimension,
  setAlgoDimension,
  algoFilterValue,
  setAlgoFilterValue,
  algoFilterOptions,
  dropAwardsList,
  groupedDimensionRankings,
  rankedFilteredTracks,
  trackRankMap,
  onSelectArtist,
  onSelectTrack,
  onSaveAndSyncAll,
}) => {
  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col gap-2.5 pr-0.5">
      <div className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
          <span className="text-xs font-extrabold text-[#F5F2EB] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#DE1B34]" />
            Dimensions Algorithmiques &amp; Trophées DROP Awards (8 Axes)
          </span>
          <button
            type="button"
            onClick={() =>
              onSaveAndSyncAll(
                'Paramètres Algo, Classements & Cérémonie Awards'
              )
            }
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Sauvegarder Paramètres Algo &amp; Awards</span>
          </button>
        </div>

        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'GENERAL', label: 'Chansons (Explosion)' },
              { id: 'AWARDS', label: 'DROP Awards' },
              { id: 'ARTIST', label: 'Artistes (Communauté)' },
              { id: 'LABEL', label: 'Labels (Médiane)' },
              { id: 'BEATMAKER', label: 'Beatmakers (Accroche 30s)' },
              { id: 'ENGINEER', label: 'Ingés Son (Complétion)' },
              { id: 'LYRICIST', label: 'Paroliers (Texte & Longévité)' },
              { id: 'CATEGORY', label: 'Genres' },
            ] as const
          ).map((dim) => (
            <button
              key={dim.id}
              type="button"
              onClick={() => {
                setAlgoDimension(dim.id);
                setAlgoFilterValue('ALL');
              }}
              className={`min-h-[40px] py-2 px-2.5 rounded-xl text-[11px] font-semibold text-center leading-tight transition-all flex items-center justify-center border cursor-pointer ${
                algoDimension === dim.id
                  ? 'bg-[#DE1B34] border-[#DE1B34] text-white font-extrabold shadow-md shadow-[#DE1B34]/20'
                  : 'bg-[#07080C] border-white/[0.06] text-[#8E93A4] hover:text-white hover:border-white/20'
              }`}
            >
              {dim.label}
            </button>
          ))}
        </div>

        {algoDimension !== 'GENERAL' && algoDimension !== 'AWARDS' && (
          <div className="w-full flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#8E93A4] shrink-0" />
            <select
              value={algoFilterValue}
              onChange={(e) => setAlgoFilterValue(e.target.value)}
              className="flex-1 min-w-0 bg-[#07080C] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB] focus:outline-none"
            >
              <option value="ALL">
                Tout afficher ({algoFilterOptions.length})
              </option>
              {algoFilterOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {algoDimension === 'AWARDS' ? (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {dropAwardsList.map((award) => (
            <div
              key={award.id}
              className="p-3.5 rounded-xl bg-[#0D1017] border border-amber-500/25 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-300 truncate">
                  {award.title}
                </span>
                {award.winner.certification && (
                  <CertificationBadgeSvg
                    cert={award.winner.certification}
                    compact
                  />
                )}
              </div>
              <p className="text-[11px] text-[#8E93A4]">{award.subtitle}</p>
              <div className="p-2.5 rounded-xl bg-[#07080C] border border-white/[0.06] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F5F2EB] truncate">
                    1er • {award.winner.name}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 truncate">
                    {award.winner.secondaryName} • {award.winner.metricDetail}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
                  {award.winner.scoreLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {algoDimension !== 'GENERAL' && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groupedDimensionRankings.map((grp, idx) => (
                <div
                  key={grp.name}
                  onClick={() => {
                    if (algoDimension === 'ARTIST') {
                      onSelectArtist(grp.name);
                    } else {
                      setAlgoFilterValue(
                        algoFilterValue === grp.name ? 'ALL' : grp.name
                      );
                    }
                  }}
                  className="w-full flex flex-col gap-1.5 p-3 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-[#DE1B34]/40 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <RankBadge rank={idx + 1} delta={0} />
                      <span className="text-xs font-bold text-[#F5F2EB] truncate">
                        {grp.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 shrink-0">
                      <span>{grp.totalPoints.toFixed(1)} pts</span>
                      <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
                    </div>
                  </div>
                  {grp.primaryMetricLabel && (
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-[#8E93A4]">
                      <span className="truncate">{grp.primaryMetricLabel}</span>
                      <span>
                        Δx{grp.deltaImpactFactor?.toFixed(2)} • Poly x
                        {grp.versatilityMultiplier?.toFixed(2)} • Plafond{' '}
                        {grp.maxSingleTrackSharePct}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-2.5 flex flex-col gap-1.5">
            {rankedFilteredTracks.map((t, index) => {
              const globalRank = trackRankMap[t.id] || {
                rank: index + 1,
                delta: 0,
              };
              const displayRank =
                algoDimension === 'GENERAL' && algoFilterValue === 'ALL'
                  ? globalRank.rank
                  : index + 1;
              const cert = getTrackCertification(t.realPlays);
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTrack(t.id)}
                  className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#07080C] border border-white/[0.06] hover:border-[#DE1B34]/40 cursor-pointer transition-colors"
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
                        <span className="text-xs font-bold text-[#F5F2EB] truncate">
                          {t.title}
                        </span>
                        <CertificationBadgeSvg cert={cert} compact />
                      </div>
                      <div className="text-[11px] text-[#8E93A4] truncate">
                        {t.artist}
                        {t.featuringArtists && t.featuringArtists.length > 0
                          ? ` feat. ${t.featuringArtists.join(', ')}`
                          : ''}{' '}
                        • {t.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <RankBadge rank={displayRank} delta={globalRank.delta} />
                    <ChevronRight className="w-4 h-4 text-[#8E93A4]" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
