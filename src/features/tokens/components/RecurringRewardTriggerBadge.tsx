import React, { useState, useEffect } from 'react';
import { Gift, Flame, Sparkles, Check } from 'lucide-react';
import { getDailyStreakInfo, type UserStreakInfo } from '../services/recurring-reward.service';

export interface RecurringRewardTriggerBadgeProps {
  userId: string;
  onClick: () => void;
  className?: string;
}

export const RecurringRewardTriggerBadge: React.FC<RecurringRewardTriggerBadgeProps> = ({
  userId,
  onClick,
  className = '',
}) => {
  const [info, setInfo] = useState<UserStreakInfo>(() => getDailyStreakInfo(userId));

  useEffect(() => {
    setInfo(getDailyStreakInfo(userId));

    const handleBalanceUpdate = () => {
      setInfo(getDailyStreakInfo(userId));
    };

    window.addEventListener('drop:token-balance-updated', handleBalanceUpdate);
    return () => window.removeEventListener('drop:token-balance-updated', handleBalanceUpdate);
  }, [userId]);

  const canClaim = info.canClaimToday;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={canClaim ? 'Réclamer votre récompense quotidienne' : 'Consulter votre série de fidélité'}
      className={`relative px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer select-none ${
        canClaim
          ? 'bg-gradient-to-r from-[#DE1B34]/25 to-[#F59E0B]/25 hover:from-[#DE1B34]/35 hover:to-[#F59E0B]/35 border border-amber-400/50 text-amber-300 shadow-sm animate-pulse'
          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-[#A3A9BA]'
      } ${className}`}
    >
      {canClaim ? (
        <>
          <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Drop Quotidien</span>
          <span className="font-mono tabular-nums text-amber-400">+{info.currentTier.tokens}</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#DE1B34] ring-2 ring-[#080A0F] animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#DE1B34] ring-2 ring-[#080A0F]" />
        </>
      ) : (
        <>
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Série</span>
          <span className="font-mono tabular-nums text-[#F8FAFC]">J{info.effectiveDay}</span>
          <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-0.5" />
        </>
      )}
    </button>
  );
};

