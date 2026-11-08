import React from 'react';
import { Award, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import type { AppUser } from '../../../../../shared/types/domain.types';

export interface UserSubscriptionPassCardProps {
  user: AppUser;
}

export const UserSubscriptionPassCard: React.FC<UserSubscriptionPassCardProps> = ({ user }) => {
  const isVip = user.role === 'ADMIN' || user.totalListenSeconds > 3600;
  const passName = isVip ? 'Pass Mensuel Illimité' : 'Pass Découverte 24h';
  const tokensCost = isVip ? 500 : 50;

  return (
    <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between space-y-2.5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
            Abonnement Actif (Modèle A)
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          ● Actif
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-extrabold text-[#F8FAFC] block">{passName}</span>
          <span className="text-[10px] font-mono text-[#A3A9BA]">
            Débloqué à 100 % en jetons sponsors (0 FCFA auditeur)
          </span>
        </div>
        <div className="text-right font-mono">
          <span className="text-sm font-bold text-amber-300">{tokensCost} JTN</span>
          <span className="text-[9.5px] text-[#A3A9BA] block">Coût du pass</span>
        </div>
      </div>

      <div className="p-2 rounded-xl bg-[#07090E] border border-white/[0.05] flex items-center justify-between text-[10.5px] font-mono">
        <span className="text-[#A3A9BA] flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-cyan-400" />
          Échéance : dans 18 jours
        </span>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Renouvellement automatique
        </span>
      </div>
    </div>
  );
};
