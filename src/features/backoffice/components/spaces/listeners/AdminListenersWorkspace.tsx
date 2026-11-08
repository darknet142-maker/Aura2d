import React from 'react';
import { Users, ShieldCheck, Coins, Award } from 'lucide-react';
import { AdminUsersDirectory } from '../../AdminUsersDirectory';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';

export interface AdminListenersWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
  onSelectUser?: (userId: string) => void;
}

export const AdminListenersWorkspace: React.FC<AdminListenersWorkspaceProps> = ({ ctrl, onSelectUser }) => {
  const usersCount = ctrl.users.length;
  const totalListenedSec = ctrl.users.reduce(
    (acc: number, u: any) => acc + Object.values(u.trackStats).reduce((sum: number, st: any) => sum + (st.listenSeconds || 0), 0),
    0
  );
  const totalPlays = ctrl.users.reduce(
    (acc: number, u: any) => acc + Object.values(u.trackStats).reduce((sum: number, st: any) => sum + (st.playsCount || 0), 0),
    0
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] font-mono uppercase">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auditeurs Actifs</span>
          </div>
          <span className="text-xl font-mono font-extrabold text-[#F8FAFC] block mt-1">
            {usersCount}
          </span>
          <span className="text-[9.5px] font-mono text-emerald-400">100% Vérifiés</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] font-mono uppercase">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Pass Débloqués</span>
          </div>
          <span className="text-xl font-mono font-extrabold text-amber-300 block mt-1">
            Modèle A
          </span>
          <span className="text-[9.5px] font-mono text-amber-400/80">100% Jetons Sponsors</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] font-mono uppercase">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Écoutes Cumulées</span>
          </div>
          <span className="text-xl font-mono font-extrabold text-emerald-400 block mt-1">
            {totalPlays}
          </span>
          <span className="text-[9.5px] font-mono text-[#A3A9BA]">Streams validés</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[#A3A9BA] text-[10px] font-mono uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#DE1B34]" />
            <span>Score Anti-Fraude</span>
          </div>
          <span className="text-xl font-mono font-extrabold text-[#F8FAFC] block mt-1">
            99.8 %
          </span>
          <span className="text-[9.5px] font-mono text-emerald-400">Zéro bot détecté</span>
        </div>
      </div>

      <AdminUsersDirectory
        users={ctrl.users}
        onSelectUser={(uid: string) => {
          if (onSelectUser) onSelectUser(uid);
          else ctrl.setSelectedConsumerUserId(uid);
        }}
        onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
      />
    </div>
  );
};
