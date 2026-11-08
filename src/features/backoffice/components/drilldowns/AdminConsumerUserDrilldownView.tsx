import React, { useState } from 'react';
import { ChevronLeft, Clock, Play, ShieldCheck, User, Smartphone, Coins, Lock, Disc3 } from 'lucide-react';
import { UserSubscriptionPassCard } from './user/UserSubscriptionPassCard';
import { UserTokenWalletCard } from './user/UserTokenWalletCard';
import { UserOfflineDrmCard } from './user/UserOfflineDrmCard';
import { AuditorDevicesTable } from './user/AuditorDevicesTable';
import { AuditorTokenLedgerCard } from './user/AuditorTokenLedgerCard';
import { AuditorDrmLicensesCard } from './user/AuditorDrmLicensesCard';
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
  const [tab, setTab] = useState<'SYNTHESE' | 'DEVICES' | 'DRM' | 'LEDGER' | 'TRACKS'>('SYNTHESE');

  const formatLongDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const rank = [...users]
    .sort((a, b) => b.totalListenSeconds - a.totalListenSeconds)
    .findIndex((u) => u.id === selectedConsumerUser.id) + 1;

  return (
    <div className="flex-1 w-full flex flex-col bg-[#080A0F] border border-white/[0.08] rounded-2xl p-4 overflow-y-auto gap-4 font-mono">
      {/* 1. Header Navigation & Titre */}
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

      {/* 2. Onglets de Navigation Auditeur 360° */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0D1017] border border-white/10 w-fit text-xs">
        <button
          type="button"
          onClick={() => setTab('SYNTHESE')}
          className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
            tab === 'SYNTHESE' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Synthèse
        </button>
        <button
          type="button"
          onClick={() => setTab('DEVICES')}
          className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
            tab === 'DEVICES' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Appareils &amp; Sessions
        </button>
        <button
          type="button"
          onClick={() => setTab('DRM')}
          className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
            tab === 'DRM' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Coffre-fort DRM
        </button>
        <button
          type="button"
          onClick={() => setTab('LEDGER')}
          className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
            tab === 'LEDGER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Grand Livre Jetons
        </button>
        <button
          type="button"
          onClick={() => setTab('TRACKS')}
          className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
            tab === 'TRACKS' ? 'bg-white/15 text-white' : 'text-[#A3A9BA] hover:text-white'
          }`}
        >
          Écoutes ECG ({consumerAnalytics.byListenTime.length})
        </button>
      </div>

      {/* 3. Contenu de l'onglet actif */}
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

      {tab === 'DEVICES' && <AuditorDevicesTable user={selectedConsumerUser} />}
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
