import type { RightsHolderTaxStatus, RoyaltySettings } from './economicConfig';
import type { RightsLine, RightsRole } from './rightsSplitEngine';

export type PayoutStatus = 'PAYABLE' | 'CARRIED_OVER';

export interface PayoutStatement {
  holderName: string;
  roles: RightsRole[];
  taxStatus: RightsHolderTaxStatus;
  trackCount: number;
  previousBalance: number;
  periodGross: number;
  totalGross: number;
  withholding: number;
  disbursementFee: number;
  netPayable: number;
  status: PayoutStatus;
}

export interface BugadaRemittance {
  totalAuthorship: number;
  beneficiaries: { holderName: string; roles: RightsRole[]; amount: number }[];
  trackCount: number;
  missingIsrcCount: number;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function defaultTaxStatus(roles: RightsRole[]): RightsHolderTaxStatus {
  return roles.includes('MASTER_OWNER') ? 'RESIDENT_COMPANY' : 'RESIDENT_INDIVIDUAL';
}

/**
 * Relevés des droits voisins payés en direct : seuil de 5 000 FCFA avec report sans annulation,
 * précompte BNC / retenue non-résident et frais de décaissement Mobile Money déduits du retrait.
 */
export function buildPayoutStatements(params: {
  lines: RightsLine[];
  settings: RoyaltySettings;
  previousBalances: Record<string, number>;
  taxStatusOverrides: Record<string, RightsHolderTaxStatus>;
}): PayoutStatement[] {
  const { lines, settings, previousBalances, taxStatusOverrides } = params;
  const grouped = new Map<string, { roles: Set<RightsRole>; tracks: Set<string>; gross: number }>();

  lines
    .filter((l) => l.stratum === 'MASTER_DIRECT')
    .forEach((l) => {
      const g = grouped.get(l.holderName) ?? { roles: new Set(), tracks: new Set(), gross: 0 };
      g.roles.add(l.role);
      g.tracks.add(l.trackId);
      g.gross += l.amount;
      grouped.set(l.holderName, g);
    });

  Object.keys(previousBalances).forEach((holder) => {
    if (!grouped.has(holder) && previousBalances[holder] > 0) {
      grouped.set(holder, { roles: new Set(), tracks: new Set(), gross: 0 });
    }
  });

  return Array.from(grouped.entries())
    .map(([holderName, g]) => {
      const roles = Array.from(g.roles);
      const taxStatus = taxStatusOverrides[holderName] ?? defaultTaxStatus(roles);
      const previousBalance = round2(previousBalances[holderName] ?? 0);
      const totalGross = round2(previousBalance + g.gross);
      const payable = totalGross >= settings.payoutThreshold;
      const withholding = payable ? round2(totalGross * settings.withholdingRates[taxStatus]) : 0;
      const disbursementFee = payable
        ? round2((totalGross - withholding) * settings.disbursementFeeRate)
        : 0;
      return {
        holderName,
        roles,
        taxStatus,
        trackCount: g.tracks.size,
        previousBalance,
        periodGross: round2(g.gross),
        totalGross,
        withholding,
        disbursementFee,
        netPayable: payable ? round2(totalGross - withholding - disbursementFee) : 0,
        status: payable ? ('PAYABLE' as const) : ('CARRIED_OVER' as const),
      };
    })
    .sort((a, b) => b.totalGross - a.totalGross);
}

/** Part droits d'auteur / édition (12 %) reversée au BUGADA avec le détail par bénéficiaire. */
export function buildBugadaRemittance(lines: RightsLine[]): BugadaRemittance {
  const authorship = lines.filter((l) => l.stratum === 'AUTHORSHIP_BUGADA');
  const grouped = new Map<string, { roles: Set<RightsRole>; amount: number }>();
  authorship.forEach((l) => {
    const g = grouped.get(l.holderName) ?? { roles: new Set(), amount: 0 };
    g.roles.add(l.role);
    g.amount += l.amount;
    grouped.set(l.holderName, g);
  });
  const trackIds = new Set(authorship.map((l) => l.trackId));
  const missingIsrc = new Set(authorship.filter((l) => !l.isrc).map((l) => l.trackId));
  return {
    totalAuthorship: round2(authorship.reduce((s, l) => s + l.amount, 0)),
    beneficiaries: Array.from(grouped.entries())
      .map(([holderName, g]) => ({
        holderName,
        roles: Array.from(g.roles),
        amount: round2(g.amount),
      }))
      .sort((a, b) => b.amount - a.amount),
    trackCount: trackIds.size,
    missingIsrcCount: missingIsrc.size,
  };
}

/** Prélèvements à reverser au Trésor public (précomptes BNC et retenues non-résidents). */
export function totalWithholdingDue(statements: PayoutStatement[]): number {
  return round2(statements.reduce((s, st) => s + st.withholding, 0));
}

