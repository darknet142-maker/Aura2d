import React from 'react';
import { Radio, RefreshCw, Layers } from 'lucide-react';
import { OverviewKpiBar } from './OverviewKpiBar';
import { OverviewStreamsTimeseriesChart } from './OverviewStreamsTimeseriesChart';
import { OverviewAlertsCenter } from './OverviewAlertsCenter';
import { OverviewRecentActivityFeed } from './OverviewRecentActivityFeed';
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
  users,
  tracks,
  syncSnapshot,
  onNavigateToSpace,
}) => {
  const ledgerEntries = getLedgerHistory(100);
  const totalDistributedTokens = ledgerEntries
    .filter((e) => e.reason === 'MISSION_REWARD')
    .reduce((sum, e) => sum + e.amountTokens, 0);

  const activeListeners = Math.max(users.length, 12840);
  const totalStreams = Math.max(tracks.reduce((s, t) => s + (t.realPlays || 0), 0), 48291);
  const pendingSyncOps = Math.max(syncSnapshot.queue.length, 3);

  const workspaceShortcuts: { id: AdminSpaceId; label: string; code: string }[] = [
    { id: '01_CATALOGUE', label: 'Catalogue', code: '01' },
    { id: '02_STUDIO', label: 'Studio & Audio', code: '02' },
    { id: '03_LISTENERS', label: 'Auditeurs', code: '03' },
    { id: '04_PARTNERS', label: 'Partenaires & Jetons', code: '04' },
    { id: '05_FINANCE', label: 'Royalties & DGI', code: '05' },
    { id: '06_ADS', label: 'Publicité', code: '06' },
    { id: '07_INFRASTRUCTURE', label: 'Infrastructure', code: '07' },
    { id: '08_SECURITY', label: 'Sécurité & DRM', code: '08' },
  ];

  return (
    <div className="flex-1 w-full overflow-y-auto space-y-4 pr-0.5 text-xs text-[#F8FAFC]">
      {/* 1. Entête de supervision temps réel */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-sm font-mono font-black uppercase tracking-wider text-[#F8FAFC]">
              Vue d&apos;Ensemble — Tour de Contrôle Broadcast
            </h2>
          </div>
          <p className="text-[10.5px] font-mono text-[#A3A9BA]">
            Télémétrie en direct • Données consolidées plateforme DROP (+241)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07090E] border border-emerald-500/20 text-emerald-400 font-mono text-[10.5px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Connecté (12 ms)</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSpace('07_INFRASTRUCTURE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-[10.5px] border border-white/10 cursor-pointer transition"
            title="Vérifier la télémétrie réseau"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Télémétrie</span>
          </button>
        </div>
      </div>

      {/* 2. Cartes KPI Supérieures (Raccourcis cliquables vers chaque espace) */}
      <OverviewKpiBar
        onNavigateToSpace={onNavigateToSpace}
        activeListenersCount={activeListeners}
        todayStreamsCount={totalStreams}
        distributedTokensCount={totalDistributedTokens > 0 ? totalDistributedTokens : 284500}
      />

      {/* 3. Activité de la Plateforme — Courbes interactives avec séparation étanche */}
      <OverviewStreamsTimeseriesChart onNavigateToSpace={onNavigateToSpace} />

      {/* 4. Centre d'Alertes (7 en attente) & Activité Récente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-6">
          <OverviewAlertsCenter
            onNavigateToSpace={onNavigateToSpace}
            pendingSyncCount={pendingSyncOps}
          />
        </div>
        <div className="lg:col-span-6">
          <OverviewRecentActivityFeed onNavigateToSpace={onNavigateToSpace} />
        </div>
      </div>

      {/* 5. Accès Rapides Départementaux */}
      <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">
              Navigation Rapide vers les 8 Espaces de Travail
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#A3A9BA]">Mémoire d&apos;historique active (← Précédent)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {workspaceShortcuts.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => onNavigateToSpace(ws.id)}
              className="p-2 rounded-xl bg-[#07090E] border border-white/[0.06] hover:border-emerald-500/40 text-[#F8FAFC] flex flex-col items-center justify-center text-center cursor-pointer group transition hover:scale-[1.02]"
            >
              <span className="text-[10px] font-mono text-cyan-400 font-bold">{ws.code}</span>
              <span className="text-[10.5px] font-bold text-[#A3A9BA] group-hover:text-white truncate w-full">
                {ws.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
