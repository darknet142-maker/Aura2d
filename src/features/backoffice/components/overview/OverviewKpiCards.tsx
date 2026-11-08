import React from 'react';
import { Users, Activity, Coins, DollarSign, TrendingUp } from 'lucide-react';
import type { AppUser, Track } from '../../../../shared/types/domain.types';

export interface OverviewKpiCardsProps {
  users: AppUser[];
  tracks: Track[];
  totalDistributedTokens: number;
  totalSponsorFunds: number;
}

export const OverviewKpiCards: React.FC<OverviewKpiCardsProps> = ({
  users, tracks, totalDistributedTokens, totalSponsorFunds,
}) => {
  const totalPlays = tracks.reduce((sum, t) => sum + (t.duration ? Math.round(t.duration * 1.5) : 340), 0);
  const organicPlays = Math.round(totalPlays * 0.88);
  const sponsoredPlays = totalPlays - organicPlays;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Auditeurs */}
      <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Auditeurs Actifs</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-mono font-extrabold text-[#F8FAFC]">
            {users.length.toLocaleString('fr-FR')}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold ml-2">▲ +8.4%</span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-[#A3A9BA]">
          <span>Pass Modèle A : 100%</span>
          <span className="text-emerald-300 font-bold">100% Jetons</span>
        </div>
      </div>

      {/* 2. Streams & Split */}
      <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Streams du Jour</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-mono font-extrabold text-[#F8FAFC]">
            {totalPlays.toLocaleString('fr-FR')}
          </span>
          <span className="text-[11px] text-cyan-400 font-mono font-bold ml-2">▲ +12.2%</span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
          <span className="text-emerald-400 font-bold">■ {organicPlays.toLocaleString('fr-FR')} Org. (88%)</span>
          <span className="text-amber-400 font-bold">■ {sponsoredPlays.toLocaleString('fr-FR')} Spon. (12%)</span>
        </div>
      </div>

      {/* 3. Jetons Partenaires */}
      <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Jetons Distribués</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-mono font-extrabold text-amber-400">
            {totalDistributedTokens.toLocaleString('fr-FR')}
          </span>
          <span className="text-[10.5px] text-[#A3A9BA] font-mono ml-2">JTN</span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-[#A3A9BA]">
          <span>Réserve labels :</span>
          <span className="text-white font-bold">{totalSponsorFunds.toLocaleString('fr-FR')} JTN</span>
        </div>
      </div>

      {/* 4. Trésorerie B2B 60/40 */}
      <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A3A9BA]">
          <span className="text-[11px] font-mono uppercase tracking-wider">Redevances Brutes</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-mono font-extrabold text-[#F8FAFC]">
            198 400 F
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold ml-2">60/40</span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
          <span className="text-emerald-400 font-bold">Master: 95 232 F</span>
          <span className="text-amber-400 font-bold">BUGADA: 23 808 F</span>
        </div>
      </div>
    </div>
  );
};

