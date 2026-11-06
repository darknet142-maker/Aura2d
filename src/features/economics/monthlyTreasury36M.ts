import type { RoyaltySettings } from './economicConfig';
import { computeNetBase } from './fiscalEngine';

export interface B2bProPackSpec {
  id: 'PRO_S' | 'PRO_M' | 'PRO_L';
  name: string;
  targetVenues: string;
  dailyHours: number;
  monthlyHours: number;
  estimatedMonthlyTracks: number;
  weeklyPriceFcfa: number;
  monthlyPriceFcfa: number;
  annualPriceFcfa: number;
  multiplierVsB2c: number;
  withoutVat: {
    netBase: number;
    royaltiesTotal60: number;
    masterDirect48: number;
    bugadaPublicPerf12: number;
    platformShare40: number;
    perTrackRoyaltyFcfa: number;
  };
  withVat18: {
    netBase: number;
    royaltiesTotal60: number;
    masterDirect48: number;
    bugadaPublicPerf12: number;
    platformShare40: number;
    perTrackRoyaltyFcfa: number;
  };
}

export const B2B_PRO_PACKS: readonly B2bProPackSpec[] = [
  {
    id: 'PRO_S',
    name: 'Pack Pro S — Snack, Petit Maquis & Salon',
    targetVenues: 'Snacks de quartier, petits maquis, salons de coiffure, boutiques (< 50 places)',
    dailyHours: 12,
    monthlyHours: 360,
    estimatedMonthlyTracks: 7_200,
    weeklyPriceFcfa: 3_500,
    monthlyPriceFcfa: 10_000,
    annualPriceFcfa: 100_000,
    multiplierVsB2c: 6.7,
    withoutVat: {
      netBase: 9_800,
      royaltiesTotal60: 5_880,
      masterDirect48: 4_704,
      bugadaPublicPerf12: 1_176,
      platformShare40: 3_920,
      perTrackRoyaltyFcfa: 0.82,
    },
    withVat18: {
      netBase: 8_274.58,
      royaltiesTotal60: 4_964.75,
      masterDirect48: 3_971.8,
      bugadaPublicPerf12: 992.95,
      platformShare40: 3_309.83,
      perTrackRoyaltyFcfa: 0.69,
    },
  },
  {
    id: 'PRO_M',
    name: 'Pack Pro M — Bar, Restaurant & Lounge',
    targetVenues: 'Bars climatisés, grands maquis, restaurants, lounges & terrasses (50 à 150 places)',
    dailyHours: 16,
    monthlyHours: 480,
    estimatedMonthlyTracks: 9_600,
    weeklyPriceFcfa: 7_500,
    monthlyPriceFcfa: 20_000,
    annualPriceFcfa: 200_000,
    multiplierVsB2c: 13.3,
    withoutVat: {
      netBase: 19_600,
      royaltiesTotal60: 11_760,
      masterDirect48: 9_408,
      bugadaPublicPerf12: 2_352,
      platformShare40: 7_840,
      perTrackRoyaltyFcfa: 1.23,
    },
    withVat18: {
      netBase: 16_549.15,
      royaltiesTotal60: 9_929.49,
      masterDirect48: 7_943.59,
      bugadaPublicPerf12: 1_985.9,
      platformShare40: 6_619.66,
      perTrackRoyaltyFcfa: 1.03,
    },
  },
  {
    id: 'PRO_L',
    name: 'Pack Pro L — Nightclub, Grand Bar & Hôtel 24/7',
    targetVenues: 'Discothèques, complexes hôteliers, casinos & établissements 24h/24 (> 150 places)',
    dailyHours: 24,
    monthlyHours: 720,
    estimatedMonthlyTracks: 14_400,
    weeklyPriceFcfa: 15_000,
    monthlyPriceFcfa: 45_000,
    annualPriceFcfa: 450_000,
    multiplierVsB2c: 30.0,
    withoutVat: {
      netBase: 44_100,
      royaltiesTotal60: 26_460,
      masterDirect48: 21_168,
      bugadaPublicPerf12: 5_292,
      platformShare40: 17_640,
      perTrackRoyaltyFcfa: 1.84,
    },
    withVat18: {
      netBase: 37_235.59,
      royaltiesTotal60: 22_341.36,
      masterDirect48: 17_873.08,
      bugadaPublicPerf12: 4_468.27,
      platformShare40: 14_894.24,
      perTrackRoyaltyFcfa: 1.55,
    },
  },
];

export interface B2bDilutionRow {
  profile: string;
  dailyHours: string;
  monthlyHours: number;
  monthlyTracks: number;
  volumeVsB2c: string;
  dilutedRoyaltyAt1500WithoutVat: number;
  dilutedRoyaltyAt1500WithVat: number;
  recommendedPack: string;
  restoredRoyaltyWithoutVat: number;
}

export const B2B_DILUTION_COMPARISON: readonly B2bDilutionRow[] = [
  {
    profile: 'Auditeur particulier (B2C)',
    dailyHours: '40 min / j',
    monthlyHours: 20,
    monthlyTracks: 400,
    volumeVsB2c: '1x (Référence)',
    dilutedRoyaltyAt1500WithoutVat: 2.21,
    dilutedRoyaltyAt1500WithVat: 1.86,
    recommendedPack: 'Premium B2C (1 500 FCFA)',
    restoredRoyaltyWithoutVat: 2.21,
  },
  {
    profile: 'Snack / Petit Maquis / Salon',
    dailyHours: '12 h / j',
    monthlyHours: 360,
    monthlyTracks: 7_200,
    volumeVsB2c: 'x18',
    dilutedRoyaltyAt1500WithoutVat: 0.12,
    dilutedRoyaltyAt1500WithVat: 0.1,
    recommendedPack: 'Pack Pro S (10 000 FCFA)',
    restoredRoyaltyWithoutVat: 0.82,
  },
  {
    profile: 'Bar / Restaurant / Lounge',
    dailyHours: '16 h / j',
    monthlyHours: 480,
    monthlyTracks: 9_600,
    volumeVsB2c: 'x24',
    dilutedRoyaltyAt1500WithoutVat: 0.09,
    dilutedRoyaltyAt1500WithVat: 0.08,
    recommendedPack: 'Pack Pro M (20 000 FCFA)',
    restoredRoyaltyWithoutVat: 1.23,
  },
  {
    profile: 'Grand Bar / Nightclub / Hôtel 24/7',
    dailyHours: '24 h / j',
    monthlyHours: 720,
    monthlyTracks: 14_400,
    volumeVsB2c: 'x36',
    dilutedRoyaltyAt1500WithoutVat: 0.06,
    dilutedRoyaltyAt1500WithVat: 0.05,
    recommendedPack: 'Pack Pro L (45 000 FCFA)',
    restoredRoyaltyWithoutVat: 1.84,
  },
];

export interface MonthlyCashflowRow {
  month: number;
  year: 1 | 2 | 3;
  monthInYear: number;
  payingSubscribers: number;
  b2bEstablishments: number;
  freeActiveUsers: number;
  subscriptionsTtc: number;
  b2bGrossTtc: number;
  adGross: number;
  vatApplied: boolean;
  subscriptionsNet: number;
  b2bNet: number;
  adNet: number;
  streamingNetBase: number;
  royaltiesPayable: number;
  b2bRoyaltiesPayable: number;
  platformStreamingShare: number;
  sponsoringNet: number;
  tipsNetCommission: number;
  monthlyOpex: number;
  ebitda: number;
  initialInvestment: number;
  netMonthlyCashflow: number;
  cumulativeCashBeforeFunding: number;
  cumulativeCashWithTranches: number;
  escrowRoyaltyFloatEstimate: number;
  milestoneTag?: string;
}

interface YearRampBounds {
  year: 1 | 2 | 3;
  payStart: number;
  payEnd: number;
  b2bStart: number;
  b2bEnd: number;
  freeStart: number;
  freeEnd: number;
  vatApplied: boolean;
  adFillRate: number;
  adCpm: number;
  sponsoringMonthlyGross: number;
  tipsMonthlyVolume: number;
  monthlyOpex: number;
}

const CENTRAL_YEAR_BOUNDS: Record<1 | 2 | 3, YearRampBounds> = {
  1: {
    year: 1,
    payStart: 200,
    payEnd: 1500,
    b2bStart: 10,
    b2bEnd: 50,
    freeStart: 3000,
    freeEnd: 21000,
    vatApplied: false,
    adFillRate: 0.35,
    adCpm: 800,
    sponsoringMonthlyGross: 0,
    tipsMonthlyVolume: 200_000,
    monthlyOpex: 1_860_000,
  },
  2: {
    year: 2,
    payStart: 1600,
    payEnd: 3500,
    b2bStart: 60,
    b2bEnd: 140,
    freeStart: 25000,
    freeEnd: 65000,
    vatApplied: false,
    adFillRate: 0.4,
    adCpm: 800,
    sponsoringMonthlyGross: 200_000,
    tipsMonthlyVolume: 600_000,
    monthlyOpex: 2_650_000,
  },
  3: {
    year: 3,
    payStart: 4000,
    payEnd: 10000,
    b2bStart: 160,
    b2bEnd: 340,
    freeStart: 70000,
    freeEnd: 170000,
    vatApplied: true,
    adFillRate: 0.45,
    adCpm: 800,
    sponsoringMonthlyGross: 500_000,
    tipsMonthlyVolume: 1_500_000,
    monthlyOpex: 3_800_000,
  },
};

const MILESTONE_LABELS_B2C: Record<number, string> = {
  1: 'Lancement MVP & CAPEX (-17 M FCFA)',
  12: 'Clôture Année 1 (1 500 abonnés)',
  13: 'Palier OPEX Année 2 (2,65 M/mois)',
  24: 'Fin Franchise TVA (EBITDA -178k)',
  25: 'Choc Fiscal TVA 18% & OPEX 3,8 M',
  28: 'Creux Max Trésorerie (-44,81 M FCFA)',
  29: 'Point Mort Opérationnel (EBITDA +)',
  36: 'Expansion Mois 36 (10 000 abonnés)',
};

const MILESTONE_LABELS_B2B: Record<number, string> = {
  1: 'Lancement MVP & Guichet B2B (-17 M FCFA)',
  12: 'Clôture Année 1 (1 500 B2C + 50 Bars)',
  13: 'Palier OPEX Année 2 (2,65 M/mois)',
  19: 'Creux Max Trésorerie B2B (-34,82 M FCFA)',
  20: 'Point Mort Avancé de 9 Mois (EBITDA +23,8k)',
  23: 'Franchissement Seuil TVA 60M HT (63,06 M)',
  25: 'Choc Fiscal TVA 18% absorbé par B2B',
  36: 'Expansion M36 (10 000 B2C + 350 Bars)',
};

/**
 * Génère la trajectoire mensuelle sur 36 mois (Mois 1 à Mois 36) du Scénario Central,
 * conforme au tableur financier officiel et sensible à l'activation de la verticale B2B HORECA.
 */
export function buildCentral36MonthSchedule(params: {
  settings: RoyaltySettings;
  neutralizeVatCliffYear3?: boolean;
  includeCssInSchedule?: boolean;
  enableB2bHoreca?: boolean;
  enableB2bSocialJukeboxAndSponsorY1?: boolean;
  b2bAveragePackFcfa?: number;
  tranche1Month1?: number;
  tranche2Month13?: number;
}): MonthlyCashflowRow[] {
  const {
    settings,
    neutralizeVatCliffYear3 = false,
    includeCssInSchedule = false,
    enableB2bHoreca = false,
    enableB2bSocialJukeboxAndSponsorY1 = false,
    b2bAveragePackFcfa = 15_000,
    tranche1Month1 = 25_000_000,
    tranche2Month13 = 25_000_000,
  } = params;

  const rows: MonthlyCashflowRow[] = [];
  let cumulativeBeforeFunding = 0;
  let cumulativeWithTranches = 0;
  const labels = enableB2bHoreca ? MILESTONE_LABELS_B2B : MILESTONE_LABELS_B2C;

  for (let m = 1; m <= 36; m++) {
    const year = (m <= 12 ? 1 : m <= 24 ? 2 : 3) as 1 | 2 | 3;
    const monthInYear = ((m - 1) % 12) + 1;
    const b = CENTRAL_YEAR_BOUNDS[year];
    const ratio = (monthInYear - 1) / 11;

    const payingSubscribers = b.payStart + (b.payEnd - b.payStart) * ratio;
    const b2bEstablishments = enableB2bHoreca
      ? b.b2bStart + (b.b2bEnd - b.b2bStart) * ratio
      : 0;
    const freeActiveUsers = b.freeStart + (b.freeEnd - b.freeStart) * ratio;
    const priceTtc = year === 3 && neutralizeVatCliffYear3 ? 1750 : 1500;

    const effectiveSettings: RoyaltySettings = {
      ...settings,
      vatRegime: b.vatApplied ? 'ASSUJETTI' : 'FRANCHISE',
      applyCssWithVat: includeCssInSchedule,
    };

    const subscriptionsTtc = payingSubscribers * priceTtc;
    const b2bGrossTtc = b2bEstablishments * b2bAveragePackFcfa;
    const adGross =
      ((freeActiveUsers * settings.adImpressionsPerFreeUser * b.adFillRate) / 1000) * b.adCpm;

    const subBase = computeNetBase(subscriptionsTtc, 'MOBILE_MONEY', effectiveSettings);
    const b2bBase = computeNetBase(b2bGrossTtc, 'MOBILE_MONEY', effectiveSettings);
    const adBase = computeNetBase(adGross, 'MOBILE_MONEY', effectiveSettings);

    const streamingNetBase = subBase.netBase + b2bBase.netBase + adBase.netBase;
    const royaltiesPayable =
      subBase.rightsHoldersPool + b2bBase.rightsHoldersPool + adBase.rightsHoldersPool;
    const platformStreamingShare =
      subBase.platformShare + b2bBase.platformShare + adBase.platformShare;

    const extraY1SponsorGross =
      enableB2bHoreca && enableB2bSocialJukeboxAndSponsorY1 && year === 1 ? 250_000 : 0;
    const sponsoringNet =
      (b.sponsoringMonthlyGross + extraY1SponsorGross) *
      (1 - settings.sponsoringDeliveryCostRate);

    const jukeboxTipVolume =
      enableB2bHoreca && enableB2bSocialJukeboxAndSponsorY1
        ? b2bEstablishments * 15_000
        : 0;
    const tipFeeRate = settings.tipFeePassedToDonor ? 0 : settings.paymentFeeRate.MOBILE_MONEY;
    const tipsNetCommission =
      (b.tipsMonthlyVolume + jukeboxTipVolume) * (settings.tipCommissionRate - tipFeeRate);

    const ebitda =
      platformStreamingShare + sponsoringNet + tipsNetCommission - b.monthlyOpex;
    const initialInvestment = m === 1 ? -17_000_000 : 0;
    const netMonthlyCashflow = ebitda + initialInvestment;

    cumulativeBeforeFunding += netMonthlyCashflow;
    const trancheInflow = m === 1 ? tranche1Month1 : m === 13 ? tranche2Month13 : 0;
    cumulativeWithTranches += netMonthlyCashflow + trancheInflow;

    const escrowRoyaltyFloatEstimate = Math.round(royaltiesPayable * 1.65);

    rows.push({
      month: m,
      year,
      monthInYear,
      payingSubscribers: Math.round(payingSubscribers * 100) / 100,
      b2bEstablishments: Math.round(b2bEstablishments * 100) / 100,
      freeActiveUsers: Math.round(freeActiveUsers * 100) / 100,
      subscriptionsTtc: Math.round(subscriptionsTtc),
      b2bGrossTtc: Math.round(b2bGrossTtc),
      adGross: Math.round(adGross),
      vatApplied: b.vatApplied,
      subscriptionsNet: Math.round(subBase.netBase),
      b2bNet: Math.round(b2bBase.netBase),
      adNet: Math.round(adBase.netBase),
      streamingNetBase: Math.round(streamingNetBase),
      royaltiesPayable: Math.round(royaltiesPayable),
      b2bRoyaltiesPayable: Math.round(b2bBase.rightsHoldersPool),
      platformStreamingShare: Math.round(platformStreamingShare),
      sponsoringNet: Math.round(sponsoringNet),
      tipsNetCommission: Math.round(tipsNetCommission),
      monthlyOpex: b.monthlyOpex,
      ebitda: Math.round(ebitda),
      initialInvestment,
      netMonthlyCashflow: Math.round(netMonthlyCashflow),
      cumulativeCashBeforeFunding: Math.round(cumulativeBeforeFunding),
      cumulativeCashWithTranches: Math.round(cumulativeWithTranches),
      escrowRoyaltyFloatEstimate,
      milestoneTag: labels[m],
    });
  }

  return rows;
}
