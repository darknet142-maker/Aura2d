import React from 'react';
import { motion } from 'motion/react';
import { Zap, CheckCircle2, ChevronRight, Coins } from 'lucide-react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { SponsorCampaign } from '../types/token-economy.types';

export interface SponsoredTrackBannerProps {
  campaign?: SponsorCampaign | null;
  listenedSec: number;
  isCompleted: boolean;
  onOpenMissionsModal?: () => void;
  onOpenWalletModal?: () => void;
}

export const SponsoredTrackBanner: React.FC<SponsoredTrackBannerProps> = ({
  campaign,
  listenedSec,
  isCompleted,
  onOpenMissionsModal,
  onOpenWalletModal,
}) => {
  if (!campaign) return null;

  const targetSec = 30;
  const progressPct = Math.min(100, Math.round((listenedSec / targetSec) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING_SNAPPY}
      className="w-full rounded-2xl bg-[#0D1017] border border-amber-500/25 p-2.5 sm:p-3 shadow-[0_12px_30px_-10px_rgba(245,158,11,0.22)] text-xs text-[#F8FAFC] space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400 truncate">
                Mission Sponsorisée • {campaign.targetArtistName || 'Label'}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/30 shrink-0">
                +{campaign.rewardPerMission} JTN
              </span>
            </div>
            <p className="text-[10.5px] text-[#A3A9BA] truncate">
              {isCompleted
                ? 'Récompense déjà attribuée à votre portefeuille'
                : `Écoutez 30s pour débloquer +${campaign.rewardPerMission} jetons gratuits`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={isCompleted ? onOpenWalletModal : onOpenMissionsModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#F8FAFC] text-[10.5px] font-mono font-bold border border-white/10 shrink-0 transition cursor-pointer active:scale-95"
        >
          {isCompleted ? (
            <>
              <Coins className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Portefeuille</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Missions</span>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      {/* Barre de progression ECG 30s */}
      {!isCompleted ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px] font-mono text-[#A3A9BA]">
            <span>Progression écoute qualifiée</span>
            <span className="font-bold text-amber-300">
              {Math.min(targetSec, listenedSec)}s / {targetSec}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Mission accomplie • Jetons prêts à débloquer votre abonnement</span>
        </div>
      )}
    </motion.div>
  );
};

