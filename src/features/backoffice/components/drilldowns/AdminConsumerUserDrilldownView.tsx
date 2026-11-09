import React, { useState } from 'react';
import { ChevronLeft, Clock, Play } from 'lucide-react';
import { UserIdentityAndActionsCard } from './user/UserIdentityAndActionsCard';
import { UserSubscriptionPassCard } from './user/UserSubscriptionPassCard';
import { UserTokenWalletCard } from './user/UserTokenWalletCard';
import { UserOfflineDrmCard } from './user/UserOfflineDrmCard';
import { AuditorDevicesTable } from './user/AuditorDevicesTable';
import { AuditorTokenLedgerCard } from './user/AuditorTokenLedgerCard';
import { AuditorDrmLicensesCard } from './user/AuditorDrmLicensesCard';
import { UserListeningHistoryTable } from './user/UserListeningHistoryTable';
import { UserCompletedMissionsCard } from './user/UserCompletedMissionsCard';
import { UserContestationsCard } from './user/UserContestationsCard';
import type { AppUser } from '../../../../shared/types/domain.types';
import type { ConsumerAnalyticsData } from './drilldown.types';

export interface AdminConsumerUserDrilldownProps {
  selectedConsumerUser: AppUser;
  consumerAnalytics: ConsumerAnalyticsData;
  users: AppUser[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
  onToast?: (msg: string) => void;
}

export type AuditorTab = 'SYNTHESE' | 'MISSIONS' | 'DEVICES' | 'CONTESTATIONS' | 'DRM' | 'LEDGER' | 'TRACKS';

export const AdminConsumerUserDrilldownView: React.FC<AdminConsumerUserDrilldownProps> = ({
  selectedConsumerUser, consumerAnalytics, users, onClose, onSelectTrack, onToast,
}) => {
  const [tab, setTab] = useState<AuditorTab>('SYNTHESE');

  const rank = [...users]
    .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
    .findIndex((u) => u.id === selectedConsumerUser.id) + 1;

  const tabs: { id: AuditorTab; label: string }[] = [
    { id: 'SYNTHESE', label: 'Synthèse 360°' },
    { id: 'MISSIONS', label: 'Missions & Récompenses' },
    { id: 'DEVICES', label: 'Appareils & Sessions' },
    { id: 'CONTESTATIONS', label: 'Contestations & Litiges' },
    { id: 'DRM', label: 'Coffre-fort DRM' },
    { id: 'LEDGER', label: 'Grand Livre Jetons' },
    { id: 'TRACKS', label: `Écoutes ECG (${consumerAnalytics.byListenTime.length})` },
  ];

  return (
    <div className="flex-1 w-full flex flex-col bg-[#080A0F] border border-white/[0.08] rounded-2xl p-4 overflow-y-auto gap-4 font-mono">
      {/* 1. Entête de Navigation & Titre */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3 shrink-0">
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
            <span className="text-[10.5px] text-[#A3A9BA]">
              ID: {selectedConsumerUser.id} • Rang Auditeur : #{rank} sur {users.length} • Anti-Fraude : 99.8%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
            <Play className="w-3.5 h-3.5 fill-current" />
            {selectedConsumerUser.totalValidatedPlays} streams ECG
          </span>
        </div>
      </div>

      {/* 2. Profil & Statut & Actions Rapides */}
      <UserIdentityAndActionsCard user={selectedConsumerUser} onToast={onToast} />

      {/* 3. Onglets de Navigation 360° */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0D1017] border border-white/10 overflow-x-auto text-xs shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition ${tab === t.id ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. Contenu de l'onglet actif */}
      {tab === 'SYNTHESE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <UserSubscriptionPassCard user={selectedConsumerUser} />
            <UserTokenWalletCard user={selectedConsumerUser} />
            <UserOfflineDrmCard user={selectedConsumerUser} />
          </div>
          <UserListeningHistoryTable
            items={consumerAnalytics.byListenTime.slice(0, 5)}
            onSelectTrack={onSelectTrack}
          />
        </div>
      )}

      {tab === 'MISSIONS' && <UserCompletedMissionsCard user={selectedConsumerUser} />}
      {tab === 'DEVICES' && <AuditorDevicesTable user={selectedConsumerUser} />}
      {tab === 'CONTESTATIONS' && <UserContestationsCard user={selectedConsumerUser} onToast={onToast} />}
      {tab === 'DRM' && <AuditorDrmLicensesCard user={selectedConsumerUser} />}
      {tab === 'LEDGER' && <AuditorTokenLedgerCard user={selectedConsumerUser} />}
      {tab === 'TRACKS' && (
        <UserListeningHistoryTable
          items={consumerAnalytics.byListenTime}
          onSelectTrack={onSelectTrack}
        />
      )}
    </div>
  );
};
