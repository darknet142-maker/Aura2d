import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Server, Music, Award, Coins, ArrowRight } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewAlertsIncidentCenterProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  pendingSyncCount?: number;
}

export const OverviewAlertsIncidentCenter: React.FC<OverviewAlertsIncidentCenterProps> = ({
  onNavigateToSpace,
  pendingSyncCount = 3,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'WARNING' | 'SUCCESS'>('ALL');

  const alerts = [
    {
      id: 'sync-ops',
      label: 'Opérations de synchronisation',
      status: 'À vérifier',
      type: 'warning' as const,
      actionLabel: 'Inspecter la file',
      details: `${pendingSyncCount} écoutes store-and-forward en attente`,
      space: '07_INFRASTRUCTURE' as AdminSpaceId,
      icon: <RefreshCw className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'sec-incidents',
      label: 'Incidents de sécurité & DRM',
      status: 'Opérationnel',
      type: 'success' as const,
      actionLabel: 'Coffre-fort',
      details: '0 fuite détectée • Keystore AES-256 intègre',
      space: '08_SECURITY' as AdminSpaceId,
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'main-api',
      label: 'API principale & Latence Edge',
      status: 'Opérationnel (12 ms)',
      type: 'success' as const,
      actionLabel: 'Télémétrie',
      details: 'Cluster SQL Supabase actif • SLA 100.00%',
      space: '07_INFRASTRUCTURE' as AdminSpaceId,
      icon: <Server className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'audio-mastering',
      label: 'Conformité Master Audio (-14 LUFS)',
      status: 'À vérifier',
      type: 'warning' as const,
      actionLabel: 'Auditer',
      details: '2 masters audio analysés à calibrer en Studio',
      space: '02_STUDIO' as AdminSpaceId,
      icon: <Music className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'partner-campaigns',
      label: 'Campagnes & Jetons Partenaires',
      status: 'À vérifier',
      type: 'warning' as const,
      actionLabel: 'Arbitrer',
      details: '1 campagne de label en attente d’allocation',
      space: '04_PARTNERS' as AdminSpaceId,
      icon: <Coins className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'bugada-tax',
      label: 'Déclarations Droits BUGADA & DGI',
      status: 'Opérationnel',
      type: 'success' as const,
      actionLabel: 'Clôturer',
      details: 'Bordereau mensuel 12% prêt pour validation fiscale',
      space: '05_FINANCE' as AdminSpaceId,
      icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'anti-fraud-bursts',
      label: 'Plafonds Anti-Fraude & Vélocité',
      status: 'Opérationnel',
      type: 'success' as const,
      actionLabel: 'Auditer',
      details: 'Taux d’intégrité 99.8% • Zéro automate suspect',
      space: '03_LISTENERS' as AdminSpaceId,
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
  ];

  const filtered = filter === 'ALL' ? alerts : alerts.filter((a) => (filter === 'WARNING' ? a.type === 'warning' : a.type === 'success'));

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-[#F8FAFC]">
            Centre d&apos;Alertes Plateforme
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 tabular-nums">
            7 en attente
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#07090E] p-1 rounded-xl border border-white/10 text-[10px]">
          {(['ALL', 'WARNING', 'SUCCESS'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`px-2 py-0.5 rounded-lg cursor-pointer transition ${
                filter === mode ? 'bg-white/15 text-white font-bold' : 'text-[#A3A9BA] hover:text-white'
              }`}
            >
              {mode === 'ALL' ? 'Toutes (7)' : mode === 'WARNING' ? 'À vérifier (3)' : 'Opérationnel (4)'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
        {filtered.map((alt) => (
          <div
            key={alt.id}
            onClick={() => onNavigateToSpace(alt.space)}
            className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer group transition"
            title={`Ouvrir l'espace dédié : ${alt.space}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-white/[0.04] shrink-0 border border-white/[0.06]">
                {alt.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#F8FAFC] truncate">{alt.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 border ${
                      alt.type === 'warning'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {alt.status}
                  </span>
                </div>
                <p className="text-[10px] text-[#A3A9BA] truncate mt-0.5">{alt.details}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-[#A3A9BA] group-hover:text-emerald-400 transition-colors">
              <span className="text-[10px] hidden sm:inline">{alt.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
