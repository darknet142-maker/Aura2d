import type { PayoutStatement } from './payoutEngine';
import { RIGHTS_ROLE_LABELS, type RightsLine } from './rightsSplitEngine';
import { TAX_STATUS_LABELS } from './economicConfig';

const SEPARATOR = ';';

function escapeCsv(value: string | number): string {
  const text = typeof value === 'number' ? value.toFixed(2).replace('.', ',') : value;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(header: string[], rows: (string | number)[][]): string {
  const body = [header, ...rows].map((r) => r.map(escapeCsv).join(SEPARATOR)).join('\r\n');
  return `\uFEFF${body}`;
}

/**
 * Relevé numérique certifié destiné au BUGADA (format CRD simplifié, compatible tableur) :
 * une ligne par œuvre (ISRC) et par bénéficiaire auteur / compositeur.
 */
export function buildBugadaCrdCsv(period: string, lines: RightsLine[]): string {
  const rows = lines
    .filter((l) => l.stratum === 'AUTHORSHIP_BUGADA')
    .map((l) => [
      period,
      l.isrc ?? 'ISRC NON ATTRIBUÉ',
      l.trackId,
      l.trackTitle,
      l.holderName,
      RIGHTS_ROLE_LABELS[l.role],
      l.amount,
    ]);
  return toCsv(
    ['Période', 'ISRC', 'ID DROP', 'Titre', 'Ayant droit', 'Rôle', 'Montant (FCFA)'],
    rows
  );
}

/** Journal des paiements directs (droits voisins) avec précomptes à reverser à la DGI. */
export function buildPayoutLedgerCsv(period: string, statements: PayoutStatement[]): string {
  const rows = statements.map((s) => [
    period,
    s.holderName,
    s.roles.map((r) => RIGHTS_ROLE_LABELS[r]).join(' / '),
    TAX_STATUS_LABELS[s.taxStatus],
    s.previousBalance,
    s.periodGross,
    s.totalGross,
    s.withholding,
    s.disbursementFee,
    s.netPayable,
    s.status === 'PAYABLE' ? 'À payer' : 'Reporté (< seuil)',
  ]);
  return toCsv(
    [
      'Période',
      'Ayant droit',
      'Rôles',
      'Statut fiscal',
      'Solde reporté',
      'Brut période',
      'Brut total',
      'Retenue à la source',
      'Frais de décaissement',
      'Net à verser',
      'Statut',
    ],
    rows
  );
}

/** Déclenche le téléchargement d'un fichier CSV généré côté client. */
export function downloadCsv(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

