import React from 'react';
import { ChevronLeft, Clock, Play, ShieldCheck, User } from 'lucide-react';
import { UserSubscriptionPassCard } from './user/UserSubscriptionPassCard';
import { UserTokenWalletCard } from './user/UserTokenWalletCard';
import { UserOfflineDrmCard } from './user/UserOfflineDrmCard';
import { UserListeningHistoryTable } from './user/UserListeningHistoryTable';
import type { AppUser } from '../../../../shared/types/domain.types';
import type { ConsumerAnalyticsData } from './drilldown.types';

export interface AdminConsumerUserDrilldownProps {
  selectedConsumerUser: AppUser;
  consumerAnalytics: ConsumerAnalyticsData;
  users: AppUser[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
}

export const AdminConsumerUserDrilldownView: React.FC<AdminConsumerUserDrilldownProps> = ({
  selectedConsumerUser, consumerAnalytics, users, trackRankMap, onClose, onSelectTrack,
}) => {
  const formatLongDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const rank = [...users]
    .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
    .findIndex((u) => u.id === selectedConsumerUser.id) + 1;

  return (
    <div className="flex-1 w-full flex flex-col bg-[#080A0F] border border-white/[0.08] rounded-2xl p-4 overflow-y-auto gap-4">
      {/* 1. Header Navigation & Titre */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <ChevronLeft className="w-4 h-4 text-emerald-400" />
            <span>Retour à l&apos;annuaire</span>
          </button>
          <div>
            <h2 className="text-base font-black text-[#F8FAFC]">
              Fiche Auditeur 360° — {selectedConsumerUser.name}
            </h2>
            <span className="text-[10.5px] font-mono text-[#A3A9BA]">
              ID: {selectedConsumerUser.id} • Rang Auditeur : #{rank} sur {users.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0D1017] border border-white/10 text-white font-bold">
            <Clock className="w-3.5 h-3.5 text-[#DE1B34]" />
            {formatLongDuration(selectedConsumerUser.totalListenSeconds)}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
            <Play className="w-3.5 h-3.5 fill-current" />
            {selectedConsumerUser.totalValidatedPlays} streams ECG
          </span>
        </div>
      </div>

      {/* 2. Grille des 3 Cartes Spécialisées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <UserSubscriptionPassCard user={selectedConsumerUser} />
        <UserTokenWalletCard user={selectedConsumerUser} />
        <UserOfflineDrmCard user={selectedConsumerUser} />
      </div>

      {/* 3. Tableau Exhaustif d'Écoutes */}
      <UserListeningHistoryTable
        items={consumerAnalytics.byListenTime}
        onSelectTrack={onSelectTrack}
      />
    </div>
  );
};
