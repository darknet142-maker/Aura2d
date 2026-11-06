import type { RoyaltySettings, VatRegime } from './economicConfig';
import { computeNetBase } from './fiscalEngine';

export type ProjectionYear = 1 | 2 | 3;

export interface ScenarioInput {
  payingSubscribers: number;
  freeUsers: number;
  priceTtc: number;
  vatRegime: VatRegime;
  monthlyOpex: number;
  adFillRate: number;
  sponsoringMonthlyHt: number;
  tipsMonthlyVolume: number;
  /** Applique la TVA sur la commission des dons (correction de l'anomalie du tableur d'origine). */
  vatOnTipCommission: boolean;
}

export interface ScenarioResult {
  marginPerSubscriber: number;
  subscriptionContribution: number;
  adContribution: number;
  sponsoringContribution: number;
  tipsContribution: number;
  totalContribution: number;
  ebitda: number;
  breakEvenSubscribers: number;
  royaltiesGenerated: number;
  indirectTaxesCollected: number;
}

/** Hypothèses du scénario central (moyennes mensuelles par année). */
export const CENTRAL_SCENARIO: Record<ProjectionYear, ScenarioInput> = {
  1: {
    payingSubscribers: 850,
    freeUsers: 12_000,
    priceTtc: 1500,
    vatRegime: 'FRANCHISE',
    monthlyOpex: 1_860_000,
    adFillRate: 0.35,
    sponsoringMonthlyHt: 0,
    tipsMonthlyVolume: 200_000,
    vatOnTipCommission: true,
  },
  2: {
    payingSubscribers: 2_550,
    freeUsers: 45_000,
    priceTtc: 1500,
    vatRegime: 'FRANCHISE',
    monthlyOpex: 2_650_000,
    adFillRate: 0.4,
    sponsoringMonthlyHt: 200_000,
    tipsMonthlyVolume: 600_000,
    vatOnTipCommission: true,
  },
  3: {
    payingSubscribers: 7_000,
    freeUsers: 120_000,
    priceTtc: 1500,
    vatRegime: 'ASSUJETTI',
    monthlyOpex: 3_800_000,
    adFillRate: 0.45,
    sponsoringMonthlyHt: 500_000,
    tipsMonthlyVolume: 1_500_000,
    vatOnTipCommission: true,
  },
};

export const CAPEX_INITIAL = { mvpDevelopment: 15_000_000, legalAndLaunch: 2_000_000 };
export const FUNDING_NEED = { peakCashDeficit: 44_811_450, withReserve: 49_292_595 };

/** Résultat mensuel d'exploitation et seuil de rentabilité pour un scénario donné. */
export function simulateScenario(input: ScenarioInput, base: RoyaltySettings): ScenarioResult {
  const settings: RoyaltySettings = { ...base, vatRegime: input.vatRegime };
  const unit = computeNetBase(input.priceTtc, 'MOBILE_MONEY', settings);
  const subscriptions = computeNetBase(input.priceTtc * input.payingSubscribers, 'MOBILE_MONEY', settings);

  const adGross =
    ((input.freeUsers * settings.adImpressionsPerFreeUser * input.adFillRate) / 1000) * settings.adCpm;
  const ads = computeNetBase(adGross, 'MOBILE_MONEY', settings);

  const sponsoringContribution = input.sponsoringMonthlyHt * (1 - settings.sponsoringDeliveryCostRate);

  const taxRate = input.vatRegime === 'ASSUJETTI' && input.vatOnTipCommission
    ? settings.vatRate + (settings.applyCssWithVat ? settings.cssRate : 0)
    : 0;
  const commission = (input.tipsMonthlyVolume * settings.tipCommissionRate) / (1 + taxRate);
  const tipFees = settings.tipFeePassedToDonor
    ? 0
    : input.tipsMonthlyVolume * settings.paymentFeeRate.MOBILE_MONEY;
  const tipsContribution = commission - tipFees;

  const otherContributions = ads.platformShare + sponsoringContribution + tipsContribution;
  const totalContribution = subscriptions.platformShare + otherContributions;
  const breakEven =
    unit.platformShare > 0
      ? Math.max(0, Math.ceil((input.monthlyOpex - otherContributions) / unit.platformShare))
      : Number.POSITIVE_INFINITY;

  return {
    marginPerSubscriber: unit.platformShare,
    subscriptionContribution: Math.round(subscriptions.platformShare),
    adContribution: Math.round(ads.platformShare),
    sponsoringContribution: Math.round(sponsoringContribution),
    tipsContribution: Math.round(tipsContribution),
    totalContribution: Math.round(totalContribution),
    ebitda: Math.round(totalContribution - input.monthlyOpex),
    breakEvenSubscribers: breakEven,
    royaltiesGenerated: Math.round(subscriptions.rightsHoldersPool + ads.rightsHoldersPool),
    indirectTaxesCollected: Math.round(subscriptions.indirectTaxes + ads.indirectTaxes),
  };
}
