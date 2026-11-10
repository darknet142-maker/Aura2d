export type MobileMoneyOperator = 'AIRTEL' | 'MOOV';

export interface GabonPhoneValidationResult {
  isValid: boolean;
  operator: MobileMoneyOperator | null;
  normalizedPhone: string;
  error?: string;
}

export interface DirectPaymentReceipt {
  txnId: string;
  operator: MobileMoneyOperator | 'CARD';
  phoneOrCard: string;
  amountFcfa: number;
  timestampIso: string;
  planTier: 'PREMIUM_MENSUEL' | 'PASS_HEBDO';
}

export function validateGabonMobileMoneyPhone(
  rawPhone: string,
  preferredOperator?: MobileMoneyOperator
): GabonPhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, operator: null, normalizedPhone: '', error: 'Numéro de téléphone requis.' };
  }

  // Nettoyage des espaces, tirets, parenthèses
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');

  // Retrait de l'indicatif international
  if (cleaned.startsWith('+241')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('00241')) {
    cleaned = cleaned.slice(5);
  }

  // Format Gabon : 8 ou 9 chiffres
  if (cleaned.length === 9 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length !== 8) {
    return {
      isValid: false,
      operator: null,
      normalizedPhone: rawPhone,
      error: 'Un numéro gabonais valide comporte 8 chiffres (hors indicatif +241).',
    };
  }

  const prefix2 = cleaned.slice(0, 2);
  let detectedOperator: MobileMoneyOperator | null = null;

  // Préfixes Airtel Gabon : 74, 77, 76, 04
  if (['74', '77', '76', '04', '40', '41', '42'].includes(prefix2)) {
    detectedOperator = 'AIRTEL';
  }
  // Préfixes Moov Africa Gabon : 62, 66, 65, 60, 02, 06
  else if (['62', '66', '65', '60', '02', '06'].includes(prefix2)) {
    detectedOperator = 'MOOV';
  } else {
    return {
      isValid: false,
      operator: null,
      normalizedPhone: rawPhone,
      error: `Préfixe « ${prefix2} » non reconnu chez Airtel (+241 74/77) ou Moov (+241 62/66).`,
    };
  }

  if (preferredOperator && detectedOperator !== preferredOperator) {
    return {
      isValid: false,
      operator: detectedOperator,
      normalizedPhone: `+241 ${cleaned}`,
      error: `Ce numéro appartient au réseau ${detectedOperator}, veuillez sélectionner l'opérateur correspondant.`,
    };
  }

  const formatted = `+241 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
  return {
    isValid: true,
    operator: detectedOperator,
    normalizedPhone: formatted,
  };
}

export function validateAntiHybridRule(
  directAmountFcfa: number,
  tokensAmount: number
): { allowed: boolean; error?: string } {
  if (directAmountFcfa > 0 && tokensAmount > 0) {
    return {
      allowed: false,
      error: 'Règle Anti-Hybride : Le cumul monnaie réelle + jetons est strictement interdit. Choisissez 100% Mobile Money ou 100% Jetons.',
    };
  }
  if (directAmountFcfa <= 0 && tokensAmount <= 0) {
    return {
      allowed: false,
      error: 'Montant invalide : vous devez sélectionner une formule payante ou en jetons.',
    };
  }
  return { allowed: true };
}

export function processDirectMobileMoneyPayment(params: {
  phone: string;
  operator: MobileMoneyOperator;
  planTier: 'PREMIUM_MENSUEL' | 'PASS_HEBDO';
  priceFcfa: number;
}): { success: boolean; receipt?: DirectPaymentReceipt; error?: string } {
  const validation = validateGabonMobileMoneyPhone(params.phone, params.operator);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const antiHybrid = validateAntiHybridRule(params.priceFcfa, 0);
  if (!antiHybrid.allowed) {
    return { success: false, error: antiHybrid.error };
  }

  const txnId = `TXN-${params.operator === 'AIRTEL' ? 'ATM' : 'MOV'}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const receipt: DirectPaymentReceipt = {
    txnId,
    operator: params.operator,
    phoneOrCard: validation.normalizedPhone,
    amountFcfa: params.priceFcfa,
    timestampIso: new Date().toISOString(),
    planTier: params.planTier,
  };

  return { success: true, receipt };
}
