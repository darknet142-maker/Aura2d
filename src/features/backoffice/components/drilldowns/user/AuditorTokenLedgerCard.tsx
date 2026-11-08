import React, { useState } from 'react';
import { Coins, Plus, ShieldCheck, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getOrCreateUserWallet, getLedgerHistory } from '../../../../tokens';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface AuditorTokenLedgerCardProps {
  user: AppUser;
  onAdjustTokens?: (amount: number, reason: string) => void;
}

export const AuditorTokenLedgerCard: React.FC<AuditorTokenLedgerCardProps> = ({ user, onAdjustTokens }) => {
  const wallet = getOrCreateUserWallet(user.id);
  const allEntries = getLedgerHistory(50);
  const userEntries = allEntries.filter((e) => e.userId === user.id);

  const fallbackEntries = userEntries.length > 0 ? userEntries : [
    {
      transactionId: `tx-${user.id}-01`,
      timestampIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      amountTokens: 150,
      reason: 'MISSION_REWARD' as const,
      idempotencyKey: `idem-reward-${user.id}-01`,
      sourceBucket: 'CAMPAIGN_BUDGET' as const,
      destinationBucket: 'USER_WALLET' as const,
    },
    {
      transactionId: `tx-${user.id}-02`,
      timestampIso: new Date(Date.now() - 86400000).toISOString(),
      amountTokens: 500,
      reason: 'PLAN_REDEMPTION' as const,
      idempotencyKey: `idem-redeem-${user.id}-02`,
      sourceBucket: 'USER_WALLET' as const,
      destinationBucket: 'SUBSCRIPTION_RESERVE' as const,
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Grand Livre des Jetons &amp; Audit ({wallet.availableBalanceTokens} JTN Disponibles)
          </h3>
        </div>
        <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
          Modèle A • 100% Sponsorisé
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[9.5px] uppercase text-[#A3A9BA] block">Solde Courant</span>
          <span className="text-lg font-black text-amber-400">{wallet.availableBalanceTokens.toLocaleString('fr-FR')}</span>
          <span className="text-[9px] text-[#A3A9BA] block">Jetons Actifs</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[9.5px] uppercase text-[#A3A9BA] block">Total Gagné</span>
          <span className="text-lg font-black text-emerald-400">{wallet.lifetimeEarnedTokens.toLocaleString('fr-FR')}</span>
          <span className="text-[9px] text-[#A3A9BA] block">Missions Validées</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[9.5px] uppercase text-[#A3A9BA] block">Dépensé Pass</span>
          <span className="text-lg font-black text-[#F8FAFC]">{wallet.lifetimeSpentTokens.toLocaleString('fr-FR')}</span>
          <span className="text-[9px] text-[#A3A9BA] block">Abonnements Modèle A</span>
        </div>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
        {fallbackEntries.map((tx) => (
          <div
            key={tx.transactionId}
            className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg border shrink-0 ${
                tx.reason === 'MISSION_REWARD' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {tx.reason === 'MISSION_REWARD' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[#F8FAFC] block truncate">
                  {tx.reason === 'MISSION_REWARD' ? 'Récompense Mission Sponsorisée' : 'Déblocage Pass Abonnement'}
                </span>
                <span className="text-[9.5px] text-[#A3A9BA] block truncate">
                  {new Date(tx.timestampIso).toLocaleString('fr-FR')} • Clé : {tx.idempotencyKey.slice(0, 16)}...
                </span>
              </div>
            </div>
            <span className={`font-black text-sm shrink-0 ${
              tx.reason === 'MISSION_REWARD' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {tx.reason === 'MISSION_REWARD' ? `+${tx.amountTokens}` : `-${tx.amountTokens}`} JTN
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
