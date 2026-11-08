import React, { useState } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import type { SponsorCampaign } from '../../../../tokens';

export interface CampaignsListTableProps {
  campaigns: SponsorCampaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaign: SponsorCampaign) => void;
  onCreateCampaign: () => void;
}

export const CampaignsListTable: React.FC<CampaignsListTableProps> = ({
  campaigns, selectedCampaignId, onSelectCampaign, onCreateCampaign,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || (c.targetArtistName || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
            Répertoire des Campagnes Sponsorisées ({filtered.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#07090E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#F8FAFC]">
            <Search className="w-3.5 h-3.5 text-[#A3A9BA]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer campagne..."
              className="bg-transparent outline-none text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/60 w-32"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#07090E] p-1 rounded-xl border border-white/10 text-[10.5px] font-mono">
            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-0.5 rounded-lg cursor-pointer transition ${
                  filterStatus === st ? 'bg-amber-400 text-[#080A0F] font-bold' : 'text-[#A3A9BA] hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Toutes' : st === 'ACTIVE' ? 'Actives' : 'En Pause'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onCreateCampaign}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#080A0F] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-400/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Campagne</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filtered.map((camp) => {
          const percent = camp.totalBudgetTokens > 0
            ? Math.round((camp.distributedTokens / camp.totalBudgetTokens) * 100)
            : 0;
          const isSelected = selectedCampaignId === camp.id;

          return (
            <div
              key={camp.id}
              onClick={() => onSelectCampaign(camp)}
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 cursor-pointer transition ${
                isSelected
                  ? 'bg-[#131722] border-amber-400/50 shadow-md'
                  : 'bg-[#07090E] border-white/[0.05] hover:border-white/20'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#F8FAFC] truncate">{camp.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                    camp.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                  }`}>
                    {camp.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#A3A9BA] mt-0.5">
                  Artiste : <span className="text-white font-medium">{camp.targetArtistName}</span> • Mission : {camp.missionType} • Récompense : <strong className="text-amber-300 font-mono">{camp.rewardPerMission} JTN</strong>
                </p>
              </div>

              <div className="text-right text-[11px] font-mono shrink-0">
                <div className="text-[#F8FAFC] font-extrabold">
                  {camp.distributedTokens.toLocaleString('fr-FR')} / {camp.totalBudgetTokens.toLocaleString('fr-FR')} JTN
                </div>
                <div className="text-[10px] text-amber-400">{percent}% distribué</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
