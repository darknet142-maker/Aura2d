import React, { useState, useEffect, useId } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Coins,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
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
      className="fixed inset-0 z-[180] bg-[#07090E]/80 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto select-none"
    >
      {/* Bouton de Fermeture Flottant Aérien */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la récompense"
        className="fixed top-5 right-5 sm:top-8 sm:right-8 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-lg flex items-center justify-center shadow-xl cursor-pointer transition hover:scale-105 active:scale-95"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Titre Aérien & Contexte Spatial (Sans Boîte) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="text-center mb-1 z-10"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold font-mono tracking-wide shadow-lg backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>VOUCHER QUOTIDIEN • SÉRIE 7 JOURS</span>
        </span>
      </motion.div>

      {/* TICKET HOLOGRAPHIQUE FLOTTANT EN APESANTEUR (ZÉRO BOÎTE) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="reward-ticket-wrapper">
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

        {/* Commandes Flottantes Directement sous le Ticket */}
        <div className="w-full max-w-[280px] flex flex-col items-center gap-3 mt-1">
          {isAvailable ? (
            <button
              type="button"
              disabled={isClaiming}
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-full font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#DE1B34] via-[#F59E0B] to-[#DE1B34] hover:opacity-95 active:scale-[0.97] transition shadow-[0_12px_28px_-6px_rgba(222,27,52,0.6)] text-white border border-white/25"
            >
              <Sparkles className="w-4 h-4 animate-spin text-amber-200" style={{ animationDuration: '3s' }} />
              <span>
                {isClaiming
                  ? 'Validation du Voucher...'
                  : `Réclamer (+${streakInfo.currentTier.tokens} Jetons)`}
              </span>
            </button>
          ) : (
            <div className="w-full flex items-center justify-between p-2.5 rounded-full bg-[#0D1017]/90 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-xl px-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Réclamé aujourd'hui</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#A3A9BA]">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{streakInfo.formattedCountdown}</span>
              </div>
            </div>
          )}

          {/* Timeline Flottante Épurée des 7 Jours (Sans Boîte) */}
          <div className="w-full flex items-center justify-between gap-1 px-1">
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
                  title={`Jour ${dayNum} : +${tier.tokens} Jetons`}
                  className={`flex-1 py-1 rounded-lg text-center transition flex flex-col items-center justify-center border backdrop-blur-md ${
                    isPast
                      ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-gradient-to-b from-[#DE1B34]/60 to-[#F59E0B]/60 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50'
                      : 'bg-white/10 border-white/10 text-[#A3A9BA]'
                  }`}
                >
                  <span className="text-[9px] font-bold block">J{dayNum}</span>
                  <span className="text-[9px] font-mono font-extrabold block">
                    {isPast ? '✓' : `+${tier.tokens}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rappel Discret Solde Portefeuille */}
          <div className="text-[11px] text-[#A3A9BA] flex items-center gap-1.5 backdrop-blur-sm px-3 py-1 rounded-full bg-[#080A0F]/60 border border-white/5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Solde actuel :</span>
            <strong className="text-amber-400 font-mono">
              {currentWallet.availableBalanceTokens.toLocaleString()} jetons
            </strong>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
