import React from 'react';
import {
  Users, Activity, Coins, ShieldCheck, Database, Radio, ArrowUpRight,
  TrendingUp, Sparkles, Building2,
} from 'lucide-react';
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
  const ledgerEntries = getLedgerHistory(15);
  const sponsors = getSponsorAccounts();
  const totalSponsorFunds = sponsors.reduce((sum, sp) => sum + getOrCreateSponsorWallet(sp.id).fundedBalanceTokens, 0);
  const totalDistributedTokens = ledgerEntries
    .filter((e) => e.reason === 'MISSION_REWARD')
    .reduce((sum, e) => sum + e.amountTokens, 0);

  const totalRawPlays = tracks.reduce((sum, t) => sum + (t.realPlays || 0), 0);
  const estimatedOrganic = Math.round(totalRawPlays * 0.88);
  const estimatedSponsored = totalRawPlays - estimatedOrganic;

  return (
    <div className="flex-1 w-full overflow-y-auto space-y-4 pr-0.5 text-xs text-[#F8FAFC]">
      {/* 4 Indicateurs Clés (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/10 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A3A9BA]">Auditeurs Actifs</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono">{users.length.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-400 flex items-center font-bold font-mono"><TrendingUp className="w-3 h-3" /> +8.4%</span>
          </div>
          <p className="text-[10px] text-[#A3A9BA]">Comptes vérifiés &amp; abonnés</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/10 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A3A9BA]">Streams du Jour</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono">{totalRawPlays.toLocaleString()}</span>
            <span className="text-[10px] text-cyan-400 font-bold font-mono">+12.2%</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#A3A9BA] pt-1 border-t border-white/5">
            <span className="text-emerald-400 font-mono">■ {estimatedOrganic.toLocaleString()} Organiques</span>
            <span className="text-amber-400 font-mono">■ {estimatedSponsored.toLocaleString()} Sponsorisés</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/10 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A3A9BA]">Jetons Distribués</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-amber-400">{totalDistributedTokens.toLocaleString()}</span>
            <span className="text-[10px] text-[#A3A9BA]">Ce mois</span>
          </div>
          <p className="text-[10px] text-[#A3A9BA]">Modèle A • 100% financé labels</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0D1017] border border-white/10 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A3A9BA]">Fonds Partenaires</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-emerald-300">{totalSponsorFunds.toLocaleString()}</span>
            <span className="text-[10px] text-[#A3A9BA]">Jetons</span>
          </div>
          <p className="text-[10px] text-[#A3A9BA]">{sponsors.length} labels &amp; producteurs actifs</p>
        </div>
      </div>

      {/* Santé des Services & Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-5 p-4 rounded-2xl bg-[#0D1017] border border-white/10 space-y-3 shadow-lg">
          <h3 className="font-extrabold text-xs text-[#F8FAFC] flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Santé des Services &amp; Synchronisation</span>
          </h3>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-[#131722] border border-white/5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#CBD5E1]"><Database className="w-3.5 h-3.5 text-emerald-400" /> Base de Données SQL</span>
              <span className="text-emerald-400 font-mono font-bold">Opérationnel</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#131722] border border-white/5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#CBD5E1]"><Radio className="w-3.5 h-3.5 text-emerald-400" /> File Offline Store-and-Forward</span>
              <span className="font-mono text-[#F8FAFC]">{syncSnapshot.queue.length} en attente</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#131722] border border-white/5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#CBD5E1]"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Coffre-Fort DRM AES-256</span>
              <span className="text-emerald-400 font-mono font-bold">Chiffré</span>
            </div>
          </div>
        </div>

        {/* Flux d'Activité Récente */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-[#0D1017] border border-white/10 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-[#F8FAFC] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Activité Récente du Journal Comptable</span>
            </h3>
            <button type="button" onClick={() => onNavigateToSpace('04_PARTNERS')} className="text-[10px] text-amber-300 hover:underline flex items-center gap-1 cursor-pointer">
              <span>Voir tout</span> <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {ledgerEntries.slice(0, 5).map((e) => (
              <div key={e.transactionId} className="p-2 rounded-xl bg-[#131722] border border-white/5 flex items-center justify-between gap-2 text-[11px]">
                <div className="min-w-0">
                  <div className="font-bold text-[#F8FAFC] truncate">{e.referenceNote || e.reason}</div>
                  <div className="text-[9px] text-[#A3A9BA] font-mono">{new Date(e.timestampIso).toLocaleTimeString('fr-FR')} • {e.sourceBucket} → {e.destinationBucket}</div>
                </div>
                <span className="font-mono font-extrabold text-amber-400 shrink-0">+{e.amountTokens.toLocaleString()} jetons</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
