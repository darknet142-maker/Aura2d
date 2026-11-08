import React, { useState } from 'react';
import { Target, Coins, Users, CheckCircle2, Pause, Play, Disc3, ShieldCheck } from 'lucide-react';
import { CampaignParticipantsList } from './CampaignParticipantsList';
import type { SponsorCampaign } from '../../../../tokens';

export interface CampaignDetailCardProps {
  campaign: SponsorCampaign;
  onToggleStatus: (campaignId: string) => void;
  onAdjustBudget: (campaignId: string) => void;
}

export const CampaignDetailCard: React.FC<CampaignDetailCardProps> = ({
  campaign, onToggleStatus, onAdjustBudget,
}) => {
  const [viewTab, setViewTab] = useState<'METRICS' | 'AUDITORS'>('METRICS');
  const percent = campaign.totalBudgetTokens > 0
    ? Math.round((campaign.distributedTokens / campaign.totalBudgetTokens) * 100)
    : 0;
  const remaining = Math.max(0, campaign.totalBudgetTokens - campaign.distributedTokens);
  const completions = Math.round(campaign.distributedTokens / (campaign.rewardPerMission || 150));

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3.5 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Fiche Détaillée Campagne : {campaign.title}
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
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
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold cursor-pointer transition"
          >
            Ajuster Budget
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#07090E] border border-white/10 w-fit text-xs">
        <button
          type="button"
          onClick={() => setViewTab('METRICS')}
          className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
            viewTab === 'METRICS' ? 'bg-amber-400 text-[#080A0F]' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Indicateurs &amp; Budget
        </button>
        <button
          type="button"
          onClick={() => setViewTab('AUDITORS')}
          className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
            viewTab === 'AUDITORS' ? 'bg-amber-400 text-[#080A0F]' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Auditeurs Validés
        </button>
      </div>

      {viewTab === 'METRICS' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Budget Total</span>
              <span className="text-base font-extrabold text-[#F8FAFC]">{campaign.totalBudgetTokens.toLocaleString('fr-FR')}</span>
              <span className="text-[9px] text-amber-400 block">JTN Alloués</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Distribué</span>
              <span className="text-base font-extrabold text-emerald-400">{campaign.distributedTokens.toLocaleString('fr-FR')}</span>
              <span className="text-[9px] text-[#A3A9BA] block">{percent}% consommés</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Solde Restant</span>
              <span className="text-base font-extrabold text-cyan-300">{remaining.toLocaleString('fr-FR')}</span>
              <span className="text-[9px] text-[#A3A9BA] block">JTN en réserve</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
              <span className="text-[9.5px] text-[#A3A9BA] uppercase block">Missions Réussies</span>
              <span className="text-base font-extrabold text-amber-300">{completions}</span>
              <span className="text-[9px] text-emerald-400 block">+{campaign.rewardPerMission || 150} JTN / écoute</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#A3A9BA]">Consommation de l&apos;enveloppe</span>
              <span className="text-amber-400 font-bold">{percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <CampaignParticipantsList campaign={campaign} />
      )}
    </div>
  );
};
