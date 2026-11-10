import React from 'react';
import { History, Coins, Disc, ArrowRight } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';
import type { Track } from '../../../../shared/types/domain.types';
import { getLedgerHistory } from '../../../tokens';

export interface OverviewRecentActivityFeedProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  tracks?: Track[];
}

interface ActivityEvent {
  id: string;
  time: string;
  title: string;
  subtext: string;
  badge: string;
  badgeColor: string;
  space: AdminSpaceId;
  icon: React.ReactNode;
}

export const OverviewRecentActivityFeed: React.FC<OverviewRecentActivityFeedProps> = ({
  onNavigateToSpace,
  tracks = [],
}) => {
  const ledgerEntries = getLedgerHistory(10);
  const events: ActivityEvent[] = [];

  // 1. Transactions réelles du grand livre des jetons
  ledgerEntries.slice(0, 3).forEach((entry, idx) => {
    events.push({
      id: `led-${entry.idempotencyKey || idx}`,
      time: 'Récemment',
      title: entry.reason === 'MISSION_REWARD'
        ? `Distribution de jetons (+${entry.amountTokens} JTN)`
        : `Financement Sponsor (+${entry.amountTokens.toLocaleString('fr-FR')} JTN)`,
      subtext: entry.referenceNote || 'Opération comptabilisée dans le journal immuable',
      badge: 'Jetons',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      space: '04_PARTNERS',
      icon: <Coins className="w-3.5 h-3.5 text-amber-400" />,
    });
  });

  // 2. Pistes réelles publiées au catalogue
  tracks.slice(0, 3).forEach((t, idx) => {
    events.push({
      id: `tr-${t.id}-${idx}`,
      time: 'Catalogue',
      title: `Titre actif : « ${t.title} »`,
      subtext: `${t.artist} • Master -14.0 LUFS • ${t.category}`,
      badge: 'Catalogue',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      space: '01_CATALOGUE',
      icon: <Disc className="w-3.5 h-3.5 text-cyan-400" />,
    });
  });

  return (
    <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F8FAFC]">
              Activité Récente
            </h3>
          </div>
          <p className="text-[10px] font-mono text-[#A3A9BA]">
            Télémétrie en temps réel des diffusions, publications et transactions.
          </p>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold hidden sm:inline">
          Live Sync
        </span>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#07090E] border border-white/[0.05] text-center text-[#A3A9BA] text-xs font-mono">
            Aucune opération récente enregistrée • Télémétrie en direct active
          </div>
        ) : (
          events.slice(0, 4).map((ev) => (
            <div
              key={ev.id}
              onClick={() => onNavigateToSpace(ev.space)}
              className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.05] hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer group transition"
              title={`Ouvrir le module : ${ev.space}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0">
                  {ev.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#F8FAFC] truncate">{ev.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${ev.badgeColor}`}>
                      {ev.badge}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#A3A9BA] truncate mt-0.5">
                    {ev.subtext}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-right">
                <span className="text-[9.5px] font-mono text-[#A3A9BA]">{ev.time}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
