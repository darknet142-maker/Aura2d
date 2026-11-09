import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Play, CheckCircle2, Coins, ShieldCheck, ArrowRight } from 'lucide-react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { getSponsorCampaigns } from '../../tokens/services/sponsor-campaign.service';
import { hasUserCompletedCampaign } from '../../tokens/services/mission-execution.service';
import { getOrCreateUserWallet } from '../../tokens/services/token-ledger.service';

export interface CentralMissionsTabProps {
  currentUser?: { id: string; name?: string } | null;
  catalogue: { tracks: { id: string; [key: string]: any }[] }[];
  onPlayOrToggleTrack: (albumIdx: number, trackIdx: number) => void;
  onOpenWalletModal: () => void;
  onCloseCentral?: () => void;
}

export const CentralMissionsTab: React.FC<CentralMissionsTabProps> = ({
  currentUser, catalogue, onPlayOrToggleTrack, onOpenWalletModal, onCloseCentral,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'COMPLETED'>('ALL');
  const userId = currentUser?.id || 'usr-default';
  const wallet = getOrCreateUserWallet(userId);
  const campaigns = getSponsorCampaigns('ACTIVE');

  const filteredCampaigns = campaigns.filter((c) => {
    const isDone = hasUserCompletedCampaign(userId, c.id);
    return filter === 'AVAILABLE' ? !isDone : filter === 'COMPLETED' ? isDone : true;
  });

  const availableCount = campaigns.filter((c) => !hasUserCompletedCampaign(userId, c.id)).length;

  const handleLaunchMission = (targetTrackId?: string) => {
    if (!targetTrackId) return;
    for (let aIdx = 0; aIdx < catalogue.length; aIdx++) {
      const tIdx = catalogue[aIdx].tracks.findIndex((t) => t.id === targetTrackId);
      if (tIdx !== -1) {
        onPlayOrToggleTrack(aIdx, tIdx);
        onCloseCentral?.();
        break;
      }
    }
  };

  return (
    <div className="space-y-3 pr-0.5 text-xs text-[#F8FAFC]">
      {/* En-tête */}
      <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <h2 className="text-sm font-mono font-bold text-[#F8FAFC]">
              Missions sponsorisées
            </h2>
          </div>
          <p className="text-[10.5px] font-mono text-[#A3A9BA] mt-0.5">
            Financé à 100% par les labels • Gagnez des jetons pour débloquer vos pass
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenWalletModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-mono text-xs font-bold cursor-pointer transition"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>{wallet.availableBalanceTokens.toLocaleString('fr-FR')} JTN</span>
          <ArrowRight className="w-3 h-3 text-[#A3A9BA]" />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-1.5 bg-[#07090E] p-1 rounded-xl border border-white/[0.08] text-[11px] font-mono">
        {(['ALL', 'AVAILABLE', 'COMPLETED'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilter(mode)}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filter === mode ? 'bg-amber-500 text-[#080A0F] font-bold shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            {mode === 'ALL' ? `Toutes (${campaigns.length})` : mode === 'AVAILABLE' ? `Disponibles (${availableCount})` : `Accomplies (${campaigns.length - availableCount})`}
          </button>
        ))}
      </div>

      {/* Liste de cartes */}
      <div className="space-y-2">
        {filteredCampaigns.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#0D1017] border border-white/[0.06] text-[#A3A9BA] font-mono">
            Aucune mission dans cette catégorie.
          </div>
        ) : (
          filteredCampaigns.map((c) => {
            const isDone = hasUserCompletedCampaign(userId, c.id);
            return (
              <motion.div
                key={c.id}
                whileHover={{ y: -2 }}
                transition={SPRING_SNAPPY}
                className="p-3 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-amber-500/35 flex flex-wrap items-center justify-between gap-3 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#F8FAFC] truncate">{c.title}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-300 font-mono font-bold text-[9.5px] border border-amber-500/30 shrink-0">
                      +{c.rewardPerMission} JTN
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#A3A9BA] truncate mt-0.5">
                    {c.targetArtistName} • Condition : 30 secondes d&apos;écoute ECG
                  </p>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Récompensé</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLaunchMission(c.targetTrackId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#080A0F] font-mono text-xs font-black shadow-md cursor-pointer transition active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Écouter 30s &amp; Gagner</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Note d'éthique */}
      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2 text-[10px] font-mono text-emerald-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Streams sponsorisés 100% financés par les labels (Exclus de la BUGADA).</span>
        </div>
        <button type="button" onClick={onOpenWalletModal} className="text-white hover:underline shrink-0 font-bold">
          Pass →
        </button>
      </div>
    </div>
  );
};
