import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Coins,
  Sparkles,
  CalendarCheck,
  Flame,
  CheckCircle2,
  Clock,
  Gift,
  Award,
} from 'lucide-react';
import {
  getDailyStreakInfo,
  claimDailyRecurringReward,
  DAILY_STREAK_TIERS,
  type UserStreakInfo,
} from '../services/recurring-reward.service';
import { getOrCreateUserWallet } from '../services/token-ledger.service';

export interface RecurringRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onToast: (msg: string, dotColor?: string) => void;
}

export const RecurringRewardModal: React.FC<RecurringRewardModalProps> = ({
  isOpen,
  onClose,
  userId,
  onToast,
}) => {
  const [streakInfo, setStreakInfo] = useState<UserStreakInfo>(() =>
    getDailyStreakInfo(userId)
  );
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const titleId = useId();

  // Actualiser les infos d'éligibilité quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setStreakInfo(getDailyStreakInfo(userId));
      setJustClaimed(false);
    }
  }, [isOpen, userId]);

  // Écoute de la touche Échap pour fermer la modale
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentWallet = getOrCreateUserWallet(userId || 'usr-default');
  const isAvailable = streakInfo.canClaimToday && !justClaimed;

  const handleClaim = () => {
    if (!isAvailable || isClaiming) return;
    setIsClaiming(true);

    try {
      const result = claimDailyRecurringReward(userId);
      if (result.success) {
        setJustClaimed(true);
        setStreakInfo(getDailyStreakInfo(userId));
        onToast(
          `Voucher validé ! +${result.tokensAwarded} Jetons crédités sur votre compte`,
          'bg-amber-400'
        );
      } else {
        onToast(result.error || 'Impossible de réclamer le voucher.', 'bg-rose-500');
      }
    } catch {
      onToast('Erreur inattendue lors de la réclamation.', 'bg-rose-500');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      className="fixed inset-0 z-[180] bg-[#07090E]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[#0D1017] border border-white/15 p-4 sm:p-6 shadow-2xl text-xs text-[#F8FAFC] relative my-auto"
      >
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DE1B34] to-[#F59E0B] p-0.5 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#0D1017] rounded-[10px] flex items-center justify-center text-amber-400">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 id={titleId} className="font-extrabold text-sm text-[#F8FAFC] flex items-center gap-2">
                <span>Voucher Fidélité Broadcast</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                  Série 7 Jours
                </span>
              </h2>
              <p className="text-[11px] text-[#A3A9BA]">
                Récompense quotidienne pour nos auditeurs récurrents sur DROP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la récompense"
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Principale : Carte Ticket Holographique dexter-st */}
        <div className="reward-ticket-wrapper py-2">
          <div className="reward-ticket-card">
            <div className="reward-ticket-bg reward-ticket-holographic" />

            <div className="reward-ticket-header">
              <div className="reward-ticket-brand">
                <span>DROP</span>
              </div>
              <span className="reward-ticket-tag">
                {!isAvailable
                  ? 'VOUCHER VALIDÉ'
                  : `JOUR ${streakInfo.effectiveDay} / 7`}
              </span>
            </div>

            <div className="reward-ticket-body">
              <div className="reward-ticket-symbol">★</div>
              <div className="reward-ticket-notes">♫</div>

              <div className="reward-ticket-value">
                <span>+{streakInfo.currentTier.tokens}</span>
                <span className="reward-ticket-value-unit">JETONS</span>
              </div>

              <p className="reward-ticket-desc">{streakInfo.currentTier.title}</p>
              <p className="reward-ticket-subdesc">
                {streakInfo.currentTier.bonusLabel || 'Bonus Quotidien Récurrent'}
              </p>
            </div>

            <div className="reward-ticket-footer">
              <div className="reward-ticket-number">
                NO. <span className="bold">#DRP-2026-STK-0{streakInfo.effectiveDay}</span>
              </div>
              <div className="reward-ticket-barcode" />
            </div>
          </div>
        </div>

        {/* Timeline de la Série sur 7 Jours */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Progression de votre Série</span>
            </span>
            <span className="text-[#A3A9BA]">
              {streakInfo.state.totalClaimsCount > 0 ? (
                <>
                  <strong className="text-amber-400">{streakInfo.state.totalClaimsCount}</strong>{' '}
                  jours honorés
                </>
              ) : (
                'Premier jour'
              )}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const tier = DAILY_STREAK_TIERS[dayNum];
              const isPast =
                !isAvailable
                  ? dayNum <= streakInfo.effectiveDay
                  : dayNum < streakInfo.effectiveDay;
              const isCurrent = dayNum === streakInfo.effectiveDay;

              return (
                <div
                  key={dayNum}
                  className={`rounded-xl p-1.5 text-center transition flex flex-col items-center justify-between border ${
                    isPast
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-gradient-to-b from-[#DE1B34]/30 to-[#F59E0B]/30 border-amber-400 text-white shadow-md ring-1 ring-amber-400/40'
                      : 'bg-white/5 border-white/10 text-[#A3A9BA]'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider block">
                    J{dayNum}
                  </span>

                  <div className="my-1">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                    ) : tier.isSpecial ? (
                      <Award className="w-3.5 h-3.5 text-amber-400 mx-auto animate-pulse" />
                    ) : (
                      <Coins className={`w-3.5 h-3.5 mx-auto ${isCurrent ? 'text-amber-400' : 'text-[#A3A9BA]'}`} />
                    )}
                  </div>

                  <span className="text-[10px] font-mono font-extrabold block">
                    +{tier.tokens}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bouton d'Action & Compte à Rebours */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          {isAvailable ? (
            <button
              type="button"
              disabled={isClaiming}
              onClick={handleClaim}
              className="w-full py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#DE1B34] via-[#F59E0B] to-[#DE1B34] hover:opacity-95 active:scale-[0.98] transition shadow-lg text-white"
            >
              <Sparkles className="w-4 h-4 animate-spin text-amber-200" style={{ animationDuration: '3s' }} />
              <span>
                {isClaiming
                  ? 'Validation du Voucher...'
                  : `Réclamer mon Voucher (+${streakInfo.currentTier.tokens} Jetons)`}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-xs">
                  Voucher du jour déjà crédité (+{streakInfo.currentTier.tokens} Jetons)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A3A9BA] bg-[#080A0F]/60 border border-white/5 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Drop dans {streakInfo.formattedCountdown}</span>
              </div>
            </div>
          )}

          {/* Solde actuel et rappel Modèle A */}
          <div className="flex items-center justify-between text-[11px] text-[#A3A9BA] px-1">
            <span className="flex items-center gap-1">
              <span>Solde actuel :</span>
              <strong className="text-amber-400 font-mono">
                {currentWallet.availableBalanceTokens.toLocaleString()} jetons
              </strong>
            </span>
            <span className="text-[10px] text-zinc-400">
              Grand Livre Immuable • Zéro Achat Requis
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
