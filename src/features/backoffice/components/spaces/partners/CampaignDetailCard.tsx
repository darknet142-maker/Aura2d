import React, { useState } from 'react';
import { Target, Pause, Play, BarChart3, Users } from 'lucide-react';
import { CampaignParticipantsList } from './CampaignParticipantsList';
import type { SponsorCampaign } from '../../../../tokens';

export interface CampaignDetailCardProps {
  campaign: SponsorCampaign;
  onToggleStatus: (campaignId: string) => void;
  onAdjustBudget: (campaignId: string) => void;
}

export const CampaignDetailCard: React.FC<CampaignDetailCardProps> = ({
  campaign,
  onToggleStatus,
  onAdjustBudget,
}) => {
  const [viewTab, setViewTab] = useState<'METRICS' | 'AUDITORS'>('METRICS');
  const percent = campaign.totalBudgetTokens > 0
    ? Math.round((campaign.distributedTokens / campaign.totalBudgetTokens) * 100)
    : 0;
  const remaining = Math.max(0, campaign.totalBudgetTokens - campaign.distributedTokens);
  const completions = Math.round(campaign.distributedTokens / (campaign.rewardPerMission || 150));

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      {/* Header Fiche Campagne */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-bold text-[#F8FAFC]">
              Campagne : {campaign.title}
            </h3>
            <span className="text-[10px] text-[#A3A9BA]">
              ID: {campaign.id} • Label : {campaign.targetArtistName || 'Partenaire DROP'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(campaign.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
              campaign.status === 'ACTIVE'
                ? 'bg-white/5 hover:bg-white/10 text-[#A3A9BA] hover:text-white border border-white/10'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {campaign.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{campaign.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}</span>
          </button>

          <button
            type="button"
            onClick={() => onAdjustBudget(campaign.id)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#F8FAFC] text-xs font-semibold cursor-pointer transition"
          >
            Ajuster Budget
          </button>
        </div>
      </div>

      {/* Segmented Control Calme */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#07090E] border border-white/[0.06] w-fit text-xs">
        <button
          type="button"
          onClick={() => setViewTab('METRICS')}
          className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition ${
            viewTab === 'METRICS'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Indicateurs &amp; Budget</span>
        </button>
        <button
          type="button"
          onClick={() => setViewTab('AUDITORS')}
          className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition ${
            viewTab === 'AUDITORS'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Auditeurs Validés</span>
        </button>
      </div>

      {viewTab === 'METRICS' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.04]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Budget Total</span>
              <span className="text-base font-extrabold text-[#F8FAFC] tabular-nums">
                {campaign.totalBudgetTokens.toLocaleString('fr-FR')}
              </span>
              <span className="text-[9px] text-[#A3A9BA] block">JTN Alloués</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.04]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Distribué</span>
              <span className="text-base font-extrabold text-amber-400 tabular-nums">
                {campaign.distributedTokens.toLocaleString('fr-FR')}
              </span>
              <span className="text-[9px] text-[#A3A9BA] block">{percent}% consommés</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.04]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Solde Restant</span>
              <span className="text-base font-extrabold text-[#F8FAFC] tabular-nums">
                {remaining.toLocaleString('fr-FR')}
              </span>
              <span className="text-[9px] text-[#A3A9BA] block">JTN en réserve</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.04]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Missions Réussies</span>
              <span className="text-base font-extrabold text-emerald-400 tabular-nums">
                {completions}
              </span>
              <span className="text-[9px] text-[#A3A9BA] block">+{campaign.rewardPerMission || 150} JTN / écoute</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.04] space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#A3A9BA]">Consommation de l&apos;enveloppe</span>
              <span className="text-amber-400 font-bold tabular-nums">{percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <CampaignParticipantsList campaign={campaign} />
      )}
    </div>
  );
};
