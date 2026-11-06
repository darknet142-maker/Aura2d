import React, { useState, useMemo } from 'react';
import {
  CENTRAL_SCENARIO,
  FUNDING_NEED,
  simulateScenario,
  type ProjectionYear,
  type ScenarioInput,
} from '../economics/breakEvenEngine';
import { priceTtcForTargetHt, computeNetBase } from '../economics/fiscalEngine';
import { buildCentral36MonthSchedule } from '../economics/monthlyTreasury36M';
import type { RoyaltySettings } from '../economics/economicConfig';
import { formatFcfa, formatFcfaPrecise, formatInteger } from '../economics/formatters';

export interface FinancialSimulator36MProps {
  settings: RoyaltySettings;
  onUpdateSettings: (patch: Partial<RoyaltySettings>) => void;
}

type ScenarioPresetKey = 'PRUDENT' | 'CENTRAL' | 'AMBITIEUX';

const SCENARIO_PRESETS: Record<ScenarioPresetKey, Record<ProjectionYear, ScenarioInput>> = {
  PRUDENT: {
    1: {
      payingSubscribers: 400,
      freeUsers: 6000,
      priceTtc: 1500,
      vatRegime: 'FRANCHISE',
      monthlyOpex: 1_460_000,
      adFillRate: 0.25,
      sponsoringMonthlyHt: 0,
      tipsMonthlyVolume: 100_000,
      vatOnTipCommission: true,
    },
    2: {
      payingSubscribers: 1200,
      freeUsers: 25_000,
      priceTtc: 1500,
      vatRegime: 'FRANCHISE',
      monthlyOpex: 1_870_000,
      adFillRate: 0.25,
      sponsoringMonthlyHt: 100_000,
      tipsMonthlyVolume: 300_000,
      vatOnTipCommission: true,
    },
    3: {
      payingSubscribers: 3200,
      freeUsers: 65_000,
      priceTtc: 1500,
      vatRegime: 'ASSUJETTI',
      monthlyOpex: 2_550_000,
      adFillRate: 0.3,
      sponsoringMonthlyHt: 250_000,
      tipsMonthlyVolume: 800_000,
      vatOnTipCommission: true,
    },
  },
  CENTRAL: CENTRAL_SCENARIO,
  AMBITIEUX: {
    1: {
      payingSubscribers: 1200,
      freeUsers: 18_000,
      priceTtc: 1500,
      vatRegime: 'FRANCHISE',
      monthlyOpex: 2_100_000,
      adFillRate: 0.4,
      sponsoringMonthlyHt: 150_000,
      tipsMonthlyVolume: 400_000,
      vatOnTipCommission: true,
    },
    2: {
      payingSubscribers: 4000,
      freeUsers: 70_000,
      priceTtc: 1500,
      vatRegime: 'ASSUJETTI',
      monthlyOpex: 3_300_000,
      adFillRate: 0.5,
      sponsoringMonthlyHt: 400_000,
      tipsMonthlyVolume: 1_200_000,
      vatOnTipCommission: true,
    },
    3: {
      payingSubscribers: 10_000,
      freeUsers: 200_000,
      priceTtc: 1500,
      vatRegime: 'ASSUJETTI',
      monthlyOpex: 5_000_000,
      adFillRate: 0.55,
      sponsoringMonthlyHt: 1_000_000,
      tipsMonthlyVolume: 3_000_000,
      vatOnTipCommission: true,
    },
  },
};

export const FinancialSimulator36M: React.FC<FinancialSimulator36MProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [preset, setPreset] = useState<ScenarioPresetKey>('CENTRAL');
  const [year, setYear] = useState<ProjectionYear>(3);
  const [neutralizeVatCliff, setNeutralizeVatCliff] = useState<boolean>(false);
  const [enableB2bHoreca, setEnableB2bHoreca] = useState<boolean>(true);
  const [enableB2bSocialJukebox, setEnableB2bSocialJukebox] = useState<boolean>(false);
  const [showAll36Months, setShowAll36Months] = useState<boolean>(false);

  const schedule36M = useMemo(
    () =>
      buildCentral36MonthSchedule({
        settings,
        neutralizeVatCliffYear3: neutralizeVatCliff,
        includeCssInSchedule: settings.applyCssWithVat,
        enableB2bHoreca,
        enableB2bSocialJukeboxAndSponsorY1: enableB2bSocialJukebox,
      }),
    [settings, neutralizeVatCliff, enableB2bHoreca, enableB2bSocialJukebox]
  );

  const scheduleSummary = useMemo(() => {
    const minCash = Math.min(...schedule36M.map((r) => r.cumulativeCashBeforeFunding));
    const minCashRow = schedule36M.find((r) => r.cumulativeCashBeforeFunding === minCash);
    const firstPositiveEbitdaRow = schedule36M.find((r) => r.ebitda > 0);
    const total36MRoyalties = schedule36M.reduce((acc, r) => acc + r.royaltiesPayable, 0);
    const total36MEbitda = schedule36M.reduce((acc, r) => acc + r.ebitda, 0);
    return {
      peakDeficit: Math.abs(minCash),
      peakDeficitMonth: minCashRow?.month ?? 28,
      fundingWithReserve: Math.round(Math.abs(minCash) * 1.1),
      breakEvenMonth: firstPositiveEbitdaRow?.month ?? 29,
      total36MRoyalties,
      total36MEbitda,
    };
  }, [schedule36M]);

  const displayedMonths = useMemo(
    () =>
      showAll36Months
        ? schedule36M
        : schedule36M.filter((r) => Boolean(r.milestoneTag)),
    [schedule36M, showAll36Months]
  );

  const baseInput = SCENARIO_PRESETS[preset][year];
  const effectivePriceTtc =
    neutralizeVatCliff && baseInput.vatRegime === 'ASSUJETTI'
      ? 1750
      : baseInput.priceTtc;

  const simResult = useMemo(
    () => simulateScenario({ ...baseInput, priceTtc: effectivePriceTtc }, settings),
    [baseInput, effectivePriceTtc, settings]
  );

  // Comparaison Falaise Fiscale Mois 24 (3 500 abonnés HT) vs Mois 25 (4 000 abonnés TTC avec TVA+CSS)
  const month24Unit = computeNetBase(1500, 'MOBILE_MONEY', {
    ...settings,
    vatRegime: 'FRANCHISE',
  });
  const month25Unit = computeNetBase(effectivePriceTtc, 'MOBILE_MONEY', {
    ...settings,
    vatRegime: 'ASSUJETTI',
  });

  const targetPriceFor1500Ht = priceTtcForTargetHt(1500, settings);

  return (
    <div className="space-y-3.5">
      {/* BARRE DE SÉLECTION SCÉNARIO + ANNÉE + CONTRÔLES FISCAUX */}
      <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
              Stress-Test Financier sur 36 Mois • Audit DGI Gabon &amp; CEMAC
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
              Simulateur Dynamique d&apos;Exploitation, Point Mort &amp; Falaise TVA (Mois 25)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['PRUDENT', 'CENTRAL', 'AMBITIEUX'] as ScenarioPresetKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`px-3 py-1 rounded-xl font-mono text-[11px] font-bold border transition ${
                  preset === key
                    ? 'bg-[#DE1B34] border-[#DE1B34] text-white'
                    : 'bg-[#0D1017] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {key}
              </button>
            ))}
            <span className="text-zinc-600 mx-1">|</span>
            {([1, 2, 3] as ProjectionYear[]).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition ${
                  year === y
                    ? 'bg-amber-400 text-[#07080C] border-amber-300'
                    : 'bg-[#0D1017] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                Année {y}
              </button>
            ))}
          </div>
        </div>

        {/* Options fiscales DGI Gabon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.07] text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={settings.applyCssWithVat}
                onChange={(e) => onUpdateSettings({ applyCssWithVat: e.target.checked })}
                className="accent-amber-400 rounded"
              />
              <span>Inclure la CSS 1 % (en sus de la TVA 18 % = 19 %)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={neutralizeVatCliff}
                onChange={(e) => setNeutralizeVatCliff(e.target.checked)}
                className="accent-emerald-400 rounded"
              />
              <span>
                Neutraliser l&apos;effet de falaise TVA en Année 3 (Palier 1 750 FCFA TTC / cible HT :{' '}
                {formatFcfa(targetPriceFor1500Ht)})
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 font-semibold">
              <input
                type="checkbox"
                checked={enableB2bHoreca}
                onChange={(e) => setEnableB2bHoreca(e.target.checked)}
                className="accent-amber-400 rounded"
              />
              <span>
                Activer Verticale B2B HORECA × BUGADA (30 → 100 → 250 Bars/Hôtels à 15k FCFA)
              </span>
            </label>

            {enableB2bHoreca && (
              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300 font-semibold">
                <input
                  type="checkbox"
                  checked={enableB2bSocialJukebox}
                  onChange={(e) => setEnableB2bSocialJukebox(e.target.checked)}
                  className="accent-emerald-400 rounded"
                />
                <span>+ Jukebox Social QR (15k/bar/mois) &amp; Sponsoring B2B2C An 1 (250k/mois)</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-400">Plafond / écoute :</span>
            <select
              value={settings.capPerStream}
              onChange={(e) => onUpdateSettings({ capPerStream: Number(e.target.value) })}
              className="bg-[#0D1017] border border-white/15 rounded-lg px-2 py-1 text-amber-300 font-bold"
            >
              <option value={10}>10 FCFA / stream</option>
              <option value={15}>15 FCFA / stream (Recommandé)</option>
              <option value={20}>20 FCFA / stream</option>
            </select>
          </div>
        </div>
      </div>

      {/* CARTES KPI DU SCÉNARIO SÉLECTIONNÉ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5">
          <span className="text-[10px] font-mono uppercase text-zinc-400 block">
            Audience ({preset} • An {year})
          </span>
          <div className="text-sm sm:text-base font-bold font-mono text-white mt-1">
            {formatInteger(baseInput.payingSubscribers)} Payants
          </div>
          <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
            + {formatInteger(baseInput.freeUsers)} Gratuits actifs
          </span>
        </div>

        <div className="bg-[#07080C] border border-emerald-500/30 rounded-2xl p-3.5">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block">
            Royalties Ayants Droit (60%)
          </span>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-300 mt-1">
            {formatFcfa(simResult.royaltiesGenerated)} / mois
          </div>
          <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
            Soit {formatFcfa(simResult.royaltiesGenerated * 12)} / an
          </span>
        </div>

        <div className="bg-[#07080C] border border-amber-400/30 rounded-2xl p-3.5">
          <span className="text-[10px] font-mono uppercase text-amber-300 block">
            Seuil de Rentabilité (Point Mort)
          </span>
          <div className="text-sm sm:text-base font-bold font-mono text-amber-300 mt-1">
            {formatInteger(simResult.breakEvenSubscribers)} abonnés
          </div>
          <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
            Marge / abonné : {formatFcfaPrecise(simResult.marginPerSubscriber)}
          </span>
        </div>

        <div
          className={`bg-[#07080C] border rounded-2xl p-3.5 ${
            simResult.ebitda >= 0 ? 'border-emerald-500/40' : 'border-rose-500/40'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-zinc-400 block">
            EBITDA d&apos;Exploitation
          </span>
          <div
            className={`text-sm sm:text-base font-bold font-mono mt-1 ${
              simResult.ebitda >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {simResult.ebitda >= 0 ? '+' : ''}
            {formatFcfa(simResult.ebitda)} / mois
          </div>
          <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
            OPEX : {formatFcfa(baseInput.monthlyOpex)} / mois
          </span>
        </div>
      </div>

      {/* AUDIT DES 4 PILIERS DE REVENUS & EFFET DE FALAISE MOIS 25 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block">
            Contribution Nette des 4 Piliers (Part Plateforme)
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.05]">
              <span className="text-zinc-300">1. Abonnements Premium (40% du net)</span>
              <span className="font-mono font-bold text-white">
                {formatFcfa(simResult.subscriptionContribution)} / mois
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.05]">
              <span className="text-zinc-300">
                2. Publicité Audio/Visuelle (Fill {Math.round(baseInput.adFillRate * 100)}% • CPM{' '}
                {settings.adCpm})
              </span>
              <span className="font-mono font-bold text-amber-300">
                {formatFcfa(simResult.adContribution)} / mois
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.05]">
              <span className="text-zinc-300">3. Sponsoring B2B Top 50 Gabon (Marge 85%)</span>
              <span className="font-mono font-bold text-emerald-300">
                {formatFcfa(simResult.sponsoringContribution)} / mois
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.05]">
              <span className="text-zinc-300">4. Commission Soutien Direct des Fans (10%)</span>
              <span className="font-mono font-bold text-purple-300">
                {formatFcfa(simResult.tipsContribution)} / mois
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#07080C] border border-amber-400/25 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
            Diagnostic Falaise Fiscale (Mois 24 → Mois 25) &amp; Trésorerie
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">Franchise TVA (An 1-2)</span>
              <span className="font-mono font-bold text-emerald-300 block mt-0.5">
                Ayants droit : {formatFcfaPrecise(month24Unit.rightsHoldersPool)} / ab.
              </span>
              <span className="font-mono text-[11px] text-zinc-300 block">
                Plateforme : {formatFcfaPrecise(month24Unit.platformShare)} / ab.
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">
                Assujetti TVA {settings.applyCssWithVat ? '19% (TVA+CSS)' : '18%'} (An 3)
              </span>
              <span className="font-mono font-bold text-amber-300 block mt-0.5">
                Ayants droit : {formatFcfaPrecise(month25Unit.rightsHoldersPool)} / ab.
              </span>
              <span className="font-mono text-[11px] text-zinc-300 block">
                Plateforme : {formatFcfaPrecise(month25Unit.platformShare)} / ab.
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-[11px] text-zinc-300 flex flex-wrap items-center justify-between gap-2">
            <span>
              Point Mort : <strong className="text-emerald-300">Mois {scheduleSummary.breakEvenMonth}</strong>
            </span>
            <span>
              Creux Max (M{scheduleSummary.peakDeficitMonth}) :{' '}
              <strong className="text-rose-300">-{formatFcfa(scheduleSummary.peakDeficit)}</strong>
            </span>
            <span>
              Financement (+10%) :{' '}
              <strong className="text-amber-300">{formatFcfa(scheduleSummary.fundingWithReserve)}</strong>
            </span>
            <span>
              Royalties 36M :{' '}
              <strong className="text-emerald-300">{formatFcfa(scheduleSummary.total36MRoyalties)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* TABLEAU DE TRÉSORERIE MENSUELLE SUR 36 MOIS (JALONS CRITIQUES & VALLÉE DE LA MORT) */}
      <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
              Trésorerie Mensuelle Dynamique (Scénario Central • M1 → M36) &amp; Float Séquestre
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
              Levée en 2 Tranches (25 M M1 + 25 M M13) •{' '}
              {enableB2bHoreca
                ? `Avec B2B HORECA : Point Mort avancé au Mois ${scheduleSummary.breakEvenMonth} & Besoin réduit à ${formatFcfa(scheduleSummary.fundingWithReserve)}`
                : `Sans B2B HORECA : Point Mort au Mois ${scheduleSummary.breakEvenMonth} & Besoin ${formatFcfa(FUNDING_NEED.withReserve)}`}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowAll36Months((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-mono font-bold text-amber-300 transition"
          >
            {showAll36Months ? 'Afficher les jalons clés' : 'Afficher les 36 mois complets'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400">
                <th className="py-2 pr-2">Mois</th>
                <th className="py-2 px-2">B2C / Bars B2B / Gratuits</th>
                <th className="py-2 px-2">Base Nette</th>
                <th className="py-2 px-2">Royalties (60%)</th>
                <th className="py-2 px-2">EBITDA</th>
                <th className="py-2 px-2">Tréso Hors Fin.</th>
                <th className="py-2 px-2">Tréso (+50 M)</th>
                <th className="py-2 pl-2">Float Séquestre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {displayedMonths.map((row) => (
                <tr key={row.month} className="hover:bg-white/[0.03]">
                  <td className="py-2 pr-2 whitespace-nowrap">
                    <span className="font-bold text-white">M{row.month}</span>{' '}
                    <span className="text-zinc-500">(A{row.year})</span>
                    {row.milestoneTag && (
                      <span className="block text-[9.5px] text-amber-300 font-sans">
                        {row.milestoneTag}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap text-zinc-200">
                    {formatInteger(Math.round(row.payingSubscribers))}
                    {enableB2bHoreca && (
                      <span className="text-amber-300 font-bold">
                        {' '}
                        + {formatInteger(Math.round(row.b2bEstablishments))} Bars
                      </span>
                    )}{' '}
                    / <span className="text-zinc-400">{formatInteger(Math.round(row.freeActiveUsers))}</span>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap text-white">
                    {formatFcfa(row.streamingNetBase)}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap text-emerald-300 font-bold">
                    {formatFcfa(row.royaltiesPayable)}
                  </td>
                  <td
                    className={`py-2 px-2 whitespace-nowrap font-bold ${
                      row.ebitda >= 0 ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {row.ebitda >= 0 ? '+' : ''}
                    {formatFcfa(row.ebitda)}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap text-rose-300">
                    {formatFcfa(row.cumulativeCashBeforeFunding)}
                  </td>
                  <td
                    className={`py-2 px-2 whitespace-nowrap font-bold ${
                      row.cumulativeCashWithTranches >= 0 ? 'text-sky-300' : 'text-amber-300'
                    }`}
                  >
                    {formatFcfa(row.cumulativeCashWithTranches)}
                  </td>
                  <td className="py-2 pl-2 whitespace-nowrap text-amber-200">
                    {formatFcfa(row.escrowRoyaltyFloatEstimate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

