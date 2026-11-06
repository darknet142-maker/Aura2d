import type { PaymentChannel, RoyaltySettings } from './economicConfig';

export interface NetBaseBreakdown {
  grossTtc: number;
  indirectTaxes: number;
  vat: number;
  css: number;
  amountHt: number;
  paymentFees: number;
  netBase: number;
  rightsHoldersPool: number;
  platformShare: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Taux cumulé de prélèvements indirects (TVA + CSS) selon le régime fiscal actif. */
export function getIndirectTaxRate(settings: RoyaltySettings): number {
  if (settings.vatRegime === 'FRANCHISE') return 0;
  return settings.vatRate + (settings.applyCssWithVat ? settings.cssRate : 0);
}

/**
 * Base nette distribuable : B = P_TTC / (1 + TVA + CSS) − P_TTC × frais_canal.
 * Pour le DCB, la commission opérateur (30 % à 50 %) remplace les frais Mobile Money :
 * les royalties sont calculées sur le net réellement reversé par l'opérateur.
 */
export function computeNetBase(
  grossTtc: number,
  channel: PaymentChannel,
  settings: RoyaltySettings
): NetBaseBreakdown {
  const taxRate = getIndirectTaxRate(settings);
  const amountHt = grossTtc / (1 + taxRate);
  const indirectTaxes = grossTtc - amountHt;
  const cssShare = taxRate > 0 && settings.applyCssWithVat ? settings.cssRate / taxRate : 0;
  const css = indirectTaxes * cssShare;
  const vat = indirectTaxes - css;
  const paymentFees = grossTtc * settings.paymentFeeRate[channel];
  const netBase = Math.max(0, amountHt - paymentFees);
  const rightsHoldersPool = netBase * settings.rightsHoldersShare;

  return {
    grossTtc: round2(grossTtc),
    indirectTaxes: round2(indirectTaxes),
    vat: round2(vat),
    css: round2(css),
    amountHt: round2(amountHt),
    paymentFees: round2(paymentFees),
    netBase: round2(netBase),
    rightsHoldersPool: round2(rightsHoldersPool),
    platformShare: round2(netBase - rightsHoldersPool),
  };
}

/** Somme de plusieurs décompositions (agrégation mensuelle). */
export const EMPTY_NET_BASE: NetBaseBreakdown = {
  grossTtc: 0,
  indirectTaxes: 0,
  vat: 0,
  css: 0,
  amountHt: 0,
  paymentFees: 0,
  netBase: 0,
  rightsHoldersPool: 0,
  platformShare: 0,
};

export function sumNetBases(items: NetBaseBreakdown[]): NetBaseBreakdown {
  return items.reduce<NetBaseBreakdown>(
    (acc, item) => ({
      grossTtc: round2(acc.grossTtc + item.grossTtc),
      indirectTaxes: round2(acc.indirectTaxes + item.indirectTaxes),
      vat: round2(acc.vat + item.vat),
      css: round2(acc.css + item.css),
      amountHt: round2(acc.amountHt + item.amountHt),
      paymentFees: round2(acc.paymentFees + item.paymentFees),
      netBase: round2(acc.netBase + item.netBase),
      rightsHoldersPool: round2(acc.rightsHoldersPool + item.rightsHoldersPool),
      platformShare: round2(acc.platformShare + item.platformShare),
    }),
    EMPTY_NET_BASE
  );
}

/** Prix TTC à afficher pour conserver une base HT cible (ex. 1 500 FCFA HT → 1 785 FCFA TTC). */
export function priceTtcForTargetHt(targetHt: number, settings: RoyaltySettings): number {
  return Math.round(targetHt * (1 + getIndirectTaxRate({ ...settings, vatRegime: 'ASSUJETTI' })));
}

/** Indique si le chiffre d'affaires HT annualisé impose le passage au régime assujetti. */
export function shouldSwitchToVat(annualisedHt: number, settings: RoyaltySettings): boolean {
  return annualisedHt >= settings.vatThresholdHt;
}
