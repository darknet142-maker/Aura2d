import React from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Server, Music, ArrowRight } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewAlertsCenterProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  pendingSyncCount?: number;
}

export const OverviewAlertsCenter: React.FC<OverviewAlertsCenterProps> = ({
  onNavigateToSpace,
  pendingSyncCount = 3,
}) => {
  const alerts = [
    {
      id: 'sync-ops',
      label: 'Opérations de synchronisation',
      status: 'À vérifier',
      statusType: 'warning' as const,
      details: `${pendingSyncCount} écoutes store-and-forward en file d'attente mobile`,
      space: '07_INFRASTRUCTURE' as AdminSpaceId,
      icon: <RefreshCw className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'sec-incidents',
      label: 'Incidents de sécurité',
      status: 'Opérationnel',
      statusType: 'success' as const,
      details: '0 incident détecté • DRM AES-256 actif • Anti-tamper intègre',
      space: '08_SECURITY' as AdminSpaceId,
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'main-api',
      label: 'API principale',
      status: 'Opérationnel (12 ms)',
      statusType: 'success' as const,
      details: 'Passerelle Edge & cluster SQL • Disponibilité 100.00%',
      space: '07_INFRASTRUCTURE' as AdminSpaceId,
      icon: <Server className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'audio-mastering',
      label: 'Conformité Master Audio',
      status: '4 à normaliser',
      statusType: 'warning' as const,
      details: 'Dépassement Loudness cible -14.0 LUFS EBU R128 détecté',
      space: '02_STUDIO' as AdminSpaceId,
      icon: <Music className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
            Centre d&apos;Alertes
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          7 en attente
        </span>
      </div>

      <div className="space-y-2">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            onClick={() => onNavigateToSpace(alt.space)}
            className="p-3 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer group transition"
            title={`Ouvrir l'espace dédié : ${alt.space}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-white/[0.04] shrink-0 border border-white/[0.06]">
                {alt.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#F8FAFC] truncate">{alt.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold shrink-0 ${
                      alt.statusType === 'warning'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {alt.status}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[#A3A9BA] truncate mt-0.5">
                  {alt.details}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-[#A3A9BA] group-hover:text-white">
              <span className="text-[10px] font-mono hidden sm:inline">Inspecter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

