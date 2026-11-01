import React, { useState } from 'react';
import {
  CoverArtwork,
  ArtworkType,
  RankMedalSvg,
} from './CoverArtwork';
import { LyricLine } from './Immersive3DPlayer';
import {
  CertificationInfo,
  DecoupledEntityRanking,
  FeaturingSplitMode,
  TrackCreditHandshake,
  GABON_PASS_SPECS,
  getTrackCertification,
  getAlbumCertification,
} from '../utils/rankingEngine';
import {
  GabonSubscriptionPass,
  GabonNetworkOperator,
} from '../services/offlineStreamTracker';

export type StudioEntityRole =
  | 'ARTIST'
  | 'LABEL'
  | 'BEATMAKER'
  | 'ENGINEER'
  | 'LYRICIST';

export interface AnalyticsTrackItem {
  id: string;
  title: string;
  artist: string;
  featuringArtists?: string[];
  featuringSplitMode?: FeaturingSplitMode;
  album: string;
  category: string;
  labelName: string;
  copyrightText?: string;
  beatmakerName: string;
  soundEngineerName: string;
  recordingEngineerName?: string;
  mixingEngineerName?: string;
  masteringEngineerName?: string;
  lyricistName?: string;
  isExternalLyricist?: boolean;
  hasSynchronizedLyrics?: boolean;
  gabonTerritoryPct?: number;
  weeksInTop10?: number;
  isPreAlbumSingleOver6Months?: boolean;
  lufsMasterLevel?: number;
  acousticClippingDetected?: boolean;
  retention45sPct?: number;
  halfLifeRetentionJ90Pct?: number;
  creditHandshake?: TrackCreditHandshake;
  cover: string;
  artworkType?: ArtworkType;
  ambientPrimary?: string;
  ambientSecondary?: string;
  lyrics?: LyricLine[];
  duration: number;
  dropStart: number;
  dropDuration: number;
  bpm: number;
  realPlays: number;
  displayPlaysFormatted?: string;
  lastActivityAgo: string;
  totalListenSeconds: number;
  listenSessions: number;
  avgRetentionPct: number;
  retention30sPct?: number;
  algoPoints: number;
  likesCount: number;
  loopPlaysCount: number;
  recommendationsCount?: number;
  lyricsOpensCount?: number;
  lyricsSharesCount?: number;
  longevityDays?: number;
  consecutiveLoops: number;
  baselineRank: number;
  artistBaselinePlays?: number;
  downloadedOffline?: boolean;
  inPlaylist?: boolean;
}

export interface AnalyticsAlbumNode {
  id: string;
  artist: string;
  albumTitle: string;
  category: string;
  year: string;
  tracks: AnalyticsTrackItem[];
}

export interface AnalyticsUserTrackStat {
  trackId: string;
  listenSeconds: number;
  playsCount: number;
  loopsCount: number;
  maxConsecutiveLoops: number;
  liked: boolean;
  pointsContributed: number;
  lastListenedAt: string;
}

export interface AnalyticsAppUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  joinedAt: string;
  avatar: string;
  totalLikes: number;
  totalListenSeconds: number;
  totalValidatedPlays: number;
  totalLoops: number;
  trackStats: Record<string, AnalyticsUserTrackStat>;
}

export function formatShortTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

export function formatLongListenDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${rem}s`;
  return `${rem}s`;
}

export function formatCompactNumber(val: number, preset?: string): string {
  if (preset && val <= 76000) return preset;
  if (val >= 1000000) return `${(val / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
  if (val >= 1000) return `${Math.round(val / 1000)}K`;
  return String(val);
}

/**
 * Badge Vectoriel SVG de Certification Nationale Gabonaise (Single / Album / Disque d'Artisan : Or, Platine, Diamant)
 */
export const CertificationBadgeSvg: React.FC<{
  cert: CertificationInfo;
  compact?: boolean;
}> = ({ cert, compact = false }) => {
  if (cert.level === 'NONE') return null;

  const styleMap = {
    GOLD: {
      bg: 'bg-amber-400/15 border-amber-400/45 text-amber-300',
      discFill: '#fbbf24',
      innerFill: '#78350f',
    },
    PLATINUM: {
      bg: 'bg-slate-200/15 border-slate-200/45 text-slate-100',
      discFill: '#e2e8f0',
      innerFill: '#334155',
    },
    DIAMOND: {
      bg: 'bg-cyan-400/20 border-cyan-300/55 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.28)]',
      discFill: '#67e8f9',
      innerFill: '#0e7490',
    },
  }[cert.level];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono font-bold shrink-0 ${
        compact ? 'px-1.5 py-0.5 text-[9.5px]' : 'px-2 py-0.5 text-[10.5px]'
      } ${styleMap.bg}`}
      title={`Certification Nationale Officielle : ${cert.label} (${cert.certificateHash})`}
    >
      {cert.level === 'DIAMOND' ? (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 3h12l4 6-10 12L2 9l4-6z"
            fill={styleMap.discFill}
            stroke="#cffafe"
            strokeWidth="1.5"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill={styleMap.discFill}
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="12" cy="12" r="3" fill={styleMap.innerFill} />
        </svg>
      )}
      <span>{compact ? cert.shortLabel : cert.label}</span>
    </span>
  );
};

/**
 * Générateur SVG de QR Code Infalsifiable lié au Registre Public des Certifications (SHA-256)
 */
export const OfficialQrCodeSvg: React.FC<{
  hash: string;
  size?: number;
}> = ({ hash, size = 84 }) => {
  const cells = 9;
  const grid: boolean[][] = [];
  for (let r = 0; r < cells; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cells; c++) {
      const isCorner =
        (r < 3 && c < 3) ||
        (r < 3 && c >= cells - 3) ||
        (r >= cells - 3 && c < 3);
      if (isCorner) {
        row.push(true);
      } else {
        const charCode = hash.charCodeAt((r * cells + c) % hash.length) || 65;
        row.push((charCode + r * 3 + c * 7) % 2 === 0);
      }
    }
    grid.push(row);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells + 2} ${cells + 2}`}
      className="rounded-xl bg-white p-1.5 border border-amber-400/50 shadow-md shrink-0"
    >
      <rect width={cells + 2} height={cells + 2} fill="#ffffff" rx="1" />
      {grid.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + 1}
              y={rIdx + 1}
              width={0.92}
              height={0.92}
              fill="#07080C"
              rx={0.12}
            />
          ) : null
        )
      )}
    </svg>
  );
};

export const RankBadgeSvg: React.FC<{ rank: number; delta: number }> = ({
  rank,
  delta,
}) => {
  const isTop3 = rank >= 1 && rank <= 3;
  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs shrink-0">
      <span
        className={`px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 ${
          rank === 1
            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
            : rank === 2
              ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
              : rank === 3
                ? 'bg-amber-700/25 text-amber-400 border border-amber-600/40'
                : 'bg-white/[0.06] text-[#F5F2EB] border border-white/[0.08]'
        }`}
      >
        <span>#{rank}</span>
        {isTop3 && <RankMedalSvg rank={rank} className="w-3.5 h-3.5" />}
      </span>
      {delta !== 0 && (
        <span
          className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
            delta > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {delta > 0 ? (
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 12 12">
              <path d="M6 2L11 10H1L6 2Z" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 12 12">
              <path d="M6 10L1 2H11L6 10Z" />
            </svg>
          )}
          <span>{delta > 0 ? `+${delta}` : delta}</span>
        </span>
      )}
    </div>
  );
};

/* ========================================================================= */
/* 1. SYNCHRONIZED MINI-PLAYER BAR (100% Unified with Main 3D Player)        */
/* ========================================================================= */
export interface SynchronizedMiniPlayerProps {
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    featuringArtists?: string[];
    cover: string;
    artworkType?: ArtworkType;
    duration: number;
    dropStart: number;
    dropDuration: number;
  };
  currentTime: number;
  isPlaying: boolean;
  isDropMode: boolean;
  rankInfo?: { rank: number; delta: number };
  onTogglePlay: () => void;
  onNavigateTrack: (dir: 1 | -1) => void;
  onExpandPlayer: () => void;
}

export const SynchronizedMiniPlayer: React.FC<SynchronizedMiniPlayerProps> = ({
  currentTrack,
  currentTime,
  isPlaying,
  isDropMode,
  rankInfo,
  onTogglePlay,
  onNavigateTrack,
  onExpandPlayer,
}) => {
  const duration = Math.max(1, currentTrack.duration);
  const progressPct = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  const dropStartPct = Math.min(
    100,
    Math.max(0, (currentTrack.dropStart / duration) * 100)
  );
  const dropWidthPct = Math.min(
    100 - dropStartPct,
    Math.max(4, (currentTrack.dropDuration / duration) * 100)
  );

  const artistLine =
    currentTrack.featuringArtists && currentTrack.featuringArtists.length > 0
      ? `${currentTrack.artist} feat. ${currentTrack.featuringArtists.join(', ')}`
      : currentTrack.artist;

  return (
    <div
      onClick={onExpandPlayer}
      className="relative overflow-hidden rounded-2xl bg-zinc-900/95 border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.75)] cursor-pointer hover:border-white/25 transition group"
    >
      {/* Barre de progression synchronisée en haut du Mini-Lecteur avec segment Drop */}
      <div className="relative h-1 w-full bg-white/10 overflow-hidden">
        <div
          style={{ left: `${dropStartPct}%`, width: `${dropWidthPct}%` }}
          className={`absolute top-0 bottom-0 ${
            isDropMode ? 'bg-amber-400/80' : 'bg-amber-400/40'
          }`}
        />
        <div
          style={{ width: `${progressPct}%` }}
          className="h-full bg-[#e11d38] transition-all duration-300"
        />
      </div>

      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
            <CoverArtwork
              artworkType={currentTrack.artworkType}
              coverUrl={currentTrack.cover}
              title={currentTrack.title}
              artist={currentTrack.artist}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {currentTrack.title}
              </p>
              {rankInfo && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-amber-300 shrink-0">
                  #{rankInfo.rank}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate mt-0.5">
              <span className="truncate">{artistLine}</span>
              <span>•</span>
              <span className="font-mono text-zinc-300 shrink-0">
                {formatShortTime(currentTime)} /{' '}
                {formatShortTime(currentTrack.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Contrôles de transport 100% synchronisés avec le lecteur principal */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onNavigateTrack(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-90 transition"
            aria-label="Titre précédent"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#e11d38] hover:bg-[#f02845] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(225,29,56,0.5)] active:scale-90 transition"
            aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateTrack(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-90 transition"
            aria-label="Titre suivant"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 2. REUSABLE TRACK DETAIL SHEET (User Pro & Studio Admin)                  */
/* ========================================================================= */
export interface ReusableTrackDetailSheetProps {
  track: AnalyticsTrackItem;
  album: AnalyticsAlbumNode;
  albumIndex: number;
  trackIndex: number;
  rankInfo: { rank: number; delta: number };
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  isRecommended?: boolean;
  isArtistSubscribed?: boolean;
  artistSubscribersCount?: number;
  isAdminView?: boolean;
  onClose: () => void;
  onPlayOrToggleTrack: (albumIdx: number, trackIdx: number) => void;
  onToggleLike: (trackId: string, e?: React.MouseEvent) => void;
  onRecommendTrack?: (trackId: string) => void;
  onToggleSubscribeArtist?: (artistName: string) => void;
  onOpenEntityProfile: (name: string, role: StudioEntityRole) => void;
  onConfirmCreditHandshake?: (
    trackId: string,
    roleKey:
      | 'beatmakerStatus'
      | 'recordingEngineerStatus'
      | 'mixingEngineerStatus'
      | 'masteringEngineerStatus'
      | 'lyricistStatus'
  ) => void;
  onOpenCreditDispute?: (trackId: string, reason: string) => void;
  onResolveCreditDispute?: (trackId: string) => void;
  onEditTrack?: () => void;
  onDeleteTrack?: () => void;
}

export const ReusableTrackDetailSheet: React.FC<
  ReusableTrackDetailSheetProps
> = ({
  track,
  album,
  albumIndex,
  trackIndex,
  rankInfo,
  isCurrentTrack,
  isPlaying,
  isLiked,
  isRecommended = false,
  isArtistSubscribed = false,
  artistSubscribersCount,
  isAdminView = false,
  onClose,
  onPlayOrToggleTrack,
  onToggleLike,
  onRecommendTrack,
  onToggleSubscribeArtist,
  onOpenEntityProfile,
  onConfirmCreditHandshake,
  onOpenCreditDispute,
  onResolveCreditDispute,
  onEditTrack,
  onDeleteTrack,
}) => {
  const [showQrCertificate, setShowQrCertificate] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReasonInput, setDisputeReasonInput] = useState(
    'Revendication de crédit studio (Contrat de cession / Stems DAW joints)'
  );

  const isThisTrackPlaying = isCurrentTrack && isPlaying;
  const gabonPct = track.gabonTerritoryPct ?? 86;
  const trackCert = getTrackCertification(track.realPlays, gabonPct, track.id);
  const albumCert = getAlbumCertification(album.tracks, gabonPct);
  const lyricistName = track.lyricistName || track.artist;
  const recEng = track.recordingEngineerName || track.soundEngineerName;
  const mixEng = track.mixingEngineerName || track.soundEngineerName;
  const mastEng = track.masteringEngineerName || track.soundEngineerName;
  const isExternalPlume =
    track.isExternalLyricist ??
    lyricistName.toLowerCase() !== track.artist.toLowerCase();

  // Détection Anti-Cumul Abusif (Audit DAW requis si 1 personne cumule Artiste + Beatmaker + Mix + Master)
  const samePersonAllRoles =
    track.artist.toLowerCase() === track.beatmakerName.toLowerCase() &&
    track.artist.toLowerCase() === mixEng.toLowerCase() &&
    track.artist.toLowerCase() === mastEng.toLowerCase();

  const hs: TrackCreditHandshake = track.creditHandshake || {
    beatmakerStatus: 'VALIDATED',
    recordingEngineerStatus: 'VALIDATED',
    mixingEngineerStatus: 'VALIDATED',
    masteringEngineerStatus: 'VALIDATED',
    lyricistStatus: 'VALIDATED',
  };
  const hasEscrow =
    hs.beatmakerStatus === 'DISPUTED_ESCROW' ||
    hs.mixingEngineerStatus === 'DISPUTED_ESCROW' ||
    hs.lyricistStatus === 'DISPUTED_ESCROW';

  const recsCount =
    track.recommendationsCount ?? Math.max(12, Math.round(track.realPlays * 0.018));
  const retention45s =
    track.retention45sPct ??
    track.retention30sPct ??
    Math.min(99, track.avgRetentionPct + 4);
  const lyricsOpens =
    track.lyricsOpensCount ?? Math.round(track.realPlays * 0.14);
  const lyricsShares =
    track.lyricsSharesCount ?? Math.round(track.realPlays * 0.022);

  const renderHandshakeBadge = (
    status: 'VALIDATED' | 'PENDING_HANDSHAKE' | 'DISPUTED_ESCROW',
    roleKey:
      | 'beatmakerStatus'
      | 'recordingEngineerStatus'
      | 'mixingEngineerStatus'
      | 'masteringEngineerStatus'
      | 'lyricistStatus'
  ) => {
    if (status === 'DISPUTED_ESCROW') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9.5px] font-mono font-bold">
          Sous Séquestre (0 pt)
        </span>
      );
    }
    if (status === 'PENDING_HANDSHAKE') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onConfirmCreditHandshake) {
              onConfirmCreditHandshake(track.id, roleKey);
            }
          }}
          className="px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-[9.5px] font-mono font-bold transition"
          title="Cliquer pour valider le Handshake Protocol de ce crédit"
        >
          Valider Handshake ✓
        </button>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[9.5px] font-mono">
        Handshake Validé
      </span>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.1] rounded-2xl p-3.5 sm:p-4 overflow-hidden gap-3.5 animate-fade-in">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5 shrink-0 transition"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <CertificationBadgeSvg cert={trackCert} />
          <button
            type="button"
            onClick={() => setShowQrCertificate((v) => !v)}
            className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold shrink-0 transition"
          >
            {showQrCertificate ? 'Masquer Certificat QR' : 'Certificat QR & Co-Certificats'}
          </button>
          <RankBadgeSvg rank={rankInfo.rank} delta={rankInfo.delta} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
        {/* Panneau Certificat Officiel avec QR Code Infalsifiable & Co-Certification d'Œuvre (Niveau 1) */}
        {showQrCertificate && (
          <div className="bg-gradient-to-br from-[#0B121E] via-[#07080C] to-[#120E1A] border border-amber-400/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  Registre Public National • Gabon (+241)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-mono">
                  Audit 72h : {trackCert.audit72hStatus === 'VERIFIED' ? 'VÉRIFIÉ ANTI-FRAUDE' : 'EN COURS (72H)'}
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[10px] font-mono">
                  Quota Gabon : {gabonPct}% (Min. 70% requis)
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {trackCert.level !== 'NONE'
                  ? `Certificat Officiel — ${trackCert.label}`
                  : `Attestation de Comptabilisation ECG — ${track.title}`}
              </h3>
              <p className="text-xs text-zinc-300 font-mono">
                Empreinte SHA-256 : <strong className="text-amber-300">{trackCert.certificateHash}</strong> • Volume validé :{' '}
                <strong className="text-white">{track.realPlays.toLocaleString('fr-FR')} ECG</strong>
              </p>
              <div className="pt-1.5 border-t border-white/10 text-[11px] text-zinc-300 space-y-1">
                <p className="font-semibold text-amber-200">
                  Niveau 1 — Co-Certificats Nominatifs d&apos;Œuvre générés automatiquement :
                </p>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white">
                    Interprète : {track.artist}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    Beatmaker : {track.beatmakerName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300">
                    Mix/Master : {mixEng} / {mastEng}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300">
                    Parolier : {lyricistName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
                    Label : {track.labelName}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0 self-center">
              <OfficialQrCodeSvg hash={trackCert.certificateHash} size={92} />
              <span className="text-[9.5px] font-mono text-amber-300">
                Scanner pour vérifier
              </span>
            </div>
          </div>
        )}

        {/* Track Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/15 shrink-0 shadow-lg">
              <CoverArtwork
                artworkType={track.artworkType}
                coverUrl={track.cover}
                title={track.title}
                artist={track.artist}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-[#DE1B34]/15 text-[#DE1B34] text-[10px] font-mono font-semibold">
                  {track.category}
                </span>
                <span className="text-[11px] text-[#8E93A4] truncate">
                  Projet : {album.albumTitle} ({album.year})
                </span>
                <CertificationBadgeSvg cert={albumCert} compact />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#F5F2EB] truncate mt-1">
                {track.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => onOpenEntityProfile(track.artist, 'ARTIST')}
                  className="text-xs sm:text-sm text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 truncate transition"
                >
                  <span className="truncate">{track.artist}</span>
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 18l6-6-6-6"
                    />
                  </svg>
                </button>

                {track.featuringArtists && track.featuringArtists.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      feat. ({track.featuringSplitMode === '50_50' ? 'Co-interprète 50/50' : '70% Principal / 30% Feat'})
                    </span>
                    {track.featuringArtists.map((feat) => (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => onOpenEntityProfile(feat, 'ARTIST')}
                        className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-amber-400/20 text-[11px] font-semibold text-amber-200 border border-white/10 transition"
                      >
                        {feat}
                      </button>
                    ))}
                  </div>
                )}

                {onToggleSubscribeArtist && (
                  <button
                    type="button"
                    onClick={() => onToggleSubscribeArtist(track.artist)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${
                      isArtistSubscribed
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                    }`}
                  >
                    <span>
                      {isArtistSubscribed ? 'Abonné ✓' : '+ S’abonner'}
                    </span>
                    {artistSubscribersCount !== undefined && (
                      <span className="font-mono opacity-85">
                        ({formatCompactNumber(artistSubscribersCount)})
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onPlayOrToggleTrack(albumIndex, trackIndex)}
              className="px-4 py-2 rounded-xl bg-[#DE1B34] hover:bg-[#f02845] text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_14px_rgba(222,27,52,0.4)] transition"
            >
              {isThisTrackPlaying ? (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                  <span>{isCurrentTrack ? 'Reprendre' : 'Lire le titre'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => onToggleLike(track.id, e)}
              className={`p-2 rounded-xl border transition ${
                isLiked
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/[0.05] border-white/[0.1] text-zinc-300 hover:text-white'
              }`}
              title={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <svg
                className="w-4 h-4"
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </button>

            {onRecommendTrack && (
              <button
                type="button"
                onClick={() => onRecommendTrack(track.id)}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  isRecommended
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-zinc-200'
                }`}
                title="Recommander ce titre dans le fil commun DROP"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                  />
                </svg>
                <span>Recommander ({recsCount})</span>
              </button>
            )}

            {isAdminView && onEditTrack && (
              <button
                type="button"
                onClick={onEditTrack}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#F5F2EB]"
                title="Modifier"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}

            {isAdminView && onDeleteTrack && (
              <button
                type="button"
                onClick={onDeleteTrack}
                className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400"
                title="Supprimer"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 4 Real-Time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#8E93A4]">
              Volume ECG Certifié ({gabonPct}% Gabon)
            </span>
            <div className="flex items-center justify-between">
              <svg
                className="w-4 h-4 text-[#DE1B34] fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="font-mono text-sm sm:text-base font-bold text-[#F5F2EB]">
                {formatCompactNumber(track.realPlays)} ECG
              </span>
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#8E93A4]">
              Recommandations &amp; Partages
            </span>
            <div className="flex items-center justify-between">
              <svg
                className="w-4 h-4 text-amber-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
                {recsCount.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#8E93A4]">
              Accroche 45s / Complétion
            </span>
            <div className="flex items-center justify-between">
              <svg
                className="w-4 h-4 text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                {retention45s}% / {track.avgRetentionPct}%
              </span>
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#8E93A4]">
              Engagement Paroles (J+90)
            </span>
            <div className="flex items-center justify-between">
              <svg
                className="w-4 h-4 text-violet-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
              </svg>
              <span className="font-mono text-sm sm:text-base font-bold text-violet-300">
                {formatCompactNumber(lyricsOpens)} ({lyricsShares} part.)
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Studio Credits & Gouvernance Handshake Protocol / Litiges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
                Crédits Studio &amp; Handshake Protocol (Pilier V)
              </span>
              {samePersonAllRoles && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[9.5px] font-mono font-bold">
                  Audit DAW requis (Cumul 4 rôles)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenEntityProfile(track.artist, 'ARTIST')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.05] text-xs transition"
            >
              <span className="text-[#8E93A4]">
                Artiste Principal ({track.featuringArtists?.length ? (track.featuringSplitMode === '50_50' ? '50%' : '70%') : '100%'})
              </span>
              <span className="font-semibold text-amber-300 flex items-center gap-1 truncate max-w-[180px]">
                <span className="truncate">{track.artist}</span>
                <span>→</span>
              </span>
            </button>

            {track.featuringArtists && track.featuringArtists.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs">
                <span className="text-[#8E93A4]">
                  Featuring ({track.featuringSplitMode === '50_50' ? '50% Co-prod' : '30% Partagé'})
                </span>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {track.featuringArtists.map((feat) => (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => onOpenEntityProfile(feat, 'ARTIST')}
                      className="px-2 py-0.5 rounded bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 font-semibold text-[11px] transition"
                    >
                      {feat} →
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs gap-2">
              <button
                type="button"
                onClick={() => onOpenEntityProfile(lyricistName, 'LYRICIST')}
                className="flex items-center gap-1.5 min-w-0 flex-1 text-left hover:text-violet-200 transition"
              >
                <span className="text-[#8E93A4] shrink-0">
                  Parolier {isExternalPlume ? '(Plume Externe x1,25)' : '(Auteur)'} :
                </span>
                <span className="font-semibold text-violet-300 truncate">
                  {lyricistName} →
                </span>
              </button>
              {renderHandshakeBadge(hs.lyricistStatus, 'lyricistStatus')}
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenEntityProfile(track.beatmakerName, 'BEATMAKER')
                }
                className="flex items-center gap-1.5 min-w-0 flex-1 text-left hover:text-emerald-200 transition"
              >
                <span className="text-[#8E93A4] shrink-0">Beatmaker :</span>
                <span className="font-semibold text-emerald-300 truncate">
                  {track.beatmakerName} →
                </span>
              </button>
              {renderHandshakeBadge(hs.beatmakerStatus, 'beatmakerStatus')}
            </div>

            {/* Sous-rôles Ingénieurs du Son : Prise (20%), Mixage (50%), Mastering (30%) */}
            <div className="p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono text-sky-300">
                  Ventilation Ingénierie Sonore (20% Prise / 50% Mix / 30% Master)
                </span>
                {renderHandshakeBadge(hs.mixingEngineerStatus, 'mixingEngineerStatus')}
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => onOpenEntityProfile(recEng, 'ENGINEER')}
                  className="p-1.5 rounded bg-white/[0.03] hover:bg-sky-500/15 border border-white/[0.06] text-left transition"
                >
                  <span className="text-[9.5px] font-mono text-zinc-400 block">
                    Prise voix (20%)
                  </span>
                  <span className="text-[11px] font-semibold text-sky-300 truncate block">
                    {recEng}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEntityProfile(mixEng, 'ENGINEER')}
                  className="p-1.5 rounded bg-white/[0.03] hover:bg-sky-500/15 border border-white/[0.06] text-left transition"
                >
                  <span className="text-[9.5px] font-mono text-zinc-400 block">
                    Mixage (50%)
                  </span>
                  <span className="text-[11px] font-semibold text-sky-300 truncate block">
                    {mixEng}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEntityProfile(mastEng, 'ENGINEER')}
                  className="p-1.5 rounded bg-white/[0.03] hover:bg-sky-500/15 border border-white/[0.06] text-left transition"
                >
                  <span className="text-[9.5px] font-mono text-zinc-400 block">
                    Mastering (30%)
                  </span>
                  <span className="text-[11px] font-semibold text-sky-300 truncate block">
                    {mastEng}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenEntityProfile(track.labelName, 'LABEL')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.05] text-xs transition"
            >
              <span className="text-[#8E93A4]">Label / Maison de Production</span>
              <span className="font-semibold text-[#F5F2EB] flex items-center gap-1 truncate max-w-[180px]">
                <span className="truncate">{track.labelName}</span>
                <span className="text-[#DE1B34]">→</span>
              </span>
            </button>

            {/* Bouton de revendication / Litige sous séquestre et Recalcul rétroactif */}
            <div className="pt-1 border-t border-white/10 flex flex-col gap-2">
              {hasEscrow ? (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300">
                      Litige ouvert — Points techniques sous séquestre
                    </span>
                    {onResolveCreditDispute && (
                      <button
                        type="button"
                        onClick={() => onResolveCreditDispute(track.id)}
                        className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10.5px] transition"
                      >
                        Résoudre &amp; Recalculer rétroactivement
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Motif : {hs.disputeReason || 'Vérification des pistes séparées DAW en cours'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDisputeForm((v) => !v)}
                    className="text-[11px] font-mono text-amber-300 hover:text-amber-200 underline"
                  >
                    Revendiquer un crédit / Ouvrir un litige (Mise sous séquestre)
                  </button>
                  {hs.retroactiveRecalcAppliedAt && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      Recalcul rétroactif exécuté ({hs.retroactiveRecalcAppliedAt})
                    </span>
                  )}
                </div>
              )}

              {showDisputeForm && !hasEscrow && onOpenCreditDispute && (
                <div className="p-2.5 rounded-xl bg-[#0D1017] border border-amber-400/30 space-y-2">
                  <input
                    type="text"
                    value={disputeReasonInput}
                    onChange={(e) => setDisputeReasonInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white"
                    placeholder="Motif du litige (ex: Contrat Beatmaker / Stems DAW)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreditDispute(track.id, disputeReasonInput);
                      setShowDisputeForm(false);
                    }}
                    className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                  >
                    Geler les points techniques sous séquestre
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col justify-between gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Certifications Nationales (ECG) &amp; Standard Acoustique
            </span>

            {/* Progression Certification Single (100K / 250K / 500K ECG) */}
            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Single : {trackCert.label}
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {trackCert.progressPct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  style={{ width: `${trackCert.progressPct}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-300"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8E93A4]">
                <span>Seuils Gabon : Or 100K • Platine 250K • Diamant 500K ECG</span>
                {trackCert.nextLevelLabel && (
                  <span className="text-amber-200">
                    Cible : {formatCompactNumber(trackCert.nextThreshold || 100000)} ECG
                  </span>
                )}
              </div>
            </div>

            {/* Règle Anti-Locomotive Album (300K / 750K / 1.5M ECG) */}
            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">
                  Projet « {album.albumTitle} » : {albumCert.shortLabel}
                </span>
                <span className="font-mono text-[11px] text-cyan-300">
                  {formatCompactNumber(albumCert.weightedEcgCount)} ECG pondérées
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400">
                Règle Anti-Locomotive : Top 2 titres comptés à 50% • Plafond 20%/titre (Seuils Album : 300K / 750K / 1,5M ECG)
              </p>
            </div>

            <div className="space-y-1.5 my-auto">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Mastering &amp; Normalisation</span>
                <span className="text-emerald-400 font-bold">
                  {track.lufsMasterLevel ?? -14.0} LUFS (Sans écrêtage)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Présence Top 10 &amp; Amortissement</span>
                <span className="text-amber-300 font-bold">
                  {track.weeksInTop10 ?? 4} sem. ({(track.weeksInTop10 ?? 4) > 10 ? `-${((track.weeksInTop10 ?? 4) - 10) * 5}% usure` : '0% abattement'})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Écoutes en boucle (Replay Rate)</span>
                <span className="text-amber-300 font-bold">
                  {track.loopPlaysCount.toLocaleString('fr-FR')}x boucles
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Temps d&apos;écoute cumulé</span>
                <span className="text-emerald-400 font-bold">
                  {formatLongListenDuration(track.totalListenSeconds)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 3. REUSABLE ARTIST & STUDIO COLLABORATOR ANALYTICS SHEET                  */
/* ========================================================================= */
export interface StudioEntityAnalyticsData {
  entityName: string;
  role: StudioEntityRole;
  primaryCategory: string;
  cover: string;
  artworkType?: ArtworkType;
  tracks: {
    track: AnalyticsTrackItem;
    albumIndex: number;
    trackIndex: number;
    isFeaturing?: boolean;
  }[];
  totalPlays: number;
  totalLoops: number;
  totalLikes: number;
  totalListenSeconds: number;
  avgRetention: number;
  decoupledRanking?: DecoupledEntityRanking;
  subscribersCount?: number;
  isSubscribed?: boolean;
  studioTeam: {
    artists: { name: string; role: StudioEntityRole; tracksCount: number }[];
    labels: { name: string; role: StudioEntityRole; tracksCount: number }[];
    beatmakers: { name: string; role: StudioEntityRole; tracksCount: number }[];
    engineers: { name: string; role: StudioEntityRole; tracksCount: number }[];
    lyricists?: { name: string; role: StudioEntityRole; tracksCount: number }[];
  };
  topListeners: {
    user: AnalyticsAppUser;
    listenSeconds: number;
    playsCount: number;
    loopsCount: number;
  }[];
}

export interface ReusableArtistDetailSheetProps {
  analytics: StudioEntityAnalyticsData;
  trackRankMap: Record<string, { rank: number; delta: number }>;
  currentTrackId: string;
  isPlaying: boolean;
  onClose: () => void;
  onSelectTrackDetail: (trackId: string) => void;
  onPlayOrToggleTrack: (albumIdx: number, trackIdx: number) => void;
  onOpenEntityProfile: (name: string, role: StudioEntityRole) => void;
  onOpenUserProfile: (userId: string) => void;
  onToggleSubscribeArtist?: (artistName: string) => void;
}

export const ReusableArtistDetailSheet: React.FC<
  ReusableArtistDetailSheetProps
> = ({
  analytics,
  trackRankMap,
  currentTrackId,
  isPlaying,
  onClose,
  onSelectTrackDetail,
  onPlayOrToggleTrack,
  onOpenEntityProfile,
  onOpenUserProfile,
  onToggleSubscribeArtist,
}) => {
  const roleLabel =
    analytics.role === 'ARTIST'
      ? 'Profil Artiste Officiel'
      : analytics.role === 'LABEL'
        ? 'Catalogue Label / Maison de Prod'
        : analytics.role === 'BEATMAKER'
          ? 'Profil Beatmaker / Compositeur'
          : analytics.role === 'ENGINEER'
            ? 'Profil Ingénieur du Son'
            : 'Profil Parolier / Auteur';

  const allTeamMembers = [
    ...(analytics.role !== 'ARTIST' ? analytics.studioTeam.artists : []),
    ...(analytics.role !== 'LABEL' ? analytics.studioTeam.labels : []),
    ...(analytics.role !== 'BEATMAKER' ? analytics.studioTeam.beatmakers : []),
    ...(analytics.role !== 'ENGINEER' ? analytics.studioTeam.engineers : []),
    ...(analytics.role !== 'LYRICIST' && analytics.studioTeam.lyricists
      ? analytics.studioTeam.lyricists
      : []),
  ];

  const dr = analytics.decoupledRanking;
  const isArtisanRole =
    analytics.role === 'BEATMAKER' ||
    analytics.role === 'ENGINEER' ||
    analytics.role === 'LYRICIST';
  const cert =
    isArtisanRole && dr?.careerCertification
      ? dr.careerCertification
      : getAlbumCertification(analytics.tracks.map((x) => x.track));

  const capLimit = analytics.role === 'ENGINEER' ? 20 : 25;

  return (
    <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.1] rounded-2xl p-3.5 sm:p-4 overflow-hidden gap-3.5 animate-fade-in">
      {/* Header */}
      <div className="w-full flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5 shrink-0 transition"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <CertificationBadgeSvg cert={cert} compact />
          {dr?.workCertificatesCount !== undefined && dr.workCertificatesCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-400/15 border border-cyan-400/35 text-cyan-200 text-[10px] font-mono font-bold shrink-0">
              {dr.workCertificatesCount} Co-Certificat(s) d&apos;Œuvre
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
        {/* Identity & Global KPIs + Subscribe Button for Artists */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 bg-[#07080C] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 shrink-0">
              <CoverArtwork
                artworkType={analytics.artworkType}
                coverUrl={analytics.cover}
                title={analytics.entityName}
                artist={analytics.entityName}
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#F5F2EB] truncate">
                  {analytics.entityName}
                </h2>
                {analytics.role === 'LABEL' && dr?.labelDivision && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      dr.labelDivision === 'LABEL_OFFICIEL'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {dr.labelDivision === 'LABEL_OFFICIEL'
                      ? 'Division Label Officiel (≥3 artistes)'
                      : 'Division Écurie Indépendante (<3 artistes)'}
                  </span>
                )}
                {analytics.role === 'ARTIST' && onToggleSubscribeArtist && (
                  <button
                    type="button"
                    onClick={() =>
                      onToggleSubscribeArtist(analytics.entityName)
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-1.5 ${
                      analytics.isSubscribed
                        ? 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300'
                        : 'bg-[#DE1B34] hover:bg-[#f02845] border-[#DE1B34] text-white shadow-[0_0_12px_rgba(222,27,52,0.4)]'
                    }`}
                  >
                    <span>
                      {analytics.isSubscribed ? 'Abonné ✓' : '+ S’abonner'}
                    </span>
                    {analytics.subscribersCount !== undefined && (
                      <span className="font-mono text-[11px] opacity-90">
                        ({formatCompactNumber(analytics.subscribersCount)} Fans)
                      </span>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8E93A4] mt-1">
                {analytics.tracks.length} œuvre(s) créditée(s) •{' '}
                {formatLongListenDuration(analytics.totalListenSeconds)} d&apos;écoute
                cumulée
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="px-2.5 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-center">
              <span className="text-[10px] text-[#8E93A4] block">
                Score Métier
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {dr ? `${dr.decoupledScore} pts` : `${analytics.avgRetention} pts`}
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-center">
              <span className="text-[10px] text-[#8E93A4] block">Volume ECG</span>
              <span className="font-mono text-xs font-bold text-white">
                {formatCompactNumber(analytics.totalPlays)}
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-center">
              <span className="text-[10px] text-[#8E93A4] block">Boucles</span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {formatCompactNumber(analytics.totalLoops)}
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-center">
              <span className="text-[10px] text-[#8E93A4] block">
                Complétion
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {analytics.avgRetention}%
              </span>
            </div>
          </div>
        </div>

        {/* Niveau 2 : Disque d'Artisan (Carrière : 500K Or / 1.25M Platine / 2.5M Diamant) & 3 Conditions d'Intégrité */}
        {isArtisanRole && dr?.careerCertification && (
          <div className="bg-gradient-to-r from-[#0B121E] to-[#07080C] border border-cyan-400/30 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 block">
                  Niveau 2 — Certification de Carrière « Disque d&apos;Artisan » (Seuils : 500K Or • 1,25M Platine • 2,5M Diamant)
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  {dr.careerCertification.label} —{' '}
                  <span className="font-mono text-amber-300">
                    {dr.totalPlays.toLocaleString('fr-FR')} ECG cumulées
                  </span>
                </h3>
              </div>
              <CertificationBadgeSvg cert={dr.careerCertification} />
            </div>

            {dr.careerCertification.artisanIntegrityCheck && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-[#0D1017] border border-white/10">
                  <span className="text-zinc-400 block text-[9.5px]">
                    1. Catalogue (Min. 10 titres)
                  </span>
                  <span
                    className={
                      dr.careerCertification.artisanIntegrityCheck.tracksCount >= 10
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-300 font-bold'
                    }
                  >
                    {dr.careerCertification.artisanIntegrityCheck.tracksCount} / 10 titres
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0D1017] border border-white/10">
                  <span className="text-zinc-400 block text-[9.5px]">
                    2. Diversité (Min. 3 artistes)
                  </span>
                  <span
                    className={
                      dr.careerCertification.artisanIntegrityCheck.distinctArtistsCount >= 3
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-300 font-bold'
                    }
                  >
                    {dr.careerCertification.artisanIntegrityCheck.distinctArtistsCount} / 3 artistes
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0D1017] border border-white/10">
                  <span className="text-zinc-400 block text-[9.5px]">
                    3a. Plafond Titre (≤ 15%)
                  </span>
                  <span
                    className={
                      dr.careerCertification.artisanIntegrityCheck.maxSingleTrackSharePct <= 15
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-300 font-bold'
                    }
                  >
                    Max {dr.careerCertification.artisanIntegrityCheck.maxSingleTrackSharePct}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0D1017] border border-white/10">
                  <span className="text-zinc-400 block text-[9.5px]">
                    3b. Plafond Artiste (≤ 40%)
                  </span>
                  <span
                    className={
                      dr.careerCertification.artisanIntegrityCheck.maxSingleArtistSharePct <= 40
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-300 font-bold'
                    }
                  >
                    Max {dr.careerCertification.artisanIntegrityCheck.maxSingleArtistSharePct}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANNEAU ALGORITHME DÉCOUPLÉ ANTI-EFFET DE HALO (Valeur Ajoutée & Régularité) */}
        {dr && (
          <div className="bg-[#07080C] border border-amber-400/25 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                  Architecture Découplée par Métier (Anti-Effet de Halo • Pilier II)
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">{dr.formulaSummary}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-xs font-bold">
                Polyvalence 90j : x{dr.versatilityMultiplier.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase text-[#8E93A4] block">
                  {dr.primaryMetricLabel}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono mt-0.5 block">
                  {dr.primaryMetricValue}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase text-[#8E93A4] block">
                  {dr.secondaryMetricLabel}
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-300 font-mono mt-0.5 block">
                  {dr.secondaryMetricValue}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase text-[#8E93A4] block">
                  {dr.tertiaryMetricLabel}
                </span>
                <span className="text-xs sm:text-sm font-bold text-sky-300 font-mono mt-0.5 block">
                  {dr.tertiaryMetricValue}
                </span>
              </div>
            </div>

            {/* Détail du Delta d'Impact & Plafonnement strict par titre (25% ou 20%) */}
            {dr.trackContributions.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8E93A4]">
                  <span>
                    Détail par œuvre : Delta d&apos;Impact (vs 3 sorties précédentes) &amp;
                    Plafond Anti-Tube Unique
                  </span>
                  <span className="text-amber-300">
                    Plafond strict : {capLimit}% max / titre
                  </span>
                </div>
                {dr.trackContributions.map((c) => (
                  <div
                    key={c.trackId}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white truncate">
                          {c.trackTitle}{' '}
                          <span className="text-zinc-400 font-normal">
                            ({c.artist})
                          </span>
                        </span>
                        {c.engineerSubRoleSharePct !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono text-[9.5px]">
                            Part Ingé : {c.engineerSubRoleSharePct}%
                          </span>
                        )}
                        {c.creditStatus === 'DISPUTED_ESCROW' && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[9.5px]">
                            Sous Séquestre
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Delta Impact :{' '}
                        <strong className="text-emerald-400">
                          {c.deltaImpactRatio}x
                        </strong>{' '}
                        la moyenne habituelle de l&apos;interprète (
                        {formatCompactNumber(c.artistHabitualAvg)} ECG)
                      </span>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <span className="text-xs font-bold text-amber-300 block">
                        +{c.cappedTrackScore} pts ({c.shareOfTotalPct}%)
                      </span>
                      {c.wasCappedAt25Pct && (
                        <span className="text-[9.5px] text-rose-400">
                          Plafonné à {c.capLimitPct}% (Anti-Hit Unique)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discography / Productions List with Synchronized Play/Pause */}
        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
            Catalogue, Crédits &amp; Featurings ({analytics.tracks.length})
          </span>
          {analytics.tracks.map(
            ({ track: t, albumIndex, trackIndex, isFeaturing }) => {
              const rInfo = trackRankMap[t.id] || { rank: 1, delta: 0 };
              const isThisPlaying = currentTrackId === t.id && isPlaying;
              const tCert = getTrackCertification(
                t.realPlays,
                t.gabonTerritoryPct ?? 86,
                t.id
              );
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTrackDetail(t.id)}
                  className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] hover:border-amber-400/40 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayOrToggleTrack(albumIndex, trackIndex);
                      }}
                      className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 group/play"
                      aria-label={isThisPlaying ? 'Pause' : 'Lire'}
                    >
                      <CoverArtwork
                        artworkType={t.artworkType}
                        coverUrl={t.cover}
                        title={t.title}
                        artist={t.artist}
                      />
                      <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white">
                        {isThisPlaying ? (
                          <svg
                            className="w-4 h-4 fill-current text-amber-300"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5.14v14l11-7-11-7z" />
                          </svg>
                        )}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F5F2EB] truncate">
                          {t.title}
                        </span>
                        {isFeaturing && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono font-bold shrink-0">
                            FEAT ({t.featuringSplitMode === '50_50' ? '50%' : '30%'})
                          </span>
                        )}
                        <CertificationBadgeSvg cert={tCert} compact />
                      </div>
                      <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                        {t.artist}
                        {t.featuringArtists && t.featuringArtists.length > 0
                          ? ` feat. ${t.featuringArtists.join(', ')}`
                          : ''}{' '}
                        • {formatShortTime(t.duration)} •{' '}
                        {formatCompactNumber(t.realPlays)} ECG
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <RankBadgeSvg rank={rInfo.rank} delta={rInfo.delta} />
                    <svg
                      className="w-4 h-4 text-[#8E93A4]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 18l6-6-6-6"
                      />
                    </svg>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Studio Team & Top Listeners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Équipe Studio, Paroliers &amp; Collaborateurs
            </span>
            {allTeamMembers.map((member) => (
              <button
                key={`${member.role}-${member.name}`}
                type="button"
                onClick={() => onOpenEntityProfile(member.name, member.role)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.05] text-xs transition text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                      member.role === 'ARTIST'
                        ? 'bg-amber-400/20 text-amber-300'
                        : member.role === 'LABEL'
                          ? 'bg-[#DE1B34]/20 text-[#DE1B34]'
                          : member.role === 'BEATMAKER'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : member.role === 'LYRICIST'
                              ? 'bg-violet-500/20 text-violet-300'
                              : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {member.role === 'ARTIST'
                      ? 'ARTISTE'
                      : member.role === 'LABEL'
                        ? 'LABEL'
                        : member.role === 'BEATMAKER'
                          ? 'BEATMAKER'
                          : member.role === 'LYRICIST'
                            ? 'PAROLIER'
                            : 'INGÉ SON'}
                  </span>
                  <span className="font-semibold text-[#F5F2EB] truncate">
                    {member.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8E93A4] shrink-0">
                  {member.tracksCount} titre(s) →
                </span>
              </button>
            ))}
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Top Auditeurs Fidèles (+241)
            </span>
            {analytics.topListeners.map((listener, idx) => (
              <button
                key={listener.user.id}
                type="button"
                onClick={() => onOpenUserProfile(listener.user.id)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] hover:border-emerald-500/40 border border-white/[0.05] text-xs transition text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RankBadgeSvg rank={idx + 1} delta={0} />
                  <span className="font-semibold text-[#F5F2EB] truncate">
                    {listener.user.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8E93A4] shrink-0">
                  <span>{formatLongListenDuration(listener.listenSeconds)}</span>
                  <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 4. REUSABLE USER LISTENING PROFILE & MOBILE MONEY ECG SIMULATOR           */
/* ========================================================================= */
export interface ReusableUserProfileSheetProps {
  user: AnalyticsAppUser;
  userRank: number;
  isOwnProfile?: boolean;
  userPlan?: 'BASIC' | 'PRO';
  onToggleUserPlan?: () => void;
  subscriptionPass?: GabonSubscriptionPass;
  onChangeSubscriptionPass?: (pass: GabonSubscriptionPass) => void;
  networkOperator?: GabonNetworkOperator;
  onChangeNetworkOperator?: (op: GabonNetworkOperator) => void;
  lastEcgValidationMsg?: string;
  allTracksFlat: {
    track: AnalyticsTrackItem;
    albumIndex: number;
    trackIndex: number;
  }[];
  trackRankMap: Record<string, { rank: number; delta: number }>;
  currentTrackId: string;
  isPlaying: boolean;
  onClose?: () => void;
  onSelectTrackDetail: (trackId: string) => void;
  onPlayOrToggleTrack: (albumIdx: number, trackIdx: number) => void;
}

export const ReusableUserProfileSheet: React.FC<
  ReusableUserProfileSheetProps
> = ({
  user,
  userRank,
  isOwnProfile = false,
  userPlan = 'PRO',
  onToggleUserPlan,
  subscriptionPass = 'PASS_MENSUEL_HEBDO',
  onChangeSubscriptionPass,
  networkOperator = 'AIRTEL_GABON',
  onChangeNetworkOperator,
  lastEcgValidationMsg,
  allTracksFlat,
  trackRankMap,
  currentTrackId,
  isPlaying,
  onClose,
  onSelectTrackDetail,
  onPlayOrToggleTrack,
}) => {
  const statsList = Object.values(user.trackStats)
    .map((st) => {
      const found = allTracksFlat.find((item) => item.track.id === st.trackId);
      return found ? { stat: st, ...found } : null;
    })
    .filter(
      (
        item
      ): item is {
        stat: AnalyticsUserTrackStat;
        track: AnalyticsTrackItem;
        albumIndex: number;
        trackIndex: number;
      } => item !== null
    );

  const byListenTime = [...statsList].sort(
    (a, b) => b.stat.listenSeconds - a.stat.listenSeconds
  );
  const byLoops = [...statsList].sort(
    (a, b) => b.stat.loopsCount - a.stat.loopsCount
  );
  const topLoopedItem = byLoops[0] || null;

  const genreTotals: Record<
    string,
    { category: string; seconds: number; plays: number; loops: number }
  > = {};
  for (const item of statsList) {
    const cat = item.track.category;
    if (!genreTotals[cat]) {
      genreTotals[cat] = { category: cat, seconds: 0, plays: 0, loops: 0 };
    }
    genreTotals[cat].seconds += item.stat.listenSeconds;
    genreTotals[cat].plays += item.stat.playsCount;
    genreTotals[cat].loops += item.stat.loopsCount;
  }
  const favoriteGenres = Object.values(genreTotals).sort(
    (a, b) => b.seconds - a.seconds
  );

  const activePassSpec = GABON_PASS_SPECS[subscriptionPass];

  return (
    <div className="flex-1 w-full flex flex-col bg-[#0D1017] border border-white/[0.1] rounded-2xl p-3.5 sm:p-4 overflow-hidden gap-3.5 animate-fade-in">
      {onClose && (
        <div className="w-full flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-[#F5F2EB] flex items-center gap-1.5 shrink-0 transition"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 18l-6-6 6-6"
              />
            </svg>
            <span>Retour</span>
          </button>
          <RankBadgeSvg rank={userRank} delta={0} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
        {/* User Identity Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#07080C] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center font-bold text-sm text-emerald-300 shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                  {user.name}
                </h2>
                <RankBadgeSvg rank={userRank} delta={0} />
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-mono">
                  OTP +241 Vérifié • Empreinte Device Active
                </span>
              </div>
              <div className="text-xs text-[#8E93A4] font-mono truncate mt-0.5">
                {user.email} • Poids d&apos;écoute actuel :{' '}
                <strong className="text-amber-300">
                  {activePassSpec.ecgWeight.toFixed(1)} ECG / écoute
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isOwnProfile && onToggleUserPlan && (
              <button
                type="button"
                onClick={onToggleUserPlan}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  userPlan === 'PRO'
                    ? 'bg-amber-400 text-black shadow-[0_0_14px_rgba(251,191,36,0.35)]'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                }`}
              >
                {userPlan === 'PRO' ? 'Compte PRO Actif' : 'Passer en PRO'}
              </button>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] font-mono text-xs text-emerald-400 font-bold">
              {formatLongListenDuration(user.totalListenSeconds)}
            </div>
          </div>
        </div>

        {/* SIMULATEUR PASS MOBILE MONEY & BOUCLIER ANTI-FRAUDE ECG (Pilier I) */}
        {isOwnProfile && (
          <div className="bg-[#07080C] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                  Pilier I — Pondération Mobile Money &amp; Bouclier Anti-Fraude ECG (+241)
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Sélectionnez votre Pass pour tester la pondération en temps réel (1,0 ECG / 0,8 ECG / 0,5 ECG) et les plafonds quotidiens.
                </p>
              </div>
              {lastEcgValidationMsg && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/35 text-amber-200 font-mono text-[10.5px]">
                  {lastEcgValidationMsg}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {(Object.keys(GABON_PASS_SPECS) as GabonSubscriptionPass[]).map(
                (passKey) => {
                  const spec = GABON_PASS_SPECS[passKey];
                  const isSelected = subscriptionPass === passKey;
                  return (
                    <button
                      key={passKey}
                      type="button"
                      onClick={() =>
                        onChangeSubscriptionPass &&
                        onChangeSubscriptionPass(passKey)
                      }
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-[#0D1017] border-white/[0.07] text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold truncate">
                          {spec.shortLabel}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold">
                          {spec.ecgWeight.toFixed(1)} ECG
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {spec.paymentMethods}
                      </span>
                      <div className="flex items-center justify-between text-[9.5px] font-mono text-emerald-300 pt-1 border-t border-white/10">
                        <span>Cap: {spec.dailyCapPerTrack} écoutes/24h</span>
                        <span>Vote: {spec.dailyAwardsVoteQuota}/j</span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* Opérateur Télécom CG-NAT Gabon & Règles Techniques */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-400">Réseau CG-NAT Gabon :</span>
                {(
                  [
                    { id: 'AIRTEL_GABON', label: 'Airtel Gabon (4G / Airtel Money)' },
                    { id: 'MOOV_AFRICA', label: 'Moov Africa (Moov Money)' },
                    { id: 'GABON_TELECOM', label: 'Gabon Telecom Fibre' },
                  ] as { id: GabonNetworkOperator; label: string }[]
                ).map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() =>
                      onChangeNetworkOperator && onChangeNetworkOperator(op.id)
                    }
                    className={`px-2 py-0.5 rounded border text-[10px] transition ${
                      networkOperator === op.id
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-zinc-400">
                Seuil 30s (ou 75% &lt;60s) • Rejet Mute 0% • Cache Hors-Ligne 14j max
              </div>
            </div>
          </div>
        )}

        {/* Top Looped Track & Favorite Genres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
              Titre le plus écouté en boucle
            </span>
            {topLoopedItem ? (
              <div
                onClick={() => onSelectTrackDetail(topLoopedItem.track.id)}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#0D1017] border border-white/[0.06] hover:border-amber-400/40 cursor-pointer transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <CoverArtwork
                      artworkType={topLoopedItem.track.artworkType}
                      coverUrl={topLoopedItem.track.cover}
                      title={topLoopedItem.track.title}
                      artist={topLoopedItem.track.artist}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#F5F2EB] truncate">
                      {topLoopedItem.track.title}
                    </div>
                    <div className="text-[11px] text-[#8E93A4] truncate">
                      {topLoopedItem.track.artist}
                    </div>
                    <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                      {topLoopedItem.stat.loopsCount}x boucles (Max:{' '}
                      {topLoopedItem.stat.maxConsecutiveLoops}x)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayOrToggleTrack(
                      topLoopedItem.albumIndex,
                      topLoopedItem.trackIndex
                    );
                  }}
                  className="w-8 h-8 rounded-full bg-[#DE1B34] text-white flex items-center justify-center shrink-0"
                >
                  {currentTrackId === topLoopedItem.track.id && isPlaying ? (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-3.5 h-3.5 fill-current ml-0.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-xs text-[#8E93A4]">Aucune boucle enregistrée.</div>
            )}
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#DE1B34]">
              Genres Gabonais Favoris
            </span>
            {favoriteGenres.map((g, i) => (
              <div
                key={g.category}
                className="flex items-center justify-between text-xs font-mono p-1.5 rounded-lg bg-[#0D1017]"
              >
                <span className="text-[#F5F2EB] truncate">
                  #{i + 1} {g.category}
                </span>
                <span className="text-amber-300">
                  {formatLongListenDuration(g.seconds)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-Track Listening History */}
        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E93A4]">
            Historique d&apos;écoute réel par titre ({byListenTime.length})
          </span>
          {byListenTime.map(({ stat, track, albumIndex, trackIndex }) => {
            const rInfo = trackRankMap[track.id] || { rank: 1, delta: 0 };
            const isThisPlaying = currentTrackId === track.id && isPlaying;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrackDetail(track.id)}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.05] hover:border-white/20 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayOrToggleTrack(albumIndex, trackIndex);
                    }}
                    className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0"
                  >
                    <CoverArtwork
                      artworkType={track.artworkType}
                      coverUrl={track.cover}
                      title={track.title}
                      artist={track.artist}
                    />
                    <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white">
                      {isThisPlaying ? (
                        <svg
                          className="w-3.5 h-3.5 fill-current text-amber-300"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5.14v14l11-7-11-7z" />
                        </svg>
                      )}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#F5F2EB] truncate">
                      {track.title}
                    </div>
                    <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                      {formatLongListenDuration(stat.listenSeconds)} •{' '}
                      {stat.playsCount} écoutes perso • {stat.loopsCount}x boucles
                    </div>
                  </div>
                </div>
                <RankBadgeSvg rank={rInfo.rank} delta={rInfo.delta} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

