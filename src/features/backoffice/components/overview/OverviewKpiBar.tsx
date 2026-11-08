import React from 'react';
import { Users, Activity, Coins, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../../shared/ui/springMotion';
import type { AdminSpaceId } from '../../types/admin-spaces.types';

export interface OverviewKpiBarProps {
  onNavigateToSpace: (spaceId: AdminSpaceId) => void;
  activeListenersCount?: number;
  todayStreamsCount?: number;
  distributedTokensCount?: number;
}

export const OverviewKpiBar: React.FC<OverviewKpiBarProps> = ({
  onNavigateToSpace,
  activeListenersCount = 12840,
  todayStreamsCount = 48291,
  distributedTokensCount = 284500,
}) => {
  const organicStreams = Math.round(todayStreamsCount * 0.88);
  const sponsoredStreams = todayStreamsCount - organicStreams;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Auditeurs Actifs -> 03_LISTENERS */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={SPRING_SNAPPY}
        onClick={() => onNavigateToSpace('03_LISTENERS')}
        className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-emerald-500/40 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between cursor-pointer group transition-colors"
        title="Ouvrir l'annuaire des auditeurs et des abonnements"
      >
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Auditeurs Actifs</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-black text-[#F8FAFC]">
            {activeListenersCount.toLocaleString('fr-FR')}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" /> +8,4 %
          </span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10.5px] font-mono text-[#A3A9BA]">
          <span className="text-emerald-400 font-bold">100% Jetons (Modèle A)</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white" />
        </div>
      </motion.div>

      {/* 2. Streams du Jour -> 01_CATALOGUE */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={SPRING_SNAPPY}
        onClick={() => onNavigateToSpace('01_CATALOGUE')}
        className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-cyan-500/40 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between cursor-pointer group transition-colors"
        title="Ouvrir le catalogue musical et les rangs d'écoutes"
      >
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Streams du Jour</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-black text-[#F8FAFC]">
            {todayStreamsCount.toLocaleString('fr-FR')}
          </span>
          <span className="text-[11px] text-cyan-400 font-mono font-bold">+12,2 %</span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
          <span className="text-emerald-400 font-bold">■ {organicStreams.toLocaleString('fr-FR')} Org.</span>
          <span className="text-amber-400 font-bold">■ {sponsoredStreams.toLocaleString('fr-FR')} Spon.</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white" />
        </div>
      </motion.div>

      {/* 3. Jetons Distribués -> 04_PARTNERS */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={SPRING_SNAPPY}
        onClick={() => onNavigateToSpace('04_PARTNERS')}
        className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-amber-400/40 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between cursor-pointer group transition-colors"
        title="Ouvrir l'espace partenaires, sponsors et budgets de campagnes"
      >
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Jetons Distribués</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-black text-amber-400">
            {distributedTokensCount.toLocaleString('fr-FR')}
          </span>
          <span className="text-[10.5px] font-mono text-[#A3A9BA]">Ce mois-ci</span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10.5px] font-mono text-[#A3A9BA]">
          <span>Financé 100% labels</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white" />
        </div>
      </motion.div>

      {/* 4. Revenus & Royalties -> 05_FINANCE */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={SPRING_SNAPPY}
        onClick={() => onNavigateToSpace('05_FINANCE')}
        className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-emerald-500/40 shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between cursor-pointer group transition-colors"
        title="Ouvrir la gestion des redevances, B2B 60/40 et bordereaux fiscaux DGI"
      >
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Revenus Sponsors &amp; Droits</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-black text-[#F8FAFC]">
            198 400 F
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">Modèle 60/40</span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10.5px] font-mono">
          <span className="text-emerald-400 font-bold">Master: 48% • BUGADA: 12%</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#A3A9BA] group-hover:text-white" />
        </div>
      </motion.div>
    </div>
  );
};
