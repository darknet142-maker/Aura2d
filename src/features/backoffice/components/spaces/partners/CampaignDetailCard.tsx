import React from 'react';
import { Target, Coins, Users, CheckCircle2, Pause, Play, BarChart2 } from 'lucide-react';
import type { SponsorCampaign } from '../../../../tokens';

export interface CampaignDetailCardProps {
  campaign: SponsorCampaign;
  onToggleStatus: (campaignId: string) => void;
  onAdjustBudget: (campaignId: string) => void;
}

export const CampaignDetailCard: React.FC<CampaignDetailCardProps> = ({
  campaign, onToggleStatus, onAdjustBudget,
}) => {
  const percent = campaign.totalBudgetTokens > 0
    ? Math.round((campaign.distributedTokens / campaign.totalBudgetTokens) * 100)
    : 0;
  const remaining = Math.max(0, campaign.totalBudgetTokens - campaign.distributedTokens);
  const completions = Math.round(campaign.distributedTokens / (campaign.rewardPerMission || 50));

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
              Fiche Détaillée Campagne : {campaign.title}
            </h3>
            <span className="text-[10px] font-mono text-[#A3A9BA]">
              ID: {campaign.id} • Label : {campaign.targetArtistName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(campaign.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition ${
              campaign.status === 'ACTIVE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {campaign.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{campaign.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}</span>
          </button>
          <button
            type="button"
            onClick={() => onAdjustBudget(campaign.id)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-mono font-bold cursor-pointer transition"
          >
            Ajuster Budget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">Budget Alloué</span>
          <span className="text-base font-mono font-extrabold text-[#F8FAFC]">
            {campaign.totalBudgetTokens.toLocaleString('fr-FR')}
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA] block">JTN réservés</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">Jetons Distribués</span>
          <span className="text-base font-mono font-extrabold text-amber-400">
            {campaign.distributedTokens.toLocaleString('fr-FR')}
          </span>
          <span className="text-[9.5px] font-mono text-emerald-400 block">{percent}% consommé</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">Réserve Restante</span>
          <span className="text-base font-mono font-extrabold text-emerald-300">
            {remaining.toLocaleString('fr-FR')}
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA] block">JTN disponibles</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono text-[#A3A9BA] uppercase block">Missions Réalisées</span>
          <span className="text-base font-mono font-extrabold text-[#F8FAFC]">
            {completions.toLocaleString('fr-FR')}
          </span>
          <span className="text-[9.5px] font-mono text-cyan-400 block">Auditeurs uniques</span>
        </div>
      </div>

      <div className="space-y-1.5 bg-[#07090E] p-3 rounded-xl border border-white/[0.05]">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#A3A9BA]">Progression de la distribution</span>
          <span className="text-white font-bold">{percent}%</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div style={{ width: `${percent}%` }} className="bg-amber-400 h-full rounded-full transition-all duration-300" />
        </div>
      </div>
    </div>
  );
};
