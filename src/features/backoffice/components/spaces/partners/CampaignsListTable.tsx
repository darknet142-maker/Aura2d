import React, { useState, useMemo } from 'react';
import { Layers, Plus, Search, LayoutGrid, List, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../../shared/ui/springMotion';
import type { SponsorCampaign } from '../../../../tokens';

export interface CampaignsListTableProps {
  campaigns: SponsorCampaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaign: SponsorCampaign) => void;
  onCreateCampaign: () => void;
}

type CampaignSortKey = 'BUDGET' | 'TITLE' | 'DATE';
type CampaignViewMode = 'TABLE' | 'GRID';

export const CampaignsListTable: React.FC<CampaignsListTableProps> = ({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  onCreateCampaign,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'HIGH_BUDGET'>('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<CampaignSortKey>('BUDGET');
  const [viewMode, setViewMode] = useState<CampaignViewMode>('TABLE');

  const filterCounts = useMemo(() => {
    return {
      ALL: campaigns.length,
      ACTIVE: campaigns.filter((c) => c.status === 'ACTIVE').length,
      PAUSED: campaigns.filter((c) => c.status === 'PAUSED').length,
      HIGH_BUDGET: campaigns.filter((c) => (c.totalBudgetTokens || 0) >= 10000).length,
    };
  }, [campaigns]);

  const filtered = useMemo(() => {
    let list = campaigns.filter((c) => {
      if (filterStatus === 'ACTIVE' && c.status !== 'ACTIVE') return false;
      if (filterStatus === 'PAUSED' && c.status !== 'PAUSED') return false;
      if (filterStatus === 'HIGH_BUDGET' && (c.totalBudgetTokens || 0) < 10000) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || (c.targetArtistName || '').toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      }
      return true;
    });

    if (sortKey === 'BUDGET') {
      list.sort((a, b) => (b.totalBudgetTokens || 0) - (a.totalBudgetTokens || 0));
    } else if (sortKey === 'TITLE') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [campaigns, filterStatus, search, sortKey]);

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono text-xs">
      {/* Barre Universelle de Recherche, Tri et Vues (Conforme Capture) */}
      <div className="flex flex-col gap-3 w-full bg-[#07090E] p-3 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#F8FAFC] focus-within:border-[#DE1B34] transition">
            <Search className="w-4 h-4 text-[#A3A9BA] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre de campagne, artiste, sponsor..."
              className="w-full bg-transparent outline-none text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[#0D1017] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'TABLE' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
                title="Vue Tableau"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'GRID' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'}`}
                title="Vue Cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0D1017] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#A3A9BA]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as CampaignSortKey)}
                aria-label="Trier les campagnes"
                className="bg-transparent text-[#F8FAFC] outline-none text-xs cursor-pointer font-medium"
              >
                <option value="BUDGET" className="bg-[#0D1017] text-white">Budget (Décroissant)</option>
                <option value="TITLE" className="bg-[#0D1017] text-white">Titre (A-Z)</option>
              </select>
            </div>

            <motion.button
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              onClick={onCreateCampaign}
              className="px-3.5 py-2 rounded-xl bg-[#DE1B34] hover:bg-[#FF4D64] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#DE1B34]/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">+ Créer une Campagne</span>
            </motion.button>
          </div>
        </div>

        {/* Pilules de Filtrage avec Compteurs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.05]">
          {(
            [
              { id: 'ALL', label: 'Toutes', count: filterCounts.ALL },
              { id: 'ACTIVE', label: 'Actives', count: filterCounts.ACTIVE },
              { id: 'PAUSED', label: 'En Pause', count: filterCounts.PAUSED },
              { id: 'HIGH_BUDGET', label: 'Budgets Élevés (≥ 10k)', count: filterCounts.HIGH_BUDGET },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilterStatus(pill.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                filterStatus === pill.id
                  ? 'bg-[#DE1B34]/20 text-[#F8FAFC] border border-[#DE1B34]/40 shadow-sm'
                  : 'bg-[#0D1017] text-[#A3A9BA] hover:text-white border border-white/[0.06]'
              }`}
            >
              <span>{pill.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                filterStatus === pill.id ? 'bg-[#DE1B34] text-white' : 'bg-white/10 text-[#A3A9BA]'
              }`}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Liste des Campagnes (Grille ou Liste) */}
      <div className={viewMode === 'GRID' ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1' : 'space-y-2 max-h-80 overflow-y-auto pr-1'}>
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-[#A3A9BA] text-xs col-span-full">
            Aucune campagne ne correspond à vos filtres.
          </div>
        ) : (
          filtered.map((camp) => {
            const percent = camp.totalBudgetTokens > 0
              ? Math.round((camp.distributedTokens / camp.totalBudgetTokens) * 100)
              : 0;
            const isSelected = selectedCampaignId === camp.id;

            return (
              <div
                key={camp.id}
                onClick={() => onSelectCampaign(camp)}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 cursor-pointer transition ${
                  isSelected
                    ? 'bg-[#101522] border-white/25 shadow-sm'
                    : 'bg-[#07090E] border-white/[0.05] hover:border-white/15'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#F8FAFC] truncate">{camp.title}</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#A3A9BA] shrink-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          camp.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <span>{camp.status === 'ACTIVE' ? 'Actif' : 'En pause'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A3A9BA] mt-0.5 truncate">
                    Artiste : <span className="text-[#F8FAFC]">{camp.targetArtistName}</span> • Mission : {camp.missionType}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.05] pt-2 text-[11px]">
                  <span className="text-amber-300 font-bold">+{camp.rewardPerMission} JTN / écoute</span>
                  <div className="text-right text-[11px] shrink-0">
                    <span className="text-[#F8FAFC] font-extrabold tabular-nums">
                      {camp.distributedTokens.toLocaleString('fr-FR')} / {camp.totalBudgetTokens.toLocaleString('fr-FR')} JTN
                    </span>
                    <span className="text-[10px] text-[#A3A9BA] ml-1.5 tabular-nums">
                      ({percent}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
