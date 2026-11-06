import type { RoyaltySettings } from './economicConfig';
import type { TrackAllocation } from './userCentricEngine';

export type RightsRole =
  | 'MAIN_PERFORMER'
  | 'FEATURED_PERFORMER'
  | 'MASTER_OWNER'
  | 'LYRICIST'
  | 'COMPOSER';

/** Droits voisins payés directement (gestion individuelle) vs droits d'auteur gérés par le BUGADA. */
export type RightsStratum = 'MASTER_DIRECT' | 'AUTHORSHIP_BUGADA';

export interface TrackRightsMeta {
  trackId: string;
  title: string;
  isrc?: string;
  artist: string;
  featuringArtists?: string[];
  featuringSplitMode?: '70_30' | '50_50';
  labelName: string;
  beatmakerName: string;
  lyricistName: string;
  isInstrumental?: boolean;
}

export interface RightsLine {
  trackId: string;
  trackTitle: string;
  isrc?: string;
  holderName: string;
  role: RightsRole;
  stratum: RightsStratum;
  amount: number;
}

export const RIGHTS_ROLE_LABELS: Record<RightsRole, string> = {
  MAIN_PERFORMER: 'Artiste principal',
  FEATURED_PERFORMER: 'Artiste en featuring',
  MASTER_OWNER: 'Producteur / Label (master)',
  LYRICIST: 'Auteur (paroles)',
  COMPOSER: 'Compositeur',
};

const SELF_PRODUCED_PATTERN = /ind[ée]pendant|auto[- ]?produit|self/i;

export function isSelfProduced(meta: TrackRightsMeta): boolean {
  const label = meta.labelName.trim();
  return label === '' || SELF_PRODUCED_PATTERN.test(label) || label === meta.artist.trim();
}

function performerShares(meta: TrackRightsMeta): { name: string; role: RightsRole; share: number }[] {
  const feats = (meta.featuringArtists ?? []).map((f) => f.trim()).filter(Boolean);
  if (feats.length === 0) return [{ name: meta.artist, role: 'MAIN_PERFORMER', share: 1 }];
  const mainShare = meta.featuringSplitMode === '50_50' ? 0.5 : 0.7;
  const featShare = (1 - mainShare) / feats.length;
  return [
    { name: meta.artist, role: 'MAIN_PERFORMER', share: mainShare },
    ...feats.map((name) => ({ name, role: 'FEATURED_PERFORMER' as const, share: featShare })),
  ];
}

function authorshipShares(
  meta: TrackRightsMeta,
  settings: RoyaltySettings
): { name: string; role: RightsRole; share: number }[] {
  const composer = meta.beatmakerName.trim() || meta.artist;
  const lyricist = meta.lyricistName.trim();
  if (meta.isInstrumental || lyricist === '') return [{ name: composer, role: 'COMPOSER', share: 1 }];
  return [
    { name: lyricist, role: 'LYRICIST', share: settings.lyricistShareOfAuthorship },
    { name: composer, role: 'COMPOSER', share: 1 - settings.lyricistShareOfAuthorship },
  ];
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** Ventile le montant d'une piste entre master (48 %) et droits d'auteur BUGADA (12 %). */
export function splitTrackRights(
  allocation: TrackAllocation,
  meta: TrackRightsMeta,
  settings: RoyaltySettings
): RightsLine[] {
  const base = { trackId: meta.trackId, trackTitle: meta.title, isrc: meta.isrc };
  const masterAmount = allocation.total * settings.masterShareOfRights;
  const authorshipAmount = allocation.total - masterAmount;
  const performerPart = isSelfProduced(meta) ? 1 : settings.performerShareOfMaster;
  const lines: RightsLine[] = [];

  if (performerPart < 1) {
    lines.push({
      ...base,
      holderName: meta.labelName,
      role: 'MASTER_OWNER',
      stratum: 'MASTER_DIRECT',
      amount: round2(masterAmount * (1 - performerPart)),
    });
  }
  performerShares(meta).forEach((p) =>
    lines.push({
      ...base,
      holderName: p.name,
      role: p.role,
      stratum: 'MASTER_DIRECT',
      amount: round2(masterAmount * performerPart * p.share),
    })
  );
  authorshipShares(meta, settings).forEach((a) =>
    lines.push({
      ...base,
      holderName: a.name,
      role: a.role,
      stratum: 'AUTHORSHIP_BUGADA',
      amount: round2(authorshipAmount * a.share),
    })
  );
  return lines;
}

export function splitAllRights(
  allocations: TrackAllocation[],
  metas: TrackRightsMeta[],
  settings: RoyaltySettings
): RightsLine[] {
  const byId = new Map(metas.map((m) => [m.trackId, m]));
  return allocations.flatMap((alloc) => {
    const meta = byId.get(alloc.trackId);
    return meta && alloc.total > 0 ? splitTrackRights(alloc, meta, settings) : [];
  });
}

