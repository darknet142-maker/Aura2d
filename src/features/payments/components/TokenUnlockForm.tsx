import React, { useState } from 'react';
import { Coins, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export interface TokenUnlockFormProps {
  userBalance: number;
  tokensCost: number;
  planTitle: string;
  onSuccess: (receipt: { txnId: string; tokensSpent: number }) => void;
  onGoToMissions?: () => void;
}

export const TokenUnlockForm: React.FC<TokenUnlockFormProps> = ({
  userBalance,
  tokensCost,
  planTitle,
  onSuccess,
  onGoToMissions,
}) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const canAfford = userBalance >= tokensCost;
  const missingTokens = Math.max(0, tokensCost - userBalance);

  const handleUnlock = () => {
    if (!canAfford) return;

    setStatus('PROCESSING');
    setTimeout(() => {
      setStatus('SUCCESS');
      const txnId = `JTN-UNLOCK-${Date.now().toString().slice(-6)}`;
      onSuccess({
        txnId,
        tokensSpent: tokensCost,
      });
    }, 800);
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="p-3.5 rounded-xl bg-[#07090E] border border-amber-400/20 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase text-[#A3A9BA] block">Votre Solde Actuel</span>
          <span className="text-base font-extrabold text-amber-400 tabular-nums">
            {userBalance.toLocaleString('fr-FR')} JTN
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase text-[#A3A9BA] block">Coût du Pass</span>
          <span className="text-base font-extrabold text-[#F8FAFC] tabular-nums">
            {tokensCost.toLocaleString('fr-FR')} JTN
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.08] space-y-1.5">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
          <ShieldCheck className="w-4 h-4" />
          <span>Règle Commerciale : Déblocage 100% en Jetons</span>
        </div>
        <p className="text-[10px] text-[#A3A9BA] leading-relaxed">
          Financé intégralement par les labels &amp; producteurs partenaires. Vous ne payez aucun FCFA.
          Le paiement mixte (argent + jetons) est strictement interdit par le modèle économique.
        </p>
      </div>

      {canAfford ? (
        <button
          type="button"
          onClick={handleUnlock}
          disabled={status === 'PROCESSING'}
          className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#080A0F] font-extrabold flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 shadow-md shadow-amber-400/20"
        >
          {status === 'PROCESSING' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#080A0F]" />
              <span>Écriture dans le grand livre jetons...</span>
            </>
          ) : (
            <>
              <span>Débloquer le Pass ({tokensCost} JTN)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-[10.5px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Solde insuffisant : il vous manque {missingTokens} jetons pour débloquer ce pass.</span>
          </div>
          {onGoToMissions && (
            <button
              type="button"
              onClick={onGoToMissions}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#F8FAFC] font-bold flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Gagner des jetons dans l&apos;espace Missions</span>
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-[#A3A9BA] pt-1">
        <span>Zéro Achat Utilisateur</span>
        <span>Zéro Cashout en Espèces</span>
      </div>
    </div>
  );
};

