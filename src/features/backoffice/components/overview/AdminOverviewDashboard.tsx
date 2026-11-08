import React from 'react';
import { OverviewKpiCards } from './OverviewKpiCards';
import { OverviewAlertsAndServices } from './OverviewAlertsAndServices';
import { OverviewAuditTicker } from './OverviewAuditTicker';
import { getLedgerHistory, getSponsorAccounts, getOrCreateSponsorWallet } from '../../../tokens';
import type { AppUser, Track } from '../../../../shared/types/domain.types';
import type { SyncStatusSnapshot } from '../../../../services/offlineStreamTracker';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface AdminOverviewDashboardProps {
  users: AppUser[];
  tracks: Track[];
  syncSnapshot: SyncStatusSnapshot;
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
}

export const AdminOverviewDashboard: React.FC<AdminOverviewDashboardProps> = ({
  users, tracks, syncSnapshot, onNavigateToSpace,
}) => {
  const ledgerEntries = getLedgerHistory(20);
  const sponsors = getSponsorAccounts();
  const totalSponsorFunds = sponsors.reduce(
    (sum, sp) => sum + getOrCreateSponsorWallet(sp.id).fundedBalanceTokens,
    0
  );
  const totalDistributedTokens = ledgerEntries
    .filter((e) => e.reason === 'MISSION_REWARD')
    .reduce((sum, e) => sum + e.amountTokens, 0);

  return (
    <div className="flex-1 w-full overflow-y-auto space-y-4 pr-0.5 text-xs text-[#F8FAFC]">
      {/* 1. Barres de KPI Haute Densité */}
      <OverviewKpiCards
        users={users}
        tracks={tracks}
        totalDistributedTokens={totalDistributedTokens}
        totalSponsorFunds={totalSponsorFunds}
      />

      {/* 2. Supervision Réseau & Alertes Stratégiques */}
      <OverviewAlertsAndServices
        syncSnapshot={syncSnapshot}
        onNavigateToSpace={onNavigateToSpace}
      />

      {/* 3. Télémétrie Live & Accès Rapides */}
      <OverviewAuditTicker
        ledgerEntries={ledgerEntries}
        onNavigateToSpace={onNavigateToSpace}
      />
    </div>
  );
};
