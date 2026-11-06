import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_ROYALTY_SETTINGS,
  type RightsHolderTaxStatus,
  type RoyaltySettings,
} from '../economics/economicConfig';
import type { PayoutStatement } from '../economics/payoutEngine';

export type StatsBaseline = Record<string, Record<string, { plays: number; seconds: number }>>;

export interface ClosedPeriodRecord {
  period: string;
  closedAt: string;
  holdersPaid: number;
  totalDirectNet: number;
  totalWithholding: number;
  totalDisbursementFees: number;
  bugadaTotal: number;
  carriedOverTotal: number;
}

export interface RoyaltyLedgerState {
  settings: RoyaltySettings;
  baseline: StatsBaseline;
  previousBalances: Record<string, number>;
  taxStatusOverrides: Record<string, RightsHolderTaxStatus>;
  closedPeriods: ClosedPeriodRecord[];
}

const STORAGE_KEY = 'drop_royalty_ledger_v1';

const INITIAL_STATE: RoyaltyLedgerState = {
  settings: DEFAULT_ROYALTY_SETTINGS,
  baseline: {},
  previousBalances: {},
  taxStatusOverrides: {},
  closedPeriods: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadState(): RoyaltyLedgerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return INITIAL_STATE;
    const settings = isRecord(parsed.settings) ? parsed.settings : {};
    return {
      settings: { ...DEFAULT_ROYALTY_SETTINGS, ...(settings as Partial<RoyaltySettings>) },
      baseline: isRecord(parsed.baseline) ? (parsed.baseline as StatsBaseline) : {},
      previousBalances: isRecord(parsed.previousBalances)
        ? (parsed.previousBalances as Record<string, number>)
        : {},
      taxStatusOverrides: isRecord(parsed.taxStatusOverrides)
        ? (parsed.taxStatusOverrides as Record<string, RightsHolderTaxStatus>)
        : {},
      closedPeriods: Array.isArray(parsed.closedPeriods)
        ? (parsed.closedPeriods as ClosedPeriodRecord[])
        : [],
    };
  } catch {
    return INITIAL_STATE;
  }
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function useRoyaltyLedgerState() {
  const [state, setState] = useState<RoyaltyLedgerState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota de stockage atteint : l'état reste disponible en mémoire pour la session.
    }
  }, [state]);

  const updateSettings = useCallback((patch: Partial<RoyaltySettings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resetSettings = useCallback(() => {
    setState((prev) => ({ ...prev, settings: DEFAULT_ROYALTY_SETTINGS }));
  }, []);

  const setTaxStatus = useCallback((holder: string, status: RightsHolderTaxStatus) => {
    setState((prev) => ({
      ...prev,
      taxStatusOverrides: { ...prev.taxStatusOverrides, [holder]: status },
    }));
  }, []);

  /**
   * Clôture comptable : fige les écoutes de la période (nouvel instantané), solde les relevés
   * payables et reporte sans annulation les soldes inférieurs au seuil de paiement.
   */
  const closePeriod = useCallback(
    (params: {
      period: string;
      statements: PayoutStatement[];
      bugadaTotal: number;
      currentStats: StatsBaseline;
    }) => {
      const payable = params.statements.filter((s) => s.status === 'PAYABLE');
      const carried = params.statements.filter((s) => s.status === 'CARRIED_OVER');
      const record: ClosedPeriodRecord = {
        period: params.period,
        closedAt: new Date().toISOString(),
        holdersPaid: payable.length,
        totalDirectNet: round2(payable.reduce((s, st) => s + st.netPayable, 0)),
        totalWithholding: round2(payable.reduce((s, st) => s + st.withholding, 0)),
        totalDisbursementFees: round2(payable.reduce((s, st) => s + st.disbursementFee, 0)),
        bugadaTotal: params.bugadaTotal,
        carriedOverTotal: round2(carried.reduce((s, st) => s + st.totalGross, 0)),
      };
      setState((prev) => ({
        ...prev,
        baseline: params.currentStats,
        previousBalances: Object.fromEntries(carried.map((s) => [s.holderName, s.totalGross])),
        closedPeriods: [record, ...prev.closedPeriods].slice(0, 36),
      }));
      return record;
    },
    []
  );

  return { state, updateSettings, resetSettings, setTaxStatus, closePeriod };
}

