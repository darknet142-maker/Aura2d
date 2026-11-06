/**
 * Paramètres économiques officiels de DROP (modèle BUGADA / Ministère de la Culture).
 * Source : Audit stratégique & financier — modèle sur 36 mois (scénario central).
 * Toute valeur monétaire est exprimée en FCFA (XAF).
 */

export type PaymentChannel = 'MOBILE_MONEY' | 'CARD' | 'DIRECT_CARRIER_BILLING';
export type VatRegime = 'FRANCHISE' | 'ASSUJETTI';
export type ListenerPlanId = 'FREE' | 'PASS_7J' | 'PREMIUM_MENSUEL';

export interface ListenerOffer {
  id: ListenerPlanId;
  label: string;
  priceTtc: number;
  periodDays: number;
  /** Nombre maximum de titres en cache hors ligne (null = illimité, 0 = aucun). */
  offlineTrackCap: number | null;
  withAds: boolean;
  audioProfile: 'DATA_SAVER_32K' | 'STANDARD_96K' | 'HIRES_256K';
  pitch: string;
  features: string[];
}

export const LISTENER_OFFERS: Record<ListenerPlanId, ListenerOffer> = {
  FREE: {
    id: 'FREE',
    label: 'Gratuit',
    priceTtc: 0,
    periodDays: 30,
    offlineTrackCap: 0,
    withAds: true,
    audioProfile: 'DATA_SAVER_32K',
    pitch: 'Tout le répertoire gabonais, en mode Économie de données.',
    features: [
      'Mode Économie de données Opus 32 kbps (~14 Mo / heure)',
      'Publicités audio et visuelles',
      'Écoute connectée uniquement',
    ],
  },
  PASS_7J: {
    id: 'PASS_7J',
    label: 'Pass 7 jours',
    priceTtc: 500,
    periodDays: 7,
    offlineTrackCap: 25,
    withAds: false,
    audioProfile: 'STANDARD_96K',
    pitch: 'Sans engagement, payé avec ton solde Mobile Money.',
    features: [
      'Sans publicité pendant 7 jours',
      'Jusqu’à 25 titres téléchargés hors ligne',
      'Qualité Standard 96 kbps',
    ],
  },
  PREMIUM_MENSUEL: {
    id: 'PREMIUM_MENSUEL',
    label: 'Premium mensuel',
    priceTtc: 1500,
    periodDays: 30,
    offlineTrackCap: null,
    withAds: false,
    audioProfile: 'HIRES_256K',
    pitch: 'Écoute illimitée sans épuiser ton forfait Internet.',
    features: [
      'Téléchargements hors ligne illimités (Wi-Fi ou forfait Nuit)',
      'Sans publicité',
      'Qualité Supérieure jusqu’à 256 kbps',
    ],
  },
};

export interface RoyaltySettings {
  vatRegime: VatRegime;
  vatRate: number;
  /** Contribution Spéciale de Solidarité, due avec la TVA. */
  cssRate: number;
  applyCssWithVat: boolean;
  vatThresholdHt: number;
  paymentFeeRate: Record<PaymentChannel, number>;
  rightsHoldersShare: number;
  /** Part des droits voisins / master dans l'enveloppe ayants droit (48 % des 60 %). */
  masterShareOfRights: number;
  /** Part de l'interprète dans le master quand un label/producteur tiers détient l'enregistrement. */
  performerShareOfMaster: number;
  /** Points royalties d'ingénierie studio sur le master (20 % prise / 50 % mix / 30 % mastering). */
  engineerShareOfMaster?: number;
  /** Part de l'auteur des paroles dans les droits d'auteur (le reste au compositeur). */
  lyricistShareOfAuthorship: number;
  capPerStream: number;
  maxCountedSecondsPerStream: number;
  countWeight: number;
  payoutThreshold: number;
  disbursementFeeRate: number;
  withholdingRates: Record<RightsHolderTaxStatus, number>;
  adCpm: number;
  adFillRate: number;
  adImpressionsPerFreeUser: number;
  tipCommissionRate: number;
  tipFeePassedToDonor: boolean;
  sponsoringDeliveryCostRate: number;
}

export type RightsHolderTaxStatus =
  | 'RESIDENT_INDIVIDUAL'
  | 'RESIDENT_COMPANY'
  | 'FOREIGN_TREATY'
  | 'FOREIGN_NO_TREATY'
  | 'COLLECTIVE_SOCIETY';

export const DEFAULT_ROYALTY_SETTINGS: RoyaltySettings = {
  vatRegime: 'FRANCHISE',
  vatRate: 0.18,
  cssRate: 0.01,
  applyCssWithVat: true,
  vatThresholdHt: 60_000_000,
  paymentFeeRate: {
    MOBILE_MONEY: 0.02,
    CARD: 0.02,
    DIRECT_CARRIER_BILLING: 0.4,
  },
  rightsHoldersShare: 0.6,
  masterShareOfRights: 0.8,
  performerShareOfMaster: 0.5,
  engineerShareOfMaster: 0.05,
  lyricistShareOfAuthorship: 0.5,
  capPerStream: 15,
  maxCountedSecondsPerStream: 300,
  countWeight: 0.5,
  payoutThreshold: 5_000,
  disbursementFeeRate: 0.01,
  withholdingRates: {
    RESIDENT_INDIVIDUAL: 0.095,
    RESIDENT_COMPANY: 0,
    FOREIGN_TREATY: 0.1,
    FOREIGN_NO_TREATY: 0.2,
    COLLECTIVE_SOCIETY: 0,
  },
  adCpm: 800,
  adFillRate: 0.45,
  adImpressionsPerFreeUser: 24,
  tipCommissionRate: 0.1,
  tipFeePassedToDonor: true,
  sponsoringDeliveryCostRate: 0.15,
};

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  MOBILE_MONEY: 'Mobile Money (Airtel / Moov)',
  CARD: 'Carte bancaire',
  DIRECT_CARRIER_BILLING: 'Crédit téléphonique (DCB)',
};

export const TAX_STATUS_LABELS: Record<RightsHolderTaxStatus, string> = {
  RESIDENT_INDIVIDUAL: 'Personne physique résidente (précompte BNC)',
  RESIDENT_COMPANY: 'Société résidente (IS)',
  FOREIGN_TREATY: 'Non-résident sous convention',
  FOREIGN_NO_TREATY: 'Non-résident hors convention',
  COLLECTIVE_SOCIETY: 'Société de gestion collective (BUGADA)',
};

