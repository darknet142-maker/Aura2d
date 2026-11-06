import type { RoyaltySettings } from './economicConfig';

export interface ListeningEntry {
  trackId: string;
  validStreams: number;
  listenSeconds: number;
}

export interface PayingListenerInput {
  listenerId: string;
  /** Enveloppe ayants droit (60 % de la base nette) générée par cet abonné sur la période. */
  rightsPool: number;
  entries: ListeningEntry[];
}

export interface FreeListenerInput {
  listenerId: string;
  entries: ListeningEntry[];
}

export interface TrackMeta {
  trackId: string;
  artist: string;
  isNational: boolean;
}

export interface TrackAllocation {
  trackId: string;
  validStreams: number;
  fromSubscriptions: number;
  fromAdPool: number;
  fromEmergingFund: number;
  fromZeroStreamPool: number;
  total: number;
}

export interface ListenerAllocationSummary {
  listenerId: string;
  rightsPool: number;
  validStreams: number;
  allocated: number;
  cappedSurplus: number;
  isZeroStream: boolean;
}

export interface UserCentricResult {
  allocations: TrackAllocation[];
  listeners: ListenerAllocationSummary[];
  subscriptionPool: number;
  adPool: number;
  emergingFund: number;
  zeroStreamPool: number;
  emergingArtists: string[];
  /** Montant conservé en séquestre faute d'écoutes nationales éligibles (reporté au mois suivant). */
  escrowCarryOver: number;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

function emptyAllocation(trackId: string): TrackAllocation {
  return {
    trackId,
    validStreams: 0,
    fromSubscriptions: 0,
    fromAdPool: 0,
    fromEmergingFund: 0,
    fromZeroStreamPool: 0,
    total: 0,
  };
}

/** Pondération hybride : X % au nombre d'écoutes valides, le reste à la durée plafonnée par écoute. */
function computeBasketWeights(
  entries: ListeningEntry[],
  settings: RoyaltySettings
): Map<string, number> {
  const eligible = entries.filter((e) => e.validStreams > 0);
  const totalStreams = eligible.reduce((s, e) => s + e.validStreams, 0);
  const cappedSeconds = eligible.map((e) =>
    Math.min(e.listenSeconds, e.validStreams * settings.maxCountedSecondsPerStream)
  );
  const totalSeconds = cappedSeconds.reduce((s, v) => s + v, 0);
  const weights = new Map<string, number>();
  if (totalStreams === 0) return weights;

  eligible.forEach((entry, idx) => {
    const countPart = entry.validStreams / totalStreams;
    const durationPart = totalSeconds > 0 ? cappedSeconds[idx] / totalSeconds : countPart;
    const w = settings.countWeight * countPart + (1 - settings.countWeight) * durationPart;
    weights.set(entry.trackId, (weights.get(entry.trackId) ?? 0) + w);
  });
  return weights;
}

/** Distribue un montant au prorata des écoutes d'un ensemble de pistes. */
function distributeProRata(
  amount: number,
  streamsByTrack: Map<string, number>
): Map<string, number> {
  const total = Array.from(streamsByTrack.values()).reduce((s, v) => s + v, 0);
  const out = new Map<string, number>();
  if (total <= 0 || amount <= 0) return out;
  streamsByTrack.forEach((streams, trackId) => out.set(trackId, (amount * streams) / total));
  return out;
}

function selectEmergingArtists(streamsByArtist: Map<string, number>): string[] {
  const sorted = Array.from(streamsByArtist.entries()).sort((a, b) => a[1] - b[1]);
  if (sorted.length === 0) return [];
  const median = sorted[Math.floor((sorted.length - 1) / 2)][1];
  return sorted.filter(([, streams]) => streams <= median).map(([artist]) => artist);
}

/**
 * Moteur de répartition User-Centric (UCPS) sécurisé :
 * 1. Pot individuel de chaque abonné ventilé selon son propre panier d'écoute.
 * 2. Plafond unitaire par écoute (anti « Single-Stream Hijacking ») → excédent vers le fonds émergents.
 * 3. Abonnés à écoute nulle → reversés au prorata du catalogue national.
 * 4. Fonds publicitaire distinct réparti au prorata des écoutes gratuites.
 */
export function computeUserCentricRoyalties(params: {
  payingListeners: PayingListenerInput[];
  freeListeners: FreeListenerInput[];
  adRightsPool: number;
  tracks: TrackMeta[];
  settings: RoyaltySettings;
}): UserCentricResult {
  const { payingListeners, freeListeners, adRightsPool, tracks, settings } = params;
  const meta = new Map(tracks.map((t) => [t.trackId, t]));
  const allocations = new Map<string, TrackAllocation>();
  const nationalStreams = new Map<string, number>();
  const getAlloc = (trackId: string): TrackAllocation => {
    const existing = allocations.get(trackId);
    if (existing) return existing;
    const created = emptyAllocation(trackId);
    allocations.set(trackId, created);
    return created;
  };

  const registerStreams = (entries: ListeningEntry[]) => {
    entries.forEach((e) => {
      if (e.validStreams <= 0 || !meta.has(e.trackId)) return;
      getAlloc(e.trackId).validStreams += e.validStreams;
      if (meta.get(e.trackId)?.isNational) {
        nationalStreams.set(e.trackId, (nationalStreams.get(e.trackId) ?? 0) + e.validStreams);
      }
    });
  };
  payingListeners.forEach((l) => registerStreams(l.entries));
  freeListeners.forEach((l) => registerStreams(l.entries));

  let emergingFund = 0;
  let zeroStreamPool = 0;
  const listenerSummaries: ListenerAllocationSummary[] = payingListeners.map((listener) => {
    const entries = listener.entries.filter((e) => meta.has(e.trackId));
    const weights = computeBasketWeights(entries, settings);
    const streams = entries.reduce((s, e) => s + Math.max(0, e.validStreams), 0);
    if (weights.size === 0) {
      zeroStreamPool += listener.rightsPool;
      return {
        listenerId: listener.listenerId,
        rightsPool: listener.rightsPool,
        validStreams: 0,
        allocated: 0,
        cappedSurplus: 0,
        isZeroStream: true,
      };
    }
    let allocated = 0;
    let surplus = 0;
    weights.forEach((weight, trackId) => {
      const trackStreams = entries
        .filter((e) => e.trackId === trackId)
        .reduce((s, e) => s + e.validStreams, 0);
      const raw = listener.rightsPool * weight;
      const capped = Math.min(raw, trackStreams * settings.capPerStream);
      getAlloc(trackId).fromSubscriptions += capped;
      allocated += capped;
      surplus += raw - capped;
    });
    emergingFund += surplus;
    return {
      listenerId: listener.listenerId,
      rightsPool: listener.rightsPool,
      validStreams: streams,
      allocated: round2(allocated),
      cappedSurplus: round2(surplus),
      isZeroStream: false,
    };
  });

  const freeStreams = new Map<string, number>();
  freeListeners.forEach((l) =>
    l.entries.forEach((e) => {
      if (e.validStreams > 0 && meta.has(e.trackId)) {
        freeStreams.set(e.trackId, (freeStreams.get(e.trackId) ?? 0) + e.validStreams);
      }
    })
  );
  let escrowCarryOver = 0;
  const adShares = distributeProRata(adRightsPool, freeStreams);
  if (adShares.size === 0) escrowCarryOver += adRightsPool;
  adShares.forEach((amount, trackId) => (getAlloc(trackId).fromAdPool += amount));

  const streamsByArtist = new Map<string, number>();
  nationalStreams.forEach((streams, trackId) => {
    const artist = meta.get(trackId)?.artist ?? '';
    streamsByArtist.set(artist, (streamsByArtist.get(artist) ?? 0) + streams);
  });
  const emergingArtists = selectEmergingArtists(streamsByArtist);
  const emergingStreams = new Map(
    Array.from(nationalStreams.entries()).filter(([trackId]) =>
      emergingArtists.includes(meta.get(trackId)?.artist ?? '')
    )
  );
  const emergingShares = distributeProRata(emergingFund, emergingStreams);
  if (emergingShares.size === 0) escrowCarryOver += emergingFund;
  emergingShares.forEach((amount, trackId) => (getAlloc(trackId).fromEmergingFund += amount));

  const zeroShares = distributeProRata(zeroStreamPool, nationalStreams);
  if (zeroShares.size === 0) escrowCarryOver += zeroStreamPool;
  zeroShares.forEach((amount, trackId) => (getAlloc(trackId).fromZeroStreamPool += amount));

  const finalAllocations = Array.from(allocations.values())
    .map((a) => ({
      ...a,
      fromSubscriptions: round2(a.fromSubscriptions),
      fromAdPool: round2(a.fromAdPool),
      fromEmergingFund: round2(a.fromEmergingFund),
      fromZeroStreamPool: round2(a.fromZeroStreamPool),
      total: round2(a.fromSubscriptions + a.fromAdPool + a.fromEmergingFund + a.fromZeroStreamPool),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    allocations: finalAllocations,
    listeners: listenerSummaries,
    subscriptionPool: round2(payingListeners.reduce((s, l) => s + l.rightsPool, 0)),
    adPool: round2(adRightsPool),
    emergingFund: round2(emergingFund),
    zeroStreamPool: round2(zeroStreamPool),
    emergingArtists,
    escrowCarryOver: round2(escrowCarryOver),
  };
}

