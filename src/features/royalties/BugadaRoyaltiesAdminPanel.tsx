import React, { useState } from 'react';
import {
  TAX_STATUS_LABELS,
  type RightsHolderTaxStatus,
  type RoyaltySettings,
} from '../economics/economicConfig';
import { RIGHTS_ROLE_LABELS } from '../economics/rightsSplitEngine';
import {
  currentAccountingPeriod,
  formatFcfa,
  formatFcfaPrecise,
  formatPeriodLabel,
} from '../economics/formatters';
import {
  buildBugadaCrdCsv,
  buildPayoutLedgerCsv,
  downloadCsv,
} from '../economics/reportExport';
import type { RoyaltyLedger } from './royaltyLedger';
import type { ClosedPeriodRecord } from './royaltyLedgerStore';
import { FinancialSimulator36M } from './FinancialSimulator36M';
import { B2bHorecaBugadaPanel } from './B2bHorecaBugadaPanel';
import { TelecomCemacCompliancePanel } from './TelecomCemacCompliancePanel';

export interface BugadaRoyaltiesAdminPanelProps {
  ledger: RoyaltyLedger;
  settings: RoyaltySettings;
  closedPeriods: ClosedPeriodRecord[];
  onUpdateSettings: (patch: Partial<RoyaltySettings>) => void;
  onResetSettings: () => void;
  onChangeHolderTaxStatus: (holderName: string, status: RightsHolderTaxStatus) => void;
  onCloseAccountingPeriod: (period: string) => void;
  onSaveAndSyncAll?: (sectionLabel?: string) => void;
}

type RoyaltySubTab =
  | 'REPARTITION'
  | 'PAIE_DGI'
  | 'BUGADA_CRD'
  | 'B2B_HORECA'
  | 'SIMULATEUR_36M'
  | 'CONFORMITE_TELECOM';

export const BugadaRoyaltiesAdminPanel: React.FC<BugadaRoyaltiesAdminPanelProps> = ({
  ledger,
  settings,
  closedPeriods,
  onUpdateSettings,
  onResetSettings,
  onChangeHolderTaxStatus,
  onCloseAccountingPeriod,
  onSaveAndSyncAll,
}) => {
  const [subTab, setSubTab] = useState<RoyaltySubTab>('REPARTITION');
  const [period] = useState<string>(() => currentAccountingPeriod());
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const handleSaveRoyaltiesSection = (label: string) => {
    if (onSaveAndSyncAll) {
      onSaveAndSyncAll(label);
    }
    setStatusBanner(`✓ ${label} sauvegardé et synchronisé sur tous vos appareils.`);
  };

  const payableStatements = ledger.statements.filter((s) => s.status === 'PAYABLE');
  const carriedStatements = ledger.statements.filter((s) => s.status === 'CARRIED_OVER');
  const totalDirectNetPayable = payableStatements.reduce((s, st) => s + st.netPayable, 0);
  const totalCarriedOver = carriedStatements.reduce((s, st) => s + st.totalGross, 0);

  const handleExportPayoutCsv = () => {
    const csv = buildPayoutLedgerCsv(period, ledger.statements);
    downloadCsv(`DROP_Paie_Directe_DGI_${period}.csv`, csv);
    setStatusBanner(`Journal de paie directe & retenues BNC (${period}) exporté en CSV.`);
  };

  const handleExportBugadaCrd = () => {
    const csv = buildBugadaCrdCsv(period, ledger.rightsLines);
    downloadCsv(`DROP_BUGADA_CRD_ISRC_${period}.csv`, csv);
    setStatusBanner(`Bordereau numérique certifié BUGADA CRD/DDEX (${period}) exporté.`);
  };

  const handleCloseMonth = () => {
    onCloseAccountingPeriod(period);
    setStatusBanner(
      `Période ${formatPeriodLabel(period)} clôturée : virements Mobile Money initiés pour ${payableStatements.length} ayant(s) droit et report de ${formatFcfaPrecise(totalCarriedOver)} sous séquestre.`
    );
  };

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* BANDEAU INSTITUTIONNEL OFFICIEL : BUGADA × MINISTÈRE DE LA CULTURE */}
      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#0B1914] via-[#0E1118] to-[#1A140B] border border-emerald-500/35">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-bold">
              CONVENTION OFFICIELLE BUGADA × MINISTÈRE DE LA CULTURE
            </span>
            <span className="text-[10px] font-mono text-amber-300">
              Ordonnance n°0011/PR/2024 • Décret n°0282/PR/MCJSA
            </span>
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-[#F5F2EB] mt-1">
            Chambre de Compensation User-Centric (60% Ayants Droit : 48% Master Direct / 12% BUGADA)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                vatRegime: settings.vatRegime === 'FRANCHISE' ? 'ASSUJETTI' : 'FRANCHISE',
              })
            }
            className={`px-3 py-2 rounded-xl font-mono text-[10.5px] font-bold border text-center transition ${
              settings.vatRegime === 'ASSUJETTI'
                ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            Régime :{' '}
            {settings.vatRegime === 'FRANCHISE'
              ? 'Franchise TVA (0%)'
              : `Assujetti TVA 18%${settings.applyCssWithVat ? ' + CSS 1%' : ''}`}
          </button>
          <button
            type="button"
            onClick={onResetSettings}
            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10.5px] text-zinc-300 font-mono text-center transition"
          >
            Réinitialiser taux
          </button>
          <button
            type="button"
            onClick={() => handleSaveRoyaltiesSection('Paramètres Royalties & Fiscalité BUGADA/DGI')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-[11px] text-center shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            Sauvegarder &amp; Sync Cloud
          </button>
        </div>
      </div>

      {/* SOUS-ONGLETS DE NAVIGATION EN GRILLE SYMÉTRIQUE MULTI-AXES (2×3 MOBILE, 3×2 TABLETTE, 6×1 PC) */}
      <div
        role="tablist"
        aria-label="Sections Royalties et Modèle Financier"
        className="w-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 bg-[#0D1017] p-2 rounded-2xl border border-white/[0.08]"
      >
        {(
          [
            { id: 'REPARTITION', short: '1. Répartition 60/40', sub: 'User-Centric & Séquestre' },
            { id: 'PAIE_DGI', short: '2. Paie Master 48%', sub: `DGI & BNC (${ledger.statements.length})` },
            { id: 'BUGADA_CRD', short: '3. Bordereau BUGADA', sub: `Auteur 12% (${ledger.bugada.beneficiaries.length})` },
            { id: 'B2B_HORECA', short: '4. Offre Pro B2B', sub: 'Bars/Maquis × BUGADA' },
            { id: 'SIMULATEUR_36M', short: '5. Simulateur 36M', sub: 'Trésorerie & Point Mort' },
            { id: 'CONFORMITE_TELECOM', short: '6. Push STK & CEMAC', sub: 'Conformité & Roadmap' },
          ] as { id: RoyaltySubTab; short: string; sub: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={subTab === tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`p-2.5 rounded-xl text-left transition border flex flex-col justify-between ${
              subTab === tab.id
                ? 'bg-[#DE1B34] border-[#DE1B34] text-white shadow-md shadow-[#DE1B34]/25'
                : 'bg-[#07080C] border-white/[0.06] text-zinc-300 hover:text-white hover:border-white/20'
            }`}
          >
            <span className="text-[11px] font-extrabold leading-tight block">{tab.short}</span>
            <span
              className={`text-[9.5px] font-mono mt-0.5 block ${
                subTab === tab.id ? 'text-white/90' : 'text-zinc-500'
              }`}
            >
              {tab.sub}
            </span>
          </button>
        ))}
      </div>

      {statusBanner && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2 shrink-0"
        >
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-300 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* CONTENU DES SOUS-ONGLETS */}
      <div className="w-full space-y-3.5">
        {subTab === 'REPARTITION' && (
          <>
            {/* SYNTHÈSE DU CIRCUIT DE CANTONNEMENT EN 5 ÉTAPES */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="bg-[#07080C] border border-white/[0.08] rounded-xl p-3">
                <span className="text-[10px] font-mono text-zinc-400 block">1. Encaissements TTC</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white block mt-1">
                  {formatFcfaPrecise(ledger.total.grossTtc)}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Abos : {formatFcfa(ledger.subscriptions.grossTtc)} • Pub : {formatFcfa(ledger.ads.grossTtc)}
                </span>
              </div>

              <div className="bg-[#07080C] border border-white/[0.08] rounded-xl p-3">
                <span className="text-[10px] font-mono text-zinc-400 block">2. TVA (18%), CSS (1%) &amp; API</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-rose-300 block mt-1">
                  -{formatFcfaPrecise(ledger.total.indirectTaxes + ledger.total.paymentFees)}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Base nette : {formatFcfaPrecise(ledger.total.netBase)}
                </span>
              </div>

              <div className="bg-[#07080C] border border-emerald-500/30 rounded-xl p-3">
                <span className="text-[10px] font-mono text-emerald-400 block">3. Séquestre Royalties (60%)</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300 block mt-1">
                  {formatFcfaPrecise(ledger.total.rightsHoldersPool)}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Part Plateforme (40%) : {formatFcfaPrecise(ledger.total.platformShare)}
                </span>
              </div>

              <div className="bg-[#07080C] border border-amber-400/30 rounded-xl p-3">
                <span className="text-[10px] font-mono text-amber-300 block">4. Boucliers User-Centric</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-200 block mt-1">
                  Cap {settings.capPerStream} FCFA / stream
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Émergents : {formatFcfaPrecise(ledger.userCentric.emergingFund)} • Breakage :{' '}
                  {formatFcfaPrecise(ledger.userCentric.zeroStreamPool)}
                </span>
              </div>

              <div className="bg-[#07080C] border border-sky-400/30 rounded-xl p-3 col-span-2 lg:col-span-1">
                <span className="text-[10px] font-mono text-sky-300 block">5. Scission 48% / 12%</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white block mt-1">
                  Master : {formatFcfaPrecise(ledger.total.rightsHoldersPool * 0.8)}
                </span>
                <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                  BUGADA : {formatFcfaPrecise(ledger.bugada.totalAuthorship)}
                </span>
              </div>
            </div>

            {/* VENTILATION USER-CENTRIC PAR TITRE */}
            <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400">
                  Allocation User-Centric par Piste ({ledger.userCentric.allocations.length} titres actifs)
                </span>
                <span className="text-[10.5px] font-mono text-emerald-300">
                  Pondération hybride : 50% Écoutes (≥ 30s) + 50% Durée (plafonnée à 5 min)
                </span>
              </div>

              <div className="space-y-1.5">
                {ledger.userCentric.allocations.map((alloc) => (
                  <div
                    key={alloc.trackId}
                    className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10.5px] text-zinc-400 mr-2">{alloc.trackId}</span>
                      <span className="font-bold text-white">{alloc.validStreams} écoutes certifiées</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-300">Abos: {formatFcfaPrecise(alloc.fromSubscriptions)}</span>
                      <span className="text-amber-300">Pub: {formatFcfaPrecise(alloc.fromAdPool)}</span>
                      <span className="text-sky-300">
                        Émergents/Breakage: {formatFcfaPrecise(alloc.fromEmergingFund + alloc.fromZeroStreamPool)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Total : {formatFcfaPrecise(alloc.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {subTab === 'PAIE_DGI' && (
          <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                  Droits Voisins &amp; Master (48 % du Net Streaming) • Seuil {formatFcfa(settings.payoutThreshold)}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
                  Paie Directe Mobile Money &amp; Précompte BNC DGI ({formatFcfaPrecise(ledger.withholdingDue)} retenus)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveRoyaltiesSection('Statuts fiscaux DGI (BNC / NIF / IS)')}
                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#07080C] text-xs font-extrabold transition cursor-pointer"
                >
                  Sauvegarder Statuts Fiscaux DGI
                </button>
                <button
                  type="button"
                  onClick={handleExportPayoutCsv}
                  className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-bold text-white transition"
                >
                  Exporter Journal Paie &amp; DGI (.CSV)
                </button>
                <button
                  type="button"
                  onClick={handleCloseMonth}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] text-xs font-extrabold transition"
                >
                  Clôturer {period} &amp; Payer ({formatFcfaPrecise(totalDirectNetPayable)})
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {ledger.statements.map((st) => (
                <div
                  key={st.holderName}
                  className="p-3 rounded-xl bg-[#0D1017] border border-white/[0.07] flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{st.holderName}</span>
                      {st.roles.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-mono text-[10px]"
                        >
                          {RIGHTS_ROLE_LABELS[r]}
                        </span>
                      ))}
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          st.status === 'PAYABLE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-400/15 text-amber-300'
                        }`}
                      >
                        {st.status === 'PAYABLE' ? 'À PAYER (Mobile Money)' : 'REPORTÉ (< 5 000 FCFA)'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={st.taxStatus}
                        onChange={(e) =>
                          onChangeHolderTaxStatus(st.holderName, e.target.value as RightsHolderTaxStatus)
                        }
                        className="bg-[#07080C] border border-white/15 rounded-lg px-2 py-1 text-[10.5px] text-zinc-200 font-mono"
                      >
                        {(Object.keys(TAX_STATUS_LABELS) as RightsHolderTaxStatus[]).map((statusKey) => (
                          <option key={statusKey} value={statusKey}>
                            {TAX_STATUS_LABELS[statusKey]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                    <span className="text-zinc-400">
                      Brut : <strong className="text-white">{formatFcfaPrecise(st.totalGross)}</strong>
                    </span>
                    <span className="text-rose-300">
                      BNC/RAS : -{formatFcfaPrecise(st.withholding)}
                    </span>
                    <span className="text-amber-300">
                      Frais Payout (1%) : -{formatFcfaPrecise(st.disbursementFee)}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/35 text-emerald-200 font-bold">
                      Net : {formatFcfaPrecise(st.netPayable)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'BUGADA_CRD' && (
          <div className="bg-[#07080C] border border-amber-400/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                  Droits d&apos;Auteur &amp; Édition Musicale (12 % du Net Streaming = 20 % des Royalties)
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
                  Bordereau Officiel BUGADA (Auteurs / Paroliers &amp; Compositeurs / Beatmakers) —{' '}
                  {formatFcfaPrecise(ledger.bugada.totalAuthorship)}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleExportBugadaCrd}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#07080C] text-xs font-extrabold transition"
              >
                Exporter Bordereau Certifié DDEX / CRD (.CSV)
              </button>
            </div>

            <div className="space-y-1.5">
              {ledger.bugada.beneficiaries.map((b) => (
                <div
                  key={b.holderName}
                  className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{b.holderName}</span>
                    {b.roles.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono text-[10px]"
                      >
                        {RIGHTS_ROLE_LABELS[r]}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono font-bold text-amber-300">
                    {formatFcfaPrecise(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'B2B_HORECA' && (
          <B2bHorecaBugadaPanel onSaveAndSyncAll={onSaveAndSyncAll} />
        )}

        {subTab === 'SIMULATEUR_36M' && (
          <FinancialSimulator36M
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onSaveAndSyncAll={onSaveAndSyncAll}
          />
        )}

        {subTab === 'CONFORMITE_TELECOM' && <TelecomCemacCompliancePanel />}
      </div>
    </div>
  );
};

