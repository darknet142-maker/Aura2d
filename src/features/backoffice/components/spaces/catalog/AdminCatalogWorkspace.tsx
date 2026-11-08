import React, { useState, useMemo } from 'react';
import { CatalogToolbar, type CatalogFilterTab, type CatalogViewMode, type CatalogSortKey } from './CatalogToolbar';
import { ReleaseCardGrid } from './ReleaseCardGrid';
import { ReleaseTableView } from './ReleaseTableView';
import { AdminCatalogueAlgo } from '../../AdminCatalogueAlgo';
import { CatalogueMusicAnalyticsPanel } from '../../../../music-intelligence';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';
import type { Track } from '../../../../../shared/types/domain.types';

export interface AdminCatalogWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
  onNavigateToSpace: (spaceId: any) => void;
}

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const AdminCatalogWorkspace: React.FC<AdminCatalogWorkspaceProps> = ({ ctrl, onNavigateToSpace }) => {
  const [subTab, setSubTab] = useState<'RELEASES' | 'ALGO' | 'INTEL'>('RELEASES');
  const [activeFilter, setActiveFilter] = useState<CatalogFilterTab>('ALL');
  const [viewMode, setViewMode] = useState<CatalogViewMode>('GRID');
  const [sortKey, setSortKey] = useState<CatalogSortKey>('DATE');

  const filteredTracks = useMemo(() => {
    let list = [...ctrl.allTracksFlat];

    if (ctrl.searchQuery.trim()) {
      const q = ctrl.searchQuery.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'OUT_NOW') {
      list = list.filter((t) => !t.isInstrumental);
    } else if (activeFilter === 'BEATS') {
      list = list.filter((t) => Boolean(t.isInstrumental));
    }

    if (sortKey === 'TITLE') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortKey === 'ARTIST') {
      list.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (sortKey === 'RANK') {
      list.sort((a, b) => (ctrl.trackRankMap[a.id]?.rank ?? 999) - (ctrl.trackRankMap[b.id]?.rank ?? 999));
    }

    return list;
  }, [ctrl.allTracksFlat, ctrl.searchQuery, activeFilter, sortKey, ctrl.trackRankMap]);

  const handleEditTrack = (track: Track) => {
    ctrl.setEditingTrack({
      albumId: track.album || 'default',
      track: { ...track },
      durationFormatted: formatDuration(track.duration || 0),
      featuringInput: (track.featuringArtists || []).join(', '),
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0D1017] border border-white/10 w-fit text-xs">
        <button
          type="button"
          onClick={() => setSubTab('RELEASES')}
          className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition ${subTab === 'RELEASES' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'}`}
        >
          Releases &amp; Catalogue ({ctrl.allTracksFlat.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('ALGO')}
          className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition ${subTab === 'ALGO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-[#A3A9BA] hover:text-white'}`}
        >
          Rangs Anti-Halo &amp; Awards
        </button>
        <button
          type="button"
          onClick={() => setSubTab('INTEL')}
          className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition ${subTab === 'INTEL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-[#A3A9BA] hover:text-white'}`}
        >
          Intelligence &amp; Benchmark
        </button>
      </div>

      {subTab === 'RELEASES' && (
        <div className="flex flex-col gap-4 w-full">
          <CatalogToolbar
            searchQuery={ctrl.searchQuery}
            onSearchChange={ctrl.setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortKey={sortKey}
            onSortChange={setSortKey}
            totalCount={ctrl.allTracksFlat.length}
            filteredCount={filteredTracks.length}
            onCreateRelease={() => onNavigateToSpace('02_STUDIO')}
          />

          {viewMode === 'GRID' ? (
            <ReleaseCardGrid
              tracks={filteredTracks}
              trackRankMap={ctrl.trackRankMap}
              onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)}
              onEditTrack={handleEditTrack}
              onResetFilters={() => {
                setActiveFilter('ALL');
                ctrl.setSearchQuery('');
              }}
            />
          ) : (
            <ReleaseTableView
              tracks={filteredTracks}
              trackRankMap={ctrl.trackRankMap}
              onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)}
              onEditTrack={handleEditTrack}
            />
          )}
        </div>
      )}

      {subTab === 'ALGO' && (
        <AdminCatalogueAlgo
          algoDimension={ctrl.algoDimension} setAlgoDimension={ctrl.setAlgoDimension}
          algoFilterValue={ctrl.algoFilterValue} setAlgoFilterValue={ctrl.setAlgoFilterValue}
          algoFilterOptions={ctrl.algoFilterOptions} dropAwardsList={ctrl.dropAwardsList}
          groupedDimensionRankings={ctrl.groupedDimensionRankings} rankedFilteredTracks={ctrl.rankedFilteredTracks}
          trackRankMap={ctrl.trackRankMap} onSelectArtist={(name: string) => ctrl.setSelectedArtistName(name)}
          onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)} onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
        />
      )}

      {subTab === 'INTEL' && (
        <CatalogueMusicAnalyticsPanel
          tracks={ctrl.allTracksFlat}
          onSelectTrack={(tid: string) => ctrl.setSelectedTrackId(tid)}
          onSelectArtist={(name: string) => ctrl.setSelectedArtistName(name)}
        />
      )}
    </div>
  );
};
