import {
  LISTENER_OFFERS,
  type ListenerPlanId,
  type PaymentChannel,
  type RightsHolderTaxStatus,
  type RoyaltySettings,
} from '../economics/economicConfig';
import { computeNetBase, sumNetBases, EMPTY_NET_BASE, type NetBaseBreakdown } from '../economics/fiscalEngine';
import {
  computeUserCentricRoyalties,
  type FreeListenerInput,
  type ListeningEntry,
  type PayingListenerInput,
  type UserCentricResult,
} from '../economics/userCentricEngine';
import { splitAllRights, type RightsLine, type TrackRightsMeta } from '../economics/rightsSplitEngine';
import {
  buildBugadaRemittance,
  buildPayoutStatements,
  totalWithholdingDue,
  type BugadaRemittance,
  type PayoutStatement,
} from '../economics/payoutEngine';
import type { StatsBaseline } from './royaltyLedgerStore';

export interface ListenerBilling {
  plan: ListenerPlanId;
  channel: PaymentChannel;
  /** Nombre de Pass 7 jours achetés sur la période (Pass hebdomadaire uniquement). */
  passesPurchased?: number;
}

export interface LedgerTrack extends Omit<TrackRightsMeta, 'trackId'> {
  id: string;
  gabonTerritoryPct?: number;
}

export interface LedgerListener {
  id: string;
  name: string;
  billing?: ListenerBilling;
  trackStats: Record<string, { trackId: string; listenSeconds: number; playsCount: number }>;
}

export interface RoyaltyLedger {
  subscriptions: NetBaseBreakdown;
  ads: NetBaseBreakdown;
  total: NetBaseBreakdown;
  planCounts: Record<ListenerPlanId, number>;
  userCentric: UserCentricResult;
  rightsLines: RightsLine[];
  statements: PayoutStatement[];
  bugada: BugadaRemittance;
  withholdingDue: number;
}

const DEFAULT_BILLING: ListenerBilling = { plan: 'FREE', channel: 'MOBILE_MONEY' };

export function periodGrossForBilling(billing: ListenerBilling): number {
  const offer = LISTENER_OFFERS[billing.plan];
  if (billing.plan === 'PASS_7J') return offer.priceTtc * Math.max(1, billing.passesPurchased ?? 1);
  return offer.priceTtc;
}

/** Écoutes de la période = cumul actuel − instantané pris à la dernière clôture. */
function periodEntries(listener: LedgerListener, baseline: StatsBaseline): ListeningEntry[] {
  const base = baseline[listener.id] ?? {};
  return Object.values(listener.trackStats).map((stat) => ({
    trackId: stat.trackId,
    validStreams: Math.max(0, stat.playsCount - (base[stat.trackId]?.plays ?? 0)),
    listenSeconds: Math.max(0, stat.listenSeconds - (base[stat.trackId]?.seconds ?? 0)),
  }));
}

export function buildRoyaltyLedger(params: {
  tracks: LedgerTrack[];
  listeners: LedgerListener[];
  settings: RoyaltySettings;
  baseline: StatsBaseline;
  previousBalances: Record<string, number>;
  taxStatusOverrides: Record<string, RightsHolderTaxStatus>;
}): RoyaltyLedger {
  const { tracks, listeners, settings, baseline, previousBalances, taxStatusOverrides } = params;
  const planCounts: Record<ListenerPlanId, number> = { FREE: 0, PASS_7J: 0, PREMIUM_MENSUEL: 0 };
  const payingListeners: PayingListenerInput[] = [];
  const freeListeners: FreeListenerInput[] = [];
  const subscriptionBases: NetBaseBreakdown[] = [];

  listeners.forEach((listener) => {
    const billing = listener.billing ?? DEFAULT_BILLING;
    planCounts[billing.plan] += 1;
    const entries = periodEntries(listener, baseline);
    if (billing.plan === 'FREE') {
      freeListeners.push({ listenerId: listener.id, entries });
      return;
    }
    const net = computeNetBase(periodGrossForBilling(billing), billing.channel, settings);
    subscriptionBases.push(net);
    payingListeners.push({ listenerId: listener.id, rightsPool: net.rightsHoldersPool, entries });
  });

  const adGross =
    ((planCounts.FREE * settings.adImpressionsPerFreeUser * settings.adFillRate) / 1000) *
    settings.adCpm;
  const ads = adGross > 0 ? computeNetBase(adGross, 'MOBILE_MONEY', settings) : EMPTY_NET_BASE;
  const subscriptions = sumNetBases(subscriptionBases);

  const userCentric = computeUserCentricRoyalties({
    payingListeners,
    freeListeners,
    adRightsPool: ads.rightsHoldersPool,
    tracks: tracks.map((t) => ({
      trackId: t.id,
      artist: t.artist,
      isNational: (t.gabonTerritoryPct ?? 100) >= 70,
    })),
    settings,
  });

  const rightsLines = splitAllRights(
    userCentric.allocations,
    tracks.map((t) => ({ ...t, trackId: t.id })),
    settings
  );
  const statements = buildPayoutStatements({
    lines: rightsLines,
    settings,
    previousBalances,
    taxStatusOverrides,
  });

  return {
    subscriptions,
    ads,
    total: sumNetBases([subscriptions, ads]),
    planCounts,
    userCentric,
    rightsLines,
    statements,
    bugada: buildBugadaRemittance(rightsLines),
    withholdingDue: totalWithholdingDue(statements),
  };
}

