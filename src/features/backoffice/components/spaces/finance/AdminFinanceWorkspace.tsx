import React, { useState } from 'react';
import { RoyaltyStackedChartCard } from './RoyaltyStackedChartCard';
import { StoresBreakdownCard } from './StoresBreakdownCard';
import { EntityFinancialExplorer } from './EntityFinancialExplorer';
import { AdminSubscriptionsManager } from './AdminSubscriptionsManager';
import { AdminDataRoomWorkspace } from '../investors/AdminDataRoomWorkspace';
import { CemacExpansionMatrixCard } from '../investors/CemacExpansionMatrixCard';
import { StoreComplianceStrategyCard } from '../investors/StoreComplianceStrategyCard';
import { BugadaRoyaltiesAdminPanel } from '../../../../royalties/BugadaRoyaltiesAdminPanel';
import type { ReturnTypeUseDropPlatformController } from '../../../../listener/hooks/useDropPlatformController';
import type { StatsBaseline } from '../../../../royalties/royaltyLedgerStore';
import { DollarSign, UserCheck, ShieldCheck, Award, Presentation, Globe2 } from 'lucide-react';

export interface AdminFinanceWorkspaceProps {
  ctrl: ReturnTypeUseDropPlatformController;
  onSelectTrack?: (trackId: string) => void;
}

export const AdminFinanceWorkspace: React.FC<AdminFinanceWorkspaceProps> = ({ ctrl, onSelectTrack }) => {
  const [activeTab, setActiveTab] = useState<
    'ANALYTICS' | 'INDIVIDUAL' | 'SUBSCRIPTIONS' | 'DATA_ROOM' | 'BUGADA_PANEL' | 'CEMAC_STORES'
  >('ANALYTICS');

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0D1017] border border-white/10 text-xs flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
              activeTab === 'ANALYTICS' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Vue d&apos;Ensemble &amp; Canaux
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
              activeTab === 'INDIVIDUAL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Suivi Individuel (Artiste/Label/Projet)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
              activeTab === 'SUBSCRIPTIONS' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Gestion des Abonnements
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DATA_ROOM')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'DATA_ROOM' ? 'bg-amber-400 text-[#080A0F] font-black' : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Data Room &amp; Investisseurs (75k€)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BUGADA_PANEL')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
              activeTab === 'BUGADA_PANEL' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            Clôture BUGADA 12% &amp; Fisc DGI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CEMAC_STORES')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'CEMAC_STORES' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Expansion CEMAC &amp; Stores</span>
          </button>
        </div>
      </div>

      {activeTab === 'ANALYTICS' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <RoyaltyStackedChartCard />
            </div>
            <div className="lg:col-span-5">
              <StoresBreakdownCard />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Total Généré</span>
              <span className="text-sm font-mono font-extrabold text-[#F8FAFC]">198 400 F</span>
              <span className="text-[9.5px] font-mono text-emerald-400 block mt-0.5">▲ +240% MoM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Airtel Money</span>
              <span className="text-sm font-mono font-extrabold text-emerald-400">122 500 F</span>
              <span className="text-[9.5px] font-mono text-emerald-400 block mt-0.5">▲ +223%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Moov Money</span>
              <span className="text-sm font-mono font-extrabold text-red-400">48 900 F</span>
              <span className="text-[9.5px] font-mono text-emerald-400 block mt-0.5">▲ +198%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Sponsors JTN</span>
              <span className="text-sm font-mono font-extrabold text-amber-300">19 300 F</span>
              <span className="text-[9.5px] font-mono text-emerald-400 block mt-0.5">▲ +143%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">BUGADA 12%</span>
              <span className="text-sm font-mono font-extrabold text-amber-400">23 808 F</span>
              <span className="text-[9.5px] font-mono text-emerald-400 block mt-0.5">Reversé DGI</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-[#A3A9BA] block">Master 48%</span>
              <span className="text-sm font-mono font-extrabold text-emerald-300">95 232 F</span>
              <span className="text-[9.5px] font-mono text-emerald-400 block mt-0.5">Ayants-droit</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'INDIVIDUAL' && (
        <EntityFinancialExplorer
          tracks={ctrl.allTracksFlat}
          onSelectTrack={(tid: string) => {
            if (onSelectTrack) onSelectTrack(tid);
            else ctrl.setSelectedTrackId(tid);
          }}
          onToast={(msg) => ctrl.pushNotification('Royalties & Finance', msg, 'DATABASE')}
        />
      )}

      {activeTab === 'SUBSCRIPTIONS' && (
        <AdminSubscriptionsManager
          users={ctrl.users}
          onToast={(msg) => ctrl.pushNotification('Gestion Abonnements', msg, 'DATABASE')}
        />
      )}

      {activeTab === 'DATA_ROOM' && <AdminDataRoomWorkspace />}

      {activeTab === 'CEMAC_STORES' && (
        <div className="space-y-4">
          <CemacExpansionMatrixCard />
          <StoreComplianceStrategyCard />
        </div>
      )}

      {activeTab === 'BUGADA_PANEL' && (
        <BugadaRoyaltiesAdminPanel
          ledger={ctrl.royaltyLedger}
          settings={ctrl.royaltyLedgerState.settings}
          closedPeriods={ctrl.royaltyLedgerState.closedPeriods}
          onUpdateSettings={ctrl.updateRoyaltySettings}
          onResetSettings={ctrl.resetRoyaltySettings}
          onChangeHolderTaxStatus={ctrl.setHolderTaxStatus}
          onSaveAndSyncAll={ctrl.handleSaveAndSyncAllAdmin}
          tracks={ctrl.allTracksFlat}
          onCloseAccountingPeriod={(period: string) => {
            const currentStats: StatsBaseline = {};
            ctrl.users.forEach((u: any) => {
              currentStats[u.id] = {};
              Object.values(u.trackStats).forEach((st: any) => {
                currentStats[u.id][st.trackId] = { plays: st.playsCount, seconds: st.listenSeconds };
              });
            });
            ctrl.closeRoyaltyPeriod({ period, statements: ctrl.royaltyLedger.statements, bugadaTotal: ctrl.royaltyLedger.bugada.totalAuthorship, currentStats });
            ctrl.pushNotification(`Clôture BUGADA & Paie (${period})`, 'Bordereau BUGADA 12% validé et paiements directs Master 48% ordonnancés.', 'CERTIFICATION');
          }}
        />
      )}
    </div>
  );
};
