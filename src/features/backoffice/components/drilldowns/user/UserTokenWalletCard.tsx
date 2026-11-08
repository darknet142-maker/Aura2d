import React from 'react';
import { Coins, ArrowDownRight, ArrowUpRight, Shield } from 'lucide-react';
import { getOrCreateUserWallet } from '../../../../tokens';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface UserTokenWalletCardProps {
  user: AppUser;
}

export const UserTokenWalletCard: React.FC<UserTokenWalletCardProps> = ({ user }) => {
  const wallet = getOrCreateUserWallet(user.id);

  return (
    <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between space-y-2.5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
            Portefeuille &amp; Grand Livre Auditeur
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Zéro Cashout
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Solde Actuel</span>
          <span className="text-base font-mono font-extrabold text-amber-400">
            {wallet.availableBalanceTokens.toLocaleString('fr-FR')}
          </span>
          <span className="text-[9px] font-mono text-[#A3A9BA] block">JTN dispo</span>
        </div>
        <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Total Gagné</span>
          <span className="text-base font-mono font-extrabold text-emerald-400">
            {wallet.lifetimeEarnedTokens.toLocaleString('fr-FR')}
          </span>
          <span className="text-[9px] font-mono text-[#A3A9BA] block">via missions</span>
        </div>
        <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05]">
          <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Dépensé Pass</span>
          <span className="text-base font-mono font-extrabold text-[#F8FAFC]">
            {wallet.lifetimeSpentTokens.toLocaleString('fr-FR')}
          </span>
          <span className="text-[9px] font-mono text-[#A3A9BA] block">en abonnements</span>
        </div>
      </div>

      <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-[#A3A9BA]">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          Conformité Modèle A : Intransférable entre auditeurs
        </span>
        <span className="text-white/80">3 missions validées</span>
      </div>
    </div>
  );
};
