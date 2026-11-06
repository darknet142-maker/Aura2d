const fcfaFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XAF',
  maximumFractionDigits: 0,
});

const fcfaPreciseFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XAF',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 2,
});

export const formatFcfa = (value: number): string => fcfaFormatter.format(value);
export const formatFcfaPrecise = (value: number): string => fcfaPreciseFormatter.format(value);
export const formatInteger = (value: number): string =>
  Number.isFinite(value) ? integerFormatter.format(value) : '—';
export const formatPercent = (ratio: number): string => percentFormatter.format(ratio);

/** Période comptable au format AAAA-MM (fuseau Africa/Libreville). */
export function currentAccountingPeriod(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Africa/Libreville',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? String(date.getFullYear());
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(year, (month || 1) - 1, 1)
  );
}

