import React, { useState } from 'react';
import { X, Coins, CreditCard, History, ShieldCheck } from 'lucide-react';
import {
  getOrCreateUserWallet,
  getUserLedgerHistory,
  applyTokenTransaction,
} from '../services/token-ledger.service';
import { UserPassRedemptionList } from './UserPassRedemptionList';
import { UserTokenHistoryList } from './UserTokenHistoryList';
import type { GabonSubscriptionPass } from '../../../services/offlineStreamTracker';

export interface UserTokenWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentActivePass?: GabonSubscriptionPass;
  onPassRedeemed?: (passKey: GabonSubscriptionPass) => void;
  onToast: (msg: string, dotColor?: string) => void;
}

export const UserTokenWalletModal: React.FC<UserTokenWalletModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentActivePass,
  onPassRedeemed,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'PASS' | 'HISTORY'>('PASS');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isOpen) return null;

  const wallet = getOrCreateUserWallet(userId || 'anon_user');
  const history = getUserLedgerHistory(userId || 'anon_user');

  const handleRedeemPass = (passKey: GabonSubscriptionPass, cost: number) => {
    setIsRedeeming(true);
    const tx = applyTokenTransaction({
      idempotencyKey: `redeem-${userId}-${passKey}-${Date.now()}`,
      sourceBucket: 'USER_WALLET',
      destinationBucket: 'SUBSCRIPTION_RESERVE',
      amountTokens: cost,
      userId,
      reason: 'PLAN_REDEMPTION',
      referenceNote: `Déblocage 100% Jetons : ${passKey === 'PASS_JOURNALIER' ? 'Pass 7 Jours' : 'Pass Mensuel'}`,
    });

    setIsRedeeming(false);
    if (!tx.success) {
      onToast(tx.error || 'Erreur lors du déblocage', 'bg-rose-500');
      return;
    }

    setRefreshKey((k) => k + 1);
    onToast(`Pass activé (-${cost} jetons)`, 'bg-emerald-400');
    if (onPassRedeemed) onPassRedeemed(passKey);
  };

  return (
    <div
      key={refreshKey}
      onClick={onClose}
      className="fixed inset-0 z-[170] bg-[#07090E]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[#0D1017] border border-white/15 p-4 sm:p-5 space-y-4 shadow-2xl text-xs text-[#F8FAFC]"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#F8FAFC] flex items-center gap-1.5">
                <span>Mon Portefeuille de Jetons</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">Modèle A</span>
              </h3>
              <p className="text-[11px] text-[#A3A9BA]">Financé à 100% par les labels pour débloquer vos abonnements.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#080A0F] border border-white/10 text-center">
          <div>
            <span className="text-[10px] text-[#A3A9BA] block">Solde Disponible</span>
            <span className="text-base font-extrabold font-mono text-amber-400">{wallet.availableBalanceTokens.toLocaleString()}</span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-[10px] text-[#A3A9BA] block">Gains Missions</span>
            <span className="text-base font-extrabold font-mono text-emerald-400">{wallet.lifetimeEarnedTokens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#A3A9BA] block">Dépenses Pass</span>
            <span className="text-base font-extrabold font-mono text-[#F8FAFC]">{wallet.lifetimeSpentTokens.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex rounded-xl bg-[#080A0F] p-1 border border-white/10 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('PASS')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
              activeTab === 'PASS' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Débloquer un Pass</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
              activeTab === 'HISTORY' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique ({history.length})</span>
          </button>
        </div>

        {activeTab === 'PASS' ? (
          <UserPassRedemptionList
            userBalance={wallet.availableBalanceTokens}
            currentActivePass={currentActivePass}
            isRedeeming={isRedeeming}
            onRedeemPass={handleRedeemPass}
          />
        ) : (
          <UserTokenHistoryList history={history} />
        )}
      </div>
    </div>
  );
};

