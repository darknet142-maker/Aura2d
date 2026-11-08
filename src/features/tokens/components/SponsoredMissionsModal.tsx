import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Coins, Play, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { getSponsorCampaigns } from '../services/sponsor-campaign.service';
import { hasUserCompletedCampaign } from '../services/mission-execution.service';

export interface SponsoredMissionsModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onPlayTrackById: (trackId?: string) => void;
  onOpenWalletModal: () => void;
}

export const SponsoredMissionsModal: React.FC<SponsoredMissionsModalProps> = ({
  isOpen,
  userId,
  onClose,
  onPlayTrackById,
  onOpenWalletModal,
}) => {
  if (!isOpen) return null;

  const campaigns = getSponsorCampaigns('ACTIVE');

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[160] bg-[#07090E]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={SPRING_SNAPPY}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl bg-[#0D1017] border border-white/15 p-4 sm:p-5 space-y-4 shadow-2xl text-xs text-[#F8FAFC]"
        >
          {/* En-tête */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Zap className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-[#F8FAFC]">
                  Missions Sponsorisées &amp; Jetons
                </h3>
                <p className="text-[10px] font-mono text-[#A3A9BA]">
                  Financé 100% par les labels • Gagnez des jetons pour vos Pass
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A3A9BA] hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bannière éthique */}
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Modèle A : Les auditeurs ne paient aucun jeton. Seuls les labels financent les campagnes.</span>
          </div>

          {/* Liste des campagnes */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {campaigns.length === 0 ? (
              <div className="p-6 text-center text-[#A3A9BA] font-mono text-xs">
                Aucune mission active pour le moment.
              </div>
            ) : (
              campaigns.map((c) => {
                const completed = hasUserCompletedCampaign(userId, c.id);
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06] hover:border-amber-500/30 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#F8FAFC] truncate">
                          {c.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                          +{c.rewardPerMission} JTN
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-[#A3A9BA] truncate mt-0.5">
                        {c.targetArtistName} • Condition : 30 secondes d&apos;écoute ECG
                      </p>
                    </div>

                    <div className="shrink-0">
                      {completed ? (
                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/25">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Récompensé</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onPlayTrackById(c.targetTrackId);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#080A0F] font-mono text-[10.5px] font-black shadow-md cursor-pointer transition active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Écouter 30s</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied de page */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#A3A9BA]">
              1 Pass 24h = 50 JTN • 1 Pass 30j = 200 JTN
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWalletModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-[#F8FAFC] font-mono text-[10.5px] font-bold border border-white/10 cursor-pointer transition"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Voir mon portefeuille</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

