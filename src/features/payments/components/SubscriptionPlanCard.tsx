import React from 'react';
import { Check, Clock, Radio, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';

export type PlanTier = 'PASS_24H' | 'PASS_7J' | 'PREMIUM_MENSUEL';

export interface PlanSpec {
  id: PlanTier;
  title: string;
  duration: string;
  priceFcfa: number;
  tokensCost: number;
  badge: string;
  subtitle: string;
  features: string[];
}

export interface SubscriptionPlanCardProps {
  plan: PlanSpec;
  isSelected: boolean;
  onSelect: () => void;
}

const TIER_STYLES: Record<
  PlanTier,
  {
    icon: React.ReactNode;
    selectedCard: string;
    unselectedCard: string;
    badgeStyle: string;
    accentPriceColor: string;
    checkColor: string;
  }
> = {
  PASS_24H: {
    icon: <Clock className="w-4 h-4 text-slate-300" />,
    selectedCard:
      'bg-[#0E131F] border-slate-300/80 shadow-[0_8px_24px_rgba(148,163,184,0.15)] ring-1 ring-slate-400/40',
    unselectedCard:
      'bg-[#080B12] border-white/[0.08] hover:border-slate-500/50 hover:bg-[#0B0F18]',
    badgeStyle: 'bg-slate-800 text-slate-200 border border-slate-600/60',
    accentPriceColor: 'text-[#F8FAFC]',
    checkColor: 'text-slate-300',
  },
  PASS_7J: {
    icon: <Radio className="w-4 h-4 text-emerald-400" />,
    selectedCard:
      'bg-[#0A1613] border-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400/50',
    unselectedCard:
      'bg-[#080E0C] border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#091210]',
    badgeStyle: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50',
    accentPriceColor: 'text-emerald-300',
    checkColor: 'text-emerald-400',
  },
  PREMIUM_MENSUEL: {
    icon: <Sparkles className="w-4 h-4 text-[#DE1B34]" />,
    selectedCard:
      'bg-[#19090D] border-[#DE1B34] shadow-[0_10px_30px_rgba(222,27,52,0.3)] ring-1 ring-[#DE1B34]',
    unselectedCard:
      'bg-[#0F0709] border-white/[0.08] hover:border-[#DE1B34]/50 hover:bg-[#14080B]',
    badgeStyle: 'bg-[#DE1B34] text-white font-extrabold shadow-sm',
    accentPriceColor: 'text-[#FF4D64]',
    checkColor: 'text-[#DE1B34]',
  },
};

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  isSelected,
  onSelect,
}) => {
  const styles = TIER_STYLES[plan.id];

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={SPRING_SNAPPY}
      onClick={onSelect}
      className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[148px] ${
        isSelected ? styles.selectedCard : styles.unselectedCard
      }`}
    >
      {/* Badge et Indicateur Radio */}
      <div className="flex items-center justify-between gap-1.5 w-full mb-2">
        <span
          className={`px-2 py-0.5 rounded-md text-[9.5px] uppercase tracking-wider font-extrabold ${styles.badgeStyle}`}
        >
          {plan.badge}
        </span>
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? 'border-transparent bg-white/10 ' + styles.checkColor
              : 'border-white/20 bg-transparent'
          }`}
        >
          {isSelected && <CheckCircle2 className="w-4 h-4 fill-current" />}
        </div>
      </div>

      {/* Titre & Sous-titre */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          {styles.icon}
          <h4 className="text-xs font-extrabold text-[#F8FAFC] tracking-tight">
            {plan.title}
          </h4>
        </div>
        <p className="text-[10px] text-[#A3A9BA] leading-tight">
          {plan.subtitle}
        </p>
      </div>

      {/* Caractéristiques Clés */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.06] space-y-1">
        {plan.features.slice(0, 2).map((feat) => (
          <div key={feat} className="flex items-center gap-1.5 text-[9.5px] text-[#A3A9BA]">
            <Check className={`w-3 h-3 shrink-0 ${styles.checkColor}`} />
            <span className="truncate">{feat}</span>
          </div>
        ))}
      </div>

      {/* Prix Dual : FCFA & Jetons */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-baseline justify-between">
        <div>
          <span className="text-[9px] text-[#A3A9BA] uppercase block">Prix Direct</span>
          <span className={`text-sm font-black tabular-nums ${styles.accentPriceColor}`}>
            {plan.priceFcfa.toLocaleString('fr-FR')} F
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-[#A3A9BA] uppercase block">Ou Jetons</span>
          <span className="text-xs font-black text-amber-400 tabular-nums">
            {plan.tokensCost} JTN
          </span>
        </div>
      </div>
    </motion.button>
  );
};

