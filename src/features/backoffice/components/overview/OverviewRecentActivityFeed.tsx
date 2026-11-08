import React from 'react';
import { History, Coins, Disc, UserCheck, FileText, ArrowRight } from 'lucide-react';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewRecentActivityFeedProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
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
}) => {
  const events: ActivityEvent[] = [
    {
      id: 'act-1',
      time: 'Il y a 4 min',
      title: 'Distribution de jetons • Campagne Airtel Money',
      subtext: '+50 JTN alloués à l\'auditeur aud_042 après écoute sponsorisée 45s',
      badge: 'Jetons',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      space: '04_PARTNERS',
      icon: <Coins className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'act-2',
      time: 'Il y a 18 min',
      title: 'Validation Master Audio • Single "Wenge Boma"',
      subtext: 'Conformité -14.0 LUFS EBU R128 validée. Mis en ligne au catalogue.',
      badge: 'Catalogue',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      space: '01_CATALOGUE',
      icon: <Disc className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      id: 'act-3',
      time: 'Il y a 32 min',
      title: 'Pass Mensuel Débloqué (100% Jetons)',
      subtext: 'Auditeur #1284 a échangé 200 JTN contre un Pass Illimité 30 jours',
      badge: 'Auditeurs',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      space: '03_LISTENERS',
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'act-4',
      time: 'Il y a 1h 10',
      title: 'Bordereau Fiscal BUGADA 12% & DGI',
      subtext: 'Calcul arrêté mensuel effectué sur le pool organique (Retenue 9.5%)',
      badge: 'Finance',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      space: '05_FINANCE',
      icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,
    },
  ];

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
            Dernières modifications, distributions de jetons, publications et opérations.
          </p>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold hidden sm:inline">
          Live Sync
        </span>
      </div>

      <div className="space-y-2">
        {events.map((ev) => (
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
        ))}
      </div>
    </div>
  );
};
