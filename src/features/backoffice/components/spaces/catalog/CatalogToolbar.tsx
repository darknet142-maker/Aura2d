import React from 'react';
import { Search, LayoutGrid, List, Plus, Download, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../../shared/ui/springMotion';

export type CatalogFilterTab = 'ALL' | 'OUT_NOW' | 'PENDING' | 'IMMERSIVE' | 'BEATS' | 'DRAFTS';
export type CatalogViewMode = 'GRID' | 'TABLE';
export type CatalogSortKey = 'DATE' | 'TITLE' | 'ARTIST' | 'RANK';

export interface CatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: CatalogFilterTab;
  onFilterChange: (f: CatalogFilterTab) => void;
  viewMode: CatalogViewMode;
  onViewModeChange: (m: CatalogViewMode) => void;
  sortKey: CatalogSortKey;
  onSortChange: (s: CatalogSortKey) => void;
  totalCount: number;
  filteredCount: number;
  filterCounts?: Record<CatalogFilterTab, number>;
  onCreateRelease: () => void;
}

const FILTER_PILLS: { id: CatalogFilterTab; label: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'OUT_NOW', label: 'En ligne (Out Now)' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'IMMERSIVE', label: 'Immersif 3D' },
  { id: 'BEATS', label: 'Beats & Instus' },
  { id: 'DRAFTS', label: 'Brouillons' },
];

export const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
  searchQuery, onSearchChange, activeFilter, onFilterChange,
  viewMode, onViewModeChange, sortKey, onSortChange,
  totalCount, filteredCount, filterCounts, onCreateRelease,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full bg-[#0D1017] p-3 sm:p-4 rounded-2xl border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-[#07090E] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#F8FAFC] focus-within:border-[#DE1B34] transition">
          <Search className="w-4 h-4 text-[#A3A9BA] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par titre, artiste, ISRC ou code UPC..."
            className="w-full bg-transparent outline-none text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/60"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#07090E] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => onViewModeChange('GRID')}
              className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'GRID' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
              title="Vue Grille (Anthology)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('TABLE')}
              className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'TABLE' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
              title="Vue Tableau dense"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-[#07090E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#A3A9BA]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <select
              value={sortKey}
              onChange={(e) => onSortChange(e.target.value as CatalogSortKey)}
              aria-label="Trier le catalogue"
              className="bg-transparent text-[#F8FAFC] outline-none text-xs cursor-pointer font-medium"
            >
              <option value="DATE" className="bg-[#0D1017] text-white">Date (Récent)</option>
              <option value="TITLE" className="bg-[#0D1017] text-white">Titre (A-Z)</option>
              <option value="ARTIST" className="bg-[#0D1017] text-white">Artiste</option>
              <option value="RANK" className="bg-[#0D1017] text-white">Rang Algorithme</option>
            </select>
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            onClick={onCreateRelease}
            className="px-3.5 py-2 rounded-xl bg-[#DE1B34] hover:bg-[#FF4D64] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#DE1B34]/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">+ Créer une Release</span>
          </motion.button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.05]">
        {FILTER_PILLS.map((pill) => {
          const count = filterCounts ? filterCounts[pill.id] : pill.id === 'ALL' ? filteredCount : undefined;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onFilterChange(pill.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                activeFilter === pill.id
                  ? 'bg-[#DE1B34]/20 text-[#F8FAFC] border border-[#DE1B34]/40 shadow-sm'
                  : 'bg-[#07090E] text-[#A3A9BA] hover:text-white border border-white/[0.06]'
              }`}
            >
              <span>{pill.label}</span>
              {typeof count === 'number' && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeFilter === pill.id ? 'bg-[#DE1B34] text-white' : 'bg-white/10 text-[#A3A9BA]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
