import React from 'react';
import { Users, Activity, Coins, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../shared/ui/springMotion';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewTelemetryKpiBarProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  activeListenersCount?: number;
  todayStreamsCount?: number;
  distributedTokensCount?: number;
}

export const OverviewTelemetryKpiBar: React.FC<OverviewTelemetryKpiBarProps> = ({
  onNavigateToSpace,
  activeListenersCount = 12840,
  todayStreamsCount = 48291,
  distributedTokensCount = 284500,
}) => {
  const organicStreams = Math.round(todayStreamsCount * 0.88);
  const sponsoredStreams = todayStreamsCount - organicStreams;

  const kpis = [
    {
      id: 'listeners',
      spaceId: '03_LISTENERS' as AdminSpaceId,
      label: 'Auditeurs Actifs',
      value: activeListenersCount.toLocaleString('fr-FR'),
      delta: '+8,4 %',
      deltaColor: 'text-emerald-400',
      footerLabel: 'Modèle A : 100% Jetons',
      footerHighlight: '0 F Sortant',
      icon: <Users className="w-4 h-4 text-[#A3A9BA]" />,
    },
    {
      id: 'streams',
      spaceId: '01_CATALOGUE' as AdminSpaceId,
      label: 'Streams du Jour',
      value: todayStreamsCount.toLocaleString('fr-FR'),
      delta: '+12,2 %',
      deltaColor: 'text-emerald-400',
      footerLabel: `${organicStreams.toLocaleString('fr-FR')} Org.`,
      footerHighlight: `${sponsoredStreams.toLocaleString('fr-FR')} Spon.`,
      icon: <Activity className="w-4 h-4 text-[#A3A9BA]" />,
    },
    {
      id: 'tokens',
      spaceId: '04_PARTNERS' as AdminSpaceId,
      label: 'Jetons Distribués',
      value: distributedTokensCount.toLocaleString('fr-FR'),
      delta: 'Ce mois-ci',
      deltaColor: 'text-amber-400',
      footerLabel: 'Budget Partenaires',
      footerHighlight: '100% Sponsorisé',
      icon: <Coins className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'finance',
      spaceId: '05_FINANCE' as AdminSpaceId,
      label: 'Pool BUGADA & DGI',
      value: `${(Math.round(organicStreams * 1.5)).toLocaleString('fr-FR')} FCFA`,
      delta: '9.5% Retenue',
      deltaColor: 'text-[#A3A9BA]',
      footerLabel: 'Streams Sponsorisés',
      footerHighlight: 'Exclus Droits Auteur',
      icon: <DollarSign className="w-4 h-4 text-[#A3A9BA]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {kpis.map((kpi) => (
        <motion.div
          key={kpi.id}
          whileHover={{ y: -2 }}
          transition={SPRING_SNAPPY}
          onClick={() => onNavigateToSpace(kpi.spaceId)}
          className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-white/20 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between cursor-pointer group transition-colors"
          title={`Accéder à l'espace : ${kpi.spaceId}`}
        >
          <div className="flex items-center justify-between text-[#A3A9BA]">
            <span className="text-[11px] font-mono uppercase tracking-wider">{kpi.label}</span>
            <div className="p-1.5 rounded-lg border border-white/10 bg-white/5">
              {kpi.icon}
            </div>
          </div>
          <div className="my-2.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-mono font-black text-[#F8FAFC] tabular-nums">
              {kpi.value}
            </span>
            <span className={`text-[11px] font-mono font-bold flex items-center tabular-nums ${kpi.deltaColor}`}>
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {kpi.delta}
            </span>
          </div>
          <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10.5px] font-mono">
            <span className="text-[#A3A9BA] truncate">{kpi.footerLabel}</span>
            <div className="flex items-center gap-1">
              <span className="text-white/80 font-semibold truncate">{kpi.footerHighlight}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white shrink-0" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

