/**
 * Lot 4 — Moteur Royalties User-Centric & Fiscalité DGI/BUGADA (`features/royalties`)
 * Regroupe le moteur mathématique 60/40, le bordereau BUGADA 12%, la retenue BNC DGI (9,5% / 20%)
 * et le simulateur financier dynamique sur 36 mois.
 */
export { buildRoyaltyLedger } from './royaltyLedger';
export {
  useRoyaltyLedgerState,
  type StatsBaseline,
} from './royaltyLedgerStore';
export { BugadaRoyaltiesAdminPanel } from './BugadaRoyaltiesAdminPanel';
export { TelecomCemacCompliancePanel } from './TelecomCemacCompliancePanel';
export { TrackRoyaltySplitBadge } from './TrackRoyaltySplitBadge';

