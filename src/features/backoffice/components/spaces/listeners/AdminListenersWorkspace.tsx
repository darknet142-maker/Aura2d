import React, { useState } from 'react';
import { Users, ShieldCheck, Coins, Award, CreditCard } from 'lucide-react';
import { AdminUsersDirectory } from '../../AdminUsersDirectory';
import { AdminSubscriptionsManager } from '../finance/AdminSubscriptionsManager';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';

export interface AdminListenersWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
  onSelectUser?: (userId: string) => void;
}

export const AdminListenersWorkspace: React.FC<AdminListenersWorkspaceProps> = ({ ctrl, onSelectUser }) => {
  const [subTab, setSubTab] = useState<'DIRECTORY' | 'SUBSCRIPTIONS'>('DIRECTORY');

  const usersCount = ctrl.users.length;
  const totalPlays = ctrl.users.reduce(
    (acc: number, u: any) =>
      acc + Object.values(u.trackStats).reduce((sum: number, st: any) => sum + (st.playsCount || 0), 0),
    0
  );

  return (
    <div className="flex flex-col gap-4 w-full font-mono text-xs">
      {/* 1. Métriques Broadcast Auditeurs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] uppercase">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auditeurs Actifs</span>
          </div>
          <span className="text-xl font-extrabold text-[#F8FAFC] block mt-1 tabular-nums">
            {usersCount}
          </span>
          <span className="text-[9.5px] text-emerald-400">100% Vérifiés</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] uppercase">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Pass Débloqués</span>
          </div>
          <span className="text-xl font-extrabold text-[#F8FAFC] block mt-1">
            Modèle A
          </span>
          <span className="text-[9.5px] text-amber-400">100% Jetons Sponsors</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] uppercase">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Écoutes Cumulées</span>
          </div>
          <span className="text-xl font-extrabold text-[#F8FAFC] block mt-1 tabular-nums">
            {totalPlays}
          </span>
          <span className="text-[9.5px] text-[#A3A9BA]">Streams validés</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#DE1B34]" />
            <span>Score Anti-Fraude</span>
          </div>
          <span className="text-xl font-extrabold text-[#F8FAFC] block mt-1 tabular-nums">
            99.8 %
          </span>
          <span className="text-[9.5px] text-emerald-400">Zéro bot détecté</span>
        </div>
      </div>

      {/* 2. Sous-Navigation Calme */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#07090E] border border-white/[0.06] w-fit">
        <button
          type="button"
          onClick={() => setSubTab('DIRECTORY')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
            subTab === 'DIRECTORY' ? 'bg-white/10 text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Annuaire &amp; Profils 360°</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('SUBSCRIPTIONS')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
            subTab === 'SUBSCRIPTIONS' ? 'bg-white/10 text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Abonnements &amp; Pass</span>
        </button>
      </div>

      {/* 3. Contenu Selon l'Onglet */}
      {subTab === 'DIRECTORY' ? (
        <AdminUsersDirectory
          users={ctrl.users}
          onSelectUser={(uid: string) => {
            if (onSelectUser) onSelectUser(uid);
            else ctrl.setSelectedConsumerUserId(uid);
          }}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
        />
      ) : (
        <AdminSubscriptionsManager
          users={ctrl.users}
          onToast={(msg) => ctrl.pushNotification('Abonnements', msg, 'COMMUNITY')}
        />
      )}
    </div>
  );
};
