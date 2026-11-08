import React, { useState } from 'react';
import { Building2, ShieldCheck, Plus, Layers, Coins } from 'lucide-react';
import {
  getSponsorAccounts, getSponsorCampaigns, fundSponsorAccount,
  getOrCreateSponsorWallet, type SponsorAccount, type SponsorCampaign,
} from '../../tokens';
import type { Track } from '../../../shared/types/domain.types';
import { AdminCreateCampaignModal } from './AdminCreateCampaignModal';

export interface AdminSponsorCampaignsPanelProps {
  allTracksFlat: Track[];
  onToast: (msg: string, dotColor?: string) => void;
}

export const AdminSponsorCampaignsPanel: React.FC<AdminSponsorCampaignsPanelProps> = ({ allTracksFlat, onToast }) => {
  const [sponsors, setSponsors] = useState<SponsorAccount[]>(getSponsorAccounts);
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>(() => getSponsorCampaigns());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickFund = (spId: string) => {
    const res = fundSponsorAccount(spId, 100_000, 'Recharge directe B2B / Virement');
    if (res.success) {
      setSponsors(getSponsorAccounts());
      onToast('+100 000 jetons crédités au sponsor', 'bg-emerald-400');
    } else {
      onToast(res.error || 'Erreur de recharge', 'bg-rose-500');
    }
  };

  const handleCampaignCreated = (budget: number) => {
    setCampaigns(getSponsorCampaigns());
    setSponsors(getSponsorAccounts());
    onToast(`Campagne réservée et activée (${budget.toLocaleString()} jetons)`, 'bg-emerald-400');
  };

  return (
    <div className="flex-1 w-full overflow-y-auto space-y-3.5 pr-0.5 text-xs">
      <div className="rounded-2xl bg-[#0D1017] border border-white/10 p-4 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#F8FAFC]">Espace Partenaires &amp; Campagnes Sponsorisées</h2>
              <p className="text-[11px] text-[#A3A9BA]">Budgets de jetons préfinancés par les labels, producteurs et artistes certifiés.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#080A0F] font-extrabold cursor-pointer transition shadow-md shadow-amber-400/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Campagne</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {sponsors.map((sp) => {
            const w = getOrCreateSponsorWallet(sp.id);
            return (
              <div key={sp.id} className="p-3 rounded-xl bg-[#131722] border border-white/10 space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[#F8FAFC] truncate">{sp.name}</span>
                    {sp.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-amber-400/80 font-mono font-bold block">{sp.role}</span>
                </div>
                <div className="text-[11px] text-[#A3A9BA] space-y-0.5 pt-1 border-t border-white/5">
                  <div className="flex justify-between">
                    <span>Dispo :</span>
                    <strong className="text-amber-400 font-mono">{w.remainingAvailableTokens.toLocaleString()} jetons</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Réservé :</span>
                    <strong className="text-white font-mono">{w.reservedCampaignTokens.toLocaleString()} jetons</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickFund(sp.id)}
                  className="w-full py-1 mt-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-amber-300 cursor-pointer transition"
                >
                  + Recharge Rapide 100K
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-[#0D1017] border border-white/10 p-4 space-y-3 shadow-lg">
        <h3 className="text-sm font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Campagnes Sponsorisées Actives &amp; Réservations</span>
        </h3>
        <div className="space-y-2">
          {campaigns.map((camp) => {
            const percent = camp.totalBudgetTokens > 0 ? Math.round((camp.distributedTokens / camp.totalBudgetTokens) * 100) : 0;
            return (
              <div key={camp.id} className="p-3 rounded-xl bg-[#131722] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F8FAFC] truncate">{camp.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">{camp.status}</span>
                  </div>
                  <p className="text-[11px] text-[#A3A9BA]">
                    {camp.targetArtistName} • {camp.missionType} • Récompense : <strong className="text-amber-300">{camp.rewardPerMission} jetons</strong>
                  </p>
                </div>
                <div className="text-right text-[11px] shrink-0">
                  <div className="text-[#F8FAFC] font-extrabold font-mono">{camp.distributedTokens.toLocaleString()} / {camp.totalBudgetTokens.toLocaleString()} jetons</div>
                  <div className="text-[10px] text-[#A3A9BA]">{percent}% budget distribué</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AdminCreateCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sponsors={sponsors}
        allTracksFlat={allTracksFlat}
        onCreated={handleCampaignCreated}
        onToast={onToast}
      />
    </div>
  );
};
