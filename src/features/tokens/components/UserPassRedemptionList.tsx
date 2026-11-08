import React from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import type { GabonSubscriptionPass } from '../../../services/offlineStreamTracker';

interface PassOption {
  key: GabonSubscriptionPass;
  title: string;
  duration: string;
  tokensCost: number;
  features: string[];
}

const PASS_CATALOGUE: PassOption[] = [
  {
    key: 'PASS_JOURNALIER',
    title: 'Pass Semaine 7 Jours',
    duration: '7 jours d’accès',
    tokensCost: 500,
    features: ['Écoute continue sans coupure pub', 'Qualité Studio HD', '1 vote quotidien Awards'],
  },
  {
    key: 'PASS_MENSUEL_HEBDO',
    title: 'Pass Mensuel Premium DROP',
    duration: '30 jours complets',
    tokensCost: 1500,
    features: ['Écoutes illimitées certifiées (1.0 ECG)', 'Téléchargement privé sur mobile', '3 votes quotidiens Awards'],
  },
];

export interface UserPassRedemptionListProps {
  userBalance: number;
  currentActivePass?: GabonSubscriptionPass;
  isRedeeming: boolean;
  onRedeemPass: (passKey: GabonSubscriptionPass, cost: number) => void;
}

export const UserPassRedemptionList: React.FC<UserPassRedemptionListProps> = ({
  userBalance,
  currentActivePass,
  isRedeeming,
  onRedeemPass,
}) => {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-[#080A0F] border border-amber-400/20 flex items-center justify-between text-xs">
        <span className="text-[#A3A9BA]">Modèle A : 100% financé par les labels</span>
        <span className="font-mono font-bold text-amber-400">{userBalance.toLocaleString()} jetons dispo</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PASS_CATALOGUE.map((p) => {
          const isActive = currentActivePass === p.key;
          const canAfford = userBalance >= p.tokensCost;

          return (
            <div
              key={p.key}
              className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-[#131722] border-white/10'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-extrabold text-[#F8FAFC] text-xs">{p.title}</h4>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Actif
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-amber-400 font-bold">{p.tokensCost.toLocaleString()} jetons</div>
                <p className="text-[10px] text-[#A3A9BA]">{p.duration}</p>
                <ul className="text-[10px] text-[#A3A9BA] space-y-1 pt-1.5 border-t border-white/5">
                  {p.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={isActive || !canAfford || isRedeeming}
                onClick={() => onRedeemPass(p.key, p.tokensCost)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 opacity-60 cursor-default'
                    : canAfford
                    ? 'bg-[#DE1B34] hover:bg-[#f02842] text-white shadow-md shadow-[#DE1B34]/25'
                    : 'bg-white/5 text-[#A3A9BA] opacity-50 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isActive
                    ? 'Déjà Actif'
                    : canAfford
                    ? `Débloquer (${p.tokensCost.toLocaleString()} jetons)`
                    : `Solde insuffisant (${userBalance}/${p.tokensCost})`}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
