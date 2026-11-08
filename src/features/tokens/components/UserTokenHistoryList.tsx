import React from 'react';
import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import type { TokenLedgerEntry } from '../types/token-economy.types';

export interface UserTokenHistoryListProps {
  history: TokenLedgerEntry[];
}

export const UserTokenHistoryList: React.FC<UserTokenHistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#080A0F] border border-white/5 space-y-2">
        <History className="w-6 h-6 text-[#A3A9BA] mx-auto opacity-50" />
        <p className="text-xs text-[#F8FAFC] font-semibold">Aucune transaction pour le moment</p>
        <p className="text-[11px] text-[#A3A9BA]">Accomplissez des missions d’écoute sponsorisées pour gagner vos premiers jetons.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
      {history.map((tx) => {
        const isCredit = tx.destinationBucket === 'USER_WALLET';
        const dateStr = new Date(tx.timestampIso).toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        });

        return (
          <div
            key={tx.transactionId}
            className="p-2.5 rounded-xl bg-[#131722] border border-white/5 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[#F8FAFC] font-bold truncate">
                  {tx.referenceNote || (isCredit ? 'Récompense mission' : 'Déblocage abonnement')}
                </div>
                <div className="text-[10px] text-[#A3A9BA] font-mono">{dateStr}</div>
              </div>
            </div>
            <div
              className={`font-mono font-extrabold text-right shrink-0 ${
                isCredit ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isCredit ? `+${tx.amountTokens.toLocaleString()}` : `-${tx.amountTokens.toLocaleString()}`} jetons
            </div>
          </div>
        );
      })}
    </div>
  );
};
