import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import {
  triggerBeatAudioDownload,
  generateDropContentId,
  computeDeterministicWaveformPeaks,
} from '../services/musicService';

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
  isInstrumental?: boolean;
  audioCodec?: 'OPUS' | 'AAC' | 'WAV';
  audioContainerMime?: string;
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
  dropContentId?: string;
  waveformPeaks?: number[];
  isBeatDownloadable?: boolean;
  musicalKey?: string;
  audioUrl?: string;
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
 * Composant de défilement automatique en boucle (Marquee) lorsque le texte dépasse la zone visible.
 * Tous les boutons adjacents restent strictement fixes.
 */
export const AutoMarqueeText: React.FC<{
  text: string;
  className?: string;
  speedSec?: number;
}> = ({ text, className = '', speedSec = 11 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !measureRef.current) return;
      const hasOverflow =
        measureRef.current.scrollWidth > containerRef.current.clientWidth + 2;
      setIsOverflowing(hasOverflow);
    };

    checkOverflow();
    const timer = window.setTimeout(checkOverflow, 120);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(checkOverflow);
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', checkOverflow);

    return () => {
      window.clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden whitespace-nowrap min-w-0 ${className}`}
    >
      {/* Élément invisible servant à mesurer la largeur réelle du texte */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap"
      >
        {text}
      </span>

      {isOverflowing ? (
        <div
          className="inline-flex items-center whitespace-nowrap will-change-transform"
          style={{
            animation: `dropMarqueeLoop ${speedSec}s linear infinite`,
          }}
        >
          <span className="pr-8">{text}</span>
          <span className="pr-8 text-zinc-500">•</span>
          <span className="pr-8">{text}</span>
          <span className="pr-8 text-zinc-500">•</span>
        </div>
      ) : (
        <span className="block truncate">{text}</span>
      )}

      <style>{`
        @keyframes dropMarqueeLoop {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

/**
 * Générateur SVG de QR Code Officiel lié au Registre Public des Certifications
 */
export const OfficialQrCodeSvg: React.FC<{
  hash: string;
  size?: number;
}> = ({ hash, size = 84 }) => {
  const safeHash = hash || 'DROP-CERT-241';
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
        const charCode =
          safeHash.charCodeAt((r * cells + c) % safeHash.length) || 65;
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

/**
 * Icône vectorielle UHD Multi-Couches pour Disque d'Or, Disque de Platine et Disque de Diamant
 * - Reflets métalliques coniques et radiaux
 * - Micro-sillons concentriques haute précision
 * - Médaillon central de mastering avec couronne de laurier / facettes diamantaires
 */
export const UhdCertificationDiscSvg: React.FC<{
  level: 'GOLD' | 'PLATINUM' | 'DIAMOND';
  sizeClass?: string;
}> = ({ level, sizeClass = 'w-4 h-4' }) => {
  const uid = React.useId().replace(/:/g, '');

  if (level === 'DIAMOND') {
    return (
      <svg
        className={sizeClass}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`diamGlow-${uid}`} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ECFEFF" />
            <stop offset="35%" stopColor="#67E8F9" />
            <stop offset="72%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0E7490" />
          </radialGradient>
          <linearGradient id={`diamRim-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#A5F3FC" />
            <stop offset="65%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#155E75" />
          </linearGradient>
          <linearGradient id={`diamFacet1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id={`diamFacet2-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CFFAFE" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0891B2" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Disque extérieur en cristal de platine-cyan */}
        <circle
          cx="32"
          cy="32"
          r="29"
          fill={`url(#diamGlow-${uid})`}
          stroke={`url(#diamRim-${uid})`}
          strokeWidth="2.2"
        />
        {/* Micro-sillons concentriques UHD */}
        <circle cx="32" cy="32" r="25.5" stroke="#ECFEFF" strokeOpacity="0.45" strokeWidth="0.7" />
        <circle cx="32" cy="32" r="22.5" stroke="#083344" strokeOpacity="0.35" strokeWidth="0.8" />
        <circle cx="32" cy="32" r="19.5" stroke="#ECFEFF" strokeOpacity="0.4" strokeWidth="0.6" />

        {/* Reflets coniques en croix */}
        <path
          d="M11 11L25 25M53 53L39 39M53 11L39 25M11 53L25 39"
          stroke="#FFFFFF"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Couronne octogonale taillée en diamant au centre */}
        <polygon
          points="32,9 46,16 52,30 45,46 32,54 19,46 12,30 18,16"
          fill={`url(#diamFacet2-${uid})`}
          stroke="#FFFFFF"
          strokeWidth="1.4"
        />
        {/* Table supérieure du diamant */}
        <polygon
          points="32,14 43,21 39,35 32,48 25,35 21,21"
          fill={`url(#diamFacet1-${uid})`}
          stroke="#ECFEFF"
          strokeWidth="1.1"
        />
        {/* Lignes de taille brillant */}
        <path
          d="M21 21L43 21M32 14L32 48M21 21L32 31L43 21M25 35L32 31L39 35"
          stroke="#FFFFFF"
          strokeOpacity="0.85"
          strokeWidth="1"
        />
        {/* Point d'éclat stellaire */}
        <circle cx="32" cy="24" r="2.2" fill="#FFFFFF" />
      </svg>
    );
  }

  const isGold = level === 'GOLD';
  return (
    <svg
      className={sizeClass}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`discBase-${uid}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {isGold ? (
            <>
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="28%" stopColor="#FACC15" />
              <stop offset="55%" stopColor="#D97706" />
              <stop offset="80%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#92400E" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="28%" stopColor="#E2E8F0" />
              <stop offset="55%" stopColor="#64748B" />
              <stop offset="80%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#334155" />
            </>
          )}
        </linearGradient>

        <linearGradient
          id={`discSheen-${uid}`}
          x1="15%"
          y1="85%"
          x2="85%"
          y2="15%"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="44%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.78" />
          <stop offset="56%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`centerLabel-${uid}`} cx="50%" cy="50%" r="50%">
          {isGold ? (
            <>
              <stop offset="0%" stopColor="#451A03" />
              <stop offset="70%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#B45309" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="70%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#475569" />
            </>
          )}
        </radialGradient>
      </defs>

      {/* Anneau extérieur chanfreiné UHD */}
      <circle
        cx="32"
        cy="32"
        r="29"
        fill={`url(#discBase-${uid})`}
        stroke={isGold ? '#FEF08A' : '#F8FAFC'}
        strokeWidth="2"
      />
      {/* Faisceau de réflexion métallique */}
      <circle cx="32" cy="32" r="28" fill={`url(#discSheen-${uid})`} />

      {/* Micro-sillons concentriques haute définition */}
      <circle
        cx="32"
        cy="32"
        r="25.5"
        stroke={isGold ? '#78350F' : '#1E293B'}
        strokeOpacity="0.38"
        strokeWidth="0.8"
      />
      <circle
        cx="32"
        cy="32"
        r="22.8"
        stroke="#FFFFFF"
        strokeOpacity="0.45"
        strokeWidth="0.65"
      />
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke={isGold ? '#78350F' : '#1E293B'}
        strokeOpacity="0.35"
        strokeWidth="0.75"
      />
      <circle
        cx="32"
        cy="32"
        r="17.2"
        stroke="#FFFFFF"
        strokeOpacity="0.4"
        strokeWidth="0.6"
      />

      {/* Macaron central de certification */}
      <circle
        cx="32"
        cy="32"
        r="11.2"
        fill={`url(#centerLabel-${uid})`}
        stroke={isGold ? '#FDE047' : '#E2E8F0'}
        strokeWidth="1.6"
      />
      {/* Étoile / Couronne centrale et axe du vinyle */}
      <circle
        cx="32"
        cy="32"
        r="7.4"
        stroke={isGold ? '#FBBF24' : '#CBD5E1'}
        strokeOpacity="0.55"
        strokeWidth="0.8"
        strokeDasharray="2 1.5"
      />
      <circle
        cx="32"
        cy="32"
        r="3.2"
        fill={isGold ? '#FEF08A' : '#FFFFFF'}
        stroke={isGold ? '#78350F' : '#0F172A'}
        strokeWidth="1.2"
      />
    </svg>
  );
};

/**
 * Badge de Certification sous forme d'ICÔNE PURE UHD (sans aucun texte).
 * En cliquant sur l'icône, un popup public s'ouvre avec les informations complètes
 * (titre/artiste certifié, date d'obtention, lectures validées, seuils publics + section Pro).
 */
export const CertificationBadgeSvg: React.FC<{
  cert: CertificationInfo;
  compact?: boolean;
  entityTitle?: string;
  entityArtist?: string;
  playsCount?: number;
  certifiedSince?: string;
  isPro?: boolean;
}> = ({
  cert,
  compact = false,
  entityTitle,
  entityArtist,
  playsCount,
  certifiedSince,
  isPro = true,
}) => {
  const [openPopup, setOpenPopup] = useState(false);

  if (!cert || cert.level === 'NONE') return null;

  const styleMap = {
    GOLD: {
      bg: 'bg-gradient-to-br from-amber-300/25 via-amber-500/20 to-amber-900/30 border-amber-300/75 text-amber-200 hover:from-amber-300/35 hover:to-amber-700/40 shadow-[0_0_14px_rgba(251,191,36,0.38)]',
      discFill: '#fbbf24',
      innerFill: '#78350f',
      tierTitle: 'Disque d’Or Officiel',
      defaultThreshold: 100000,
      defaultDate: '12 Octobre 2024',
    },
    PLATINUM: {
      bg: 'bg-gradient-to-br from-white/30 via-slate-300/20 to-slate-700/35 border-slate-200/80 text-white hover:from-white/40 hover:to-slate-600/40 shadow-[0_0_14px_rgba(226,232,240,0.38)]',
      discFill: '#e2e8f0',
      innerFill: '#334155',
      tierTitle: 'Disque de Platine Officiel',
      defaultThreshold: 250000,
      defaultDate: '04 Novembre 2024',
    },
    DIAMOND: {
      bg: 'bg-gradient-to-br from-cyan-200/30 via-cyan-400/25 to-sky-900/40 border-cyan-200/85 text-cyan-100 hover:from-cyan-200/40 hover:to-sky-800/45 shadow-[0_0_18px_rgba(34,211,238,0.5)]',
      discFill: '#67e8f9',
      innerFill: '#0e7490',
      tierTitle: 'Disque de Diamant Officiel',
      defaultThreshold: 500000,
      defaultDate: '19 Janvier 2025',
    },
  }[cert.level];

  const resolvedPlays =
    playsCount ??
    cert.weightedEcgCount ??
    cert.threshold ??
    styleMap.defaultThreshold;
  const resolvedThreshold =
    cert.threshold || styleMap.defaultThreshold;
  const resolvedDate = certifiedSince || styleMap.defaultDate;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenPopup(true);
        }}
        className={`inline-flex items-center justify-center rounded-full border shrink-0 transition active:scale-90 ${
          compact ? 'w-5 h-5 p-0.5' : 'w-6 h-6 p-0.5'
        } ${styleMap.bg}`}
        title={`${cert.label} — Cliquer pour voir les détails de la certification`}
        aria-label={`Voir la certification ${cert.label}`}
      >
        <UhdCertificationDiscSvg
          level={cert.level}
          sizeClass={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}
        />
      </button>

      {openPopup &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpenPopup(false);
            }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#0B0E17] border border-white/15 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.9)] text-white space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 p-1.5 ${styleMap.bg}`}
                  >
                    <UhdCertificationDiscSvg
                      level={cert.level}
                      sizeClass="w-10 h-10"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                      Certification Nationale Officielle • Gabon
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {cert.label || styleMap.tierTitle}
                    </h3>
                    {(entityTitle || entityArtist) && (
                      <p className="text-xs text-zinc-300 mt-0.5">
                        {entityTitle ? (
                          <strong className="text-white">{entityTitle}</strong>
                        ) : null}
                        {entityTitle && entityArtist ? ' — ' : ''}
                        {entityArtist ? (
                          <span className="text-amber-300">{entityArtist}</span>
                        ) : null}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenPopup(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              {/* Données Publiques accessibles à tous */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                  Données Publiques Certifiées
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-[10px] text-zinc-400 block">
                      Certifié depuis le
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">
                      {resolvedDate}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-[10px] text-zinc-400 block">
                      Lectures certifiées
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono mt-0.5 block">
                      {resolvedPlays.toLocaleString('fr-FR')} lectures
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-[10px] text-zinc-400 block">
                      Seuil officiel requis
                    </span>
                    <span className="text-xs font-bold text-zinc-200 font-mono mt-0.5 block">
                      {resolvedThreshold.toLocaleString('fr-FR')} lectures
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-[10px] text-zinc-400 block">
                      Statut de vérification
                    </span>
                    <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                      Vérifié &amp; Authentifié ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Section QR Code & Certificat */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-bold text-white block">
                    Registre Public des Certifications
                  </span>
                  <span className="text-[11px] font-mono text-amber-300 block truncate">
                    N° {cert.certificateHash || 'DROP-GA-CERT-2025'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Scannez le QR Code pour vérifier l&apos;authenticité publique du certificat.
                  </span>
                </div>
                <OfficialQrCodeSvg
                  hash={cert.certificateHash || 'DROP-GA-CERT'}
                  size={68}
                />
              </div>

              {/* Section Pro (limitée si compte Basic) */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-400/30">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                    Analytique Avancée (Compte PRO)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9.5px] font-mono font-bold">
                    {isPro ? 'PRO Déverrouillé' : 'Réservé PRO'}
                  </span>
                </div>
                {isPro ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-400 block">Quota Territoire Gabon</span>
                      <strong className="text-emerald-300 font-mono">
                        {cert.isGabonEligible ? `≥ 70% Validé (${cert.gabonTerritoryPct}%)` : 'En cours'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Prochain palier</span>
                      <strong className="text-white font-mono">
                        {cert.nextLevelLabel
                          ? `${cert.nextLevelLabel} (${formatCompactNumber(cert.nextThreshold || 250000)})`
                          : 'Palier Diamant Max atteint'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-300">
                    Passez au compte PRO dans votre profil pour consulter la répartition territoriale détaillée et les co-certificats studio.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setOpenPopup(false)}
                className="w-full py-2.5 rounded-xl bg-[#DE1B34] hover:bg-[#f02845] text-white font-bold text-xs transition"
              >
                Fermer
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
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

  // Le bouton Play ne s'active jamais tout seul pendant le Drop automatique :
  // il n'affiche Pause que lorsque l'utilisateur a lancé la lecture complète (hors mode Drop).
  const isFullPlayActive = isPlaying && !isDropMode;

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
            <div className="flex items-center gap-1.5 min-w-0">
              <AutoMarqueeText
                text={currentTrack.title}
                className="text-xs sm:text-sm font-bold text-white flex-1"
              />
              {isDropMode && (
                <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                  DROP
                </span>
              )}
              {rankInfo && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-amber-300 shrink-0">
                  #{rankInfo.rank}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 min-w-0">
              <AutoMarqueeText text={artistLine} className="flex-1" />
              <span className="shrink-0">•</span>
              <span className="font-mono text-zinc-300 shrink-0">
                {formatShortTime(currentTime)} /{' '}
                {formatShortTime(currentTrack.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Contrôles de transport fixes */}
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
            aria-label={
              isFullPlayActive
                ? 'Mettre en pause'
                : 'Lancer la lecture complète dès 0:00'
            }
            title={
              isFullPlayActive
                ? 'Mettre en pause'
                : 'Lancer la lecture complète depuis 0:00'
            }
          >
            {isFullPlayActive ? (
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
/* 2. REUSABLE TRACK DETAIL SHEET (Épuré pour Utilisateurs / Complet Admin)  */
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
    'Revendication de crédit studio (Contrat / Pistes séparées)'
  );

  const isThisTrackPlaying = isCurrentTrack && isPlaying;
  const gabonPct = track.gabonTerritoryPct ?? 86;
  const trackCert = getTrackCertification(track.realPlays, gabonPct, track.id);
  const albumCert = getAlbumCertification(album.tracks, gabonPct);
  const lyricistName = track.isInstrumental
    ? 'Instrumental'
    : track.lyricistName || track.artist;
  const recEng = track.recordingEngineerName || track.soundEngineerName;
  const mixEng = track.mixingEngineerName || track.soundEngineerName;
  const mastEng = track.masteringEngineerName || track.soundEngineerName;

  const rawHs = track.creditHandshake;
  const isRawEscrow =
    rawHs?.status === 'DISPUTED' || rawHs?.escrowFrozen === true;
  const hs = {
    beatmakerStatus:
      rawHs?.beatmakerStatus ||
      (isRawEscrow
        ? 'DISPUTED_ESCROW'
        : rawHs?.confirmedByBeatmaker === false
          ? 'PENDING_HANDSHAKE'
          : 'VALIDATED'),
    recordingEngineerStatus:
      rawHs?.recordingEngineerStatus ||
      (rawHs?.confirmedByEngineer === false
        ? 'PENDING_HANDSHAKE'
        : 'VALIDATED'),
    mixingEngineerStatus:
      rawHs?.mixingEngineerStatus ||
      (rawHs?.confirmedByEngineer === false
        ? 'PENDING_HANDSHAKE'
        : 'VALIDATED'),
    masteringEngineerStatus:
      rawHs?.masteringEngineerStatus ||
      (rawHs?.confirmedByEngineer === false
        ? 'PENDING_HANDSHAKE'
        : 'VALIDATED'),
    lyricistStatus:
      rawHs?.lyricistStatus ||
      (rawHs?.confirmedByLyricist === false
        ? 'PENDING_HANDSHAKE'
        : 'VALIDATED'),
    disputeReason: rawHs?.disputeReason,
    retroactiveRecalcAppliedAt: rawHs?.retroactiveRecalcAppliedAt,
  };
  const hasEscrow =
    isRawEscrow ||
    hs.beatmakerStatus === 'DISPUTED_ESCROW' ||
    hs.mixingEngineerStatus === 'DISPUTED_ESCROW' ||
    hs.lyricistStatus === 'DISPUTED_ESCROW';

  const recsCount =
    track.recommendationsCount ??
    Math.max(12, Math.round(track.realPlays * 0.018));

  const renderAdminHandshakeBadge = (
    status: 'VALIDATED' | 'PENDING_HANDSHAKE' | 'DISPUTED_ESCROW' = 'VALIDATED',
    roleKey:
      | 'beatmakerStatus'
      | 'recordingEngineerStatus'
      | 'mixingEngineerStatus'
      | 'masteringEngineerStatus'
      | 'lyricistStatus'
  ) => {
    if (!isAdminView) return null;
    if (status === 'DISPUTED_ESCROW') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9.5px] font-mono font-bold">
          Sous Séquestre
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
        >
          Valider ✓
        </button>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[9.5px] font-mono">
        Validé
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

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <CertificationBadgeSvg
            cert={trackCert}
            entityTitle={track.title}
            entityArtist={track.artist}
            playsCount={track.realPlays}
          />
          {isAdminView && (
            <button
              type="button"
              onClick={() => setShowQrCertificate((v) => !v)}
              className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold shrink-0 transition"
            >
              {showQrCertificate ? 'Masquer QR' : 'Registre QR'}
            </button>
          )}
          <RankBadgeSvg rank={rankInfo.rank} delta={rankInfo.delta} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
        {isAdminView && showQrCertificate && (
          <div className="bg-gradient-to-br from-[#0B121E] via-[#07080C] to-[#120E1A] border border-amber-400/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
                Registre des Certifications • Gabon
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {trackCert.level !== 'NONE'
                  ? `Certificat Officiel — ${trackCert.label}`
                  : `Suivi de Certification — ${track.title}`}
              </h3>
              <p className="text-xs text-zinc-300 font-mono">
                Référence :{' '}
                <strong className="text-amber-300">
                  {trackCert.certificateHash}
                </strong>{' '}
                • Lectures validées :{' '}
                <strong className="text-white">
                  {track.realPlays.toLocaleString('fr-FR')}
                </strong>
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0 self-center">
              <OfficialQrCodeSvg hash={trackCert.certificateHash} size={84} />
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
                {track.isInstrumental && (
                  <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 text-[10px] font-mono font-semibold">
                    Instrumental
                  </span>
                )}
                <span className="text-[11px] text-[#8E93A4] truncate">
                  {album.albumTitle} ({album.year})
                </span>
                <span
                  className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[9.5px] font-mono font-bold"
                  title="Identifiant acoustique unique DROP Content ID"
                >
                  {track.dropContentId ||
                    generateDropContentId(
                      track.waveformPeaks ||
                        computeDeterministicWaveformPeaks(
                          `${track.id}-${track.title}`
                        ),
                      track.duration,
                      track.id
                    )}
                </span>
                <CertificationBadgeSvg
                  cert={albumCert}
                  compact
                  entityTitle={album.albumTitle}
                  entityArtist={album.artist}
                  playsCount={albumCert.weightedEcgCount}
                />
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
                    <span className="text-[10px] text-zinc-400">feat.</span>
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
                    className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${
                      isArtistSubscribed
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                    }`}
                    title={isArtistSubscribed ? 'Abonné' : 'S’abonner à l’artiste'}
                  >
                    {isArtistSubscribed ? (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                      >
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <polyline points="17 11 19 13 23 9" />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                      >
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">
                      {isArtistSubscribed ? 'Abonné' : 'S’abonner'}
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
                  <span>Lire dès 0:00</span>
                </>
              )}
            </button>

            {(track.isInstrumental ||
              track.isBeatDownloadable ||
              track.category === 'Beats & Instrumentales') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerBeatAudioDownload({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    beatmakerName: track.beatmakerName,
                    bpm: track.bpm,
                    audioUrl: track.audioUrl,
                    duration: track.duration,
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-200 font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_14px_rgba(245,158,11,0.2)] transition"
                title="Télécharger l'instrumentale / Beat Master (.WAV / .OPUS)"
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
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                  />
                </svg>
                <span>Télécharger le Beat</span>
              </button>
            )}

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
                title="Recommander ce titre"
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

        {/* 4 Cartes Statistiques Claires (Sans Jargon Technique) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#8E93A4]">
              Écoutes Certifiées
            </span>
            <div className="flex items-center justify-between">
              <svg
                className="w-4 h-4 text-[#DE1B34] fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="font-mono text-sm sm:text-base font-bold text-[#F5F2EB]">
                {formatCompactNumber(track.realPlays)}
              </span>
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#8E93A4]">
              Recommandations
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
              Favoris (Cœurs)
            </span>
            <div className="flex items-center justify-between">
              <svg
                className="w-4 h-4 text-rose-400 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="font-mono text-sm sm:text-base font-bold text-rose-300">
                {formatCompactNumber(track.likesCount)}
              </span>
            </div>
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#8E93A4]">
              Écoutes en boucle
            </span>
            <div className="flex items-center justify-between">
              <svg
                className="w-4 h-4 text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                {track.loopPlaysCount.toLocaleString('fr-FR')}x
              </span>
            </div>
          </div>
        </div>

        {/* Crédits de l'œuvre & Progression des Certifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Crédits Officiels de l&apos;Œuvre
            </span>

            <button
              type="button"
              onClick={() => onOpenEntityProfile(track.artist, 'ARTIST')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.05] text-xs transition"
            >
              <span className="text-[#8E93A4]">Artiste Principal</span>
              <span className="font-semibold text-amber-300 flex items-center gap-1 truncate max-w-[180px]">
                <span className="truncate">{track.artist}</span>
                <span>→</span>
              </span>
            </button>

            {track.featuringArtists && track.featuringArtists.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs">
                <span className="text-[#8E93A4]">Featuring</span>
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

            {!track.isInstrumental ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs gap-2">
                <button
                  type="button"
                  onClick={() => onOpenEntityProfile(lyricistName, 'LYRICIST')}
                  className="flex items-center justify-between w-full text-left hover:text-violet-200 transition"
                >
                  <span className="text-[#8E93A4] shrink-0">Auteur / Parolier</span>
                  <span className="font-semibold text-violet-300 truncate">
                    {lyricistName} →
                  </span>
                </button>
                {renderAdminHandshakeBadge(hs.lyricistStatus, 'lyricistStatus')}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs">
                <span className="text-[#8E93A4]">Type d&apos;œuvre</span>
                <span className="font-semibold text-amber-300">
                  Instrumental Pur (Sans voix)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenEntityProfile(track.beatmakerName, 'BEATMAKER')
                }
                className="flex items-center justify-between w-full text-left hover:text-emerald-200 transition"
              >
                <span className="text-[#8E93A4] shrink-0">
                  Beatmaker / Compositeur
                </span>
                <span className="font-semibold text-emerald-300 truncate">
                  {track.beatmakerName} →
                </span>
              </button>
              {renderAdminHandshakeBadge(hs.beatmakerStatus, 'beatmakerStatus')}
            </div>

            <div className="p-2 rounded-lg bg-[#0D1017] border border-white/[0.05] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono text-sky-300">
                  Ingénierie Sonore
                </span>
                {renderAdminHandshakeBadge(
                  hs.mixingEngineerStatus,
                  'mixingEngineerStatus'
                )}
              </div>
              <div
                className={`grid ${
                  track.isInstrumental ? 'grid-cols-2' : 'grid-cols-3'
                } gap-1.5 pt-0.5`}
              >
                {!track.isInstrumental && (
                  <button
                    type="button"
                    onClick={() => onOpenEntityProfile(recEng, 'ENGINEER')}
                    className="p-1.5 rounded bg-white/[0.03] hover:bg-sky-500/15 border border-white/[0.06] text-left transition"
                  >
                    <span className="text-[9.5px] font-mono text-zinc-400 block">
                      Prise voix
                    </span>
                    <span className="text-[11px] font-semibold text-sky-300 truncate block">
                      {recEng}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenEntityProfile(mixEng, 'ENGINEER')}
                  className="p-1.5 rounded bg-white/[0.03] hover:bg-sky-500/15 border border-white/[0.06] text-left transition"
                >
                  <span className="text-[9.5px] font-mono text-zinc-400 block">
                    Mixage
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
                    Mastering
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
              <span className="text-[#8E93A4]">Label / Production</span>
              <span className="font-semibold text-[#F5F2EB] flex items-center gap-1 truncate max-w-[180px]">
                <span className="truncate">{track.labelName}</span>
                <span className="text-[#DE1B34]">→</span>
              </span>
            </button>

            {/* Gestion des litiges réservée uniquement à l'Admin */}
            {isAdminView && (
              <div className="pt-1 border-t border-white/10 flex flex-col gap-2">
                {hasEscrow ? (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300">
                        Litige ouvert — Points sous séquestre
                      </span>
                      {onResolveCreditDispute && (
                        <button
                          type="button"
                          onClick={() => onResolveCreditDispute(track.id)}
                          className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10.5px] transition"
                        >
                          Résoudre
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDisputeForm((v) => !v)}
                      className="text-[11px] font-mono text-amber-300 hover:text-amber-200 underline"
                    >
                      Admin : Ouvrir un litige crédit
                    </button>
                  </div>
                )}

                {showDisputeForm && !hasEscrow && onOpenCreditDispute && (
                  <div className="p-2.5 rounded-xl bg-[#0D1017] border border-amber-400/30 space-y-2">
                    <input
                      type="text"
                      value={disputeReasonInput}
                      onChange={(e) => setDisputeReasonInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white"
                      placeholder="Motif du litige"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCreditDispute(track.id, disputeReasonInput);
                        setShowDisputeForm(false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                    >
                      Mettre sous séquestre
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-4 flex flex-col justify-between gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Certifications &amp; Informations Audio
            </span>

            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Progression Single : {trackCert.label}
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
                <span>Or 100K • Platine 250K • Diamant 500K</span>
                {trackCert.nextLevelLabel && (
                  <span className="text-amber-200">
                    Prochain : {formatCompactNumber(trackCert.nextThreshold || 100000)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 my-auto">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Format &amp; Volume Audio</span>
                <span className="text-emerald-400 font-bold">
                  Opus • Niveau Constant (-14 LUFS)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Durée du titre</span>
                <span className="text-white font-bold">
                  {formatShortTime(track.duration)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Extrait Drop</span>
                <span className="text-amber-300 font-bold">
                  {formatShortTime(track.dropStart)} (
                  {track.dropDuration}s)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E93A4]">Temps d&apos;écoute total</span>
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
  isAdminView?: boolean;
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
  isAdminView = false,
  onClose,
  onSelectTrackDetail,
  onPlayOrToggleTrack,
  onOpenEntityProfile,
  onOpenUserProfile,
  onToggleSubscribeArtist,
}) => {
  const roleLabel =
    analytics.role === 'ARTIST'
      ? 'Profil Artiste'
      : analytics.role === 'LABEL'
        ? 'Profil Label'
        : analytics.role === 'BEATMAKER'
          ? 'Profil Beatmaker'
          : analytics.role === 'ENGINEER'
            ? 'Profil Ingénieur du Son'
            : 'Profil Auteur / Parolier';

  const allTeamMembers = [
    ...(analytics.role !== 'ARTIST' ? analytics.studioTeam.artists || [] : []),
    ...(analytics.role !== 'LABEL' ? analytics.studioTeam.labels || [] : []),
    ...(analytics.role !== 'BEATMAKER'
      ? analytics.studioTeam.beatmakers || []
      : []),
    ...(analytics.role !== 'ENGINEER'
      ? analytics.studioTeam.engineers || []
      : []),
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

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <CertificationBadgeSvg
            cert={cert}
            compact
            entityTitle={analytics.entityName}
            entityArtist={roleLabel}
            playsCount={analytics.totalPlays}
          />
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
                <CertificationBadgeSvg
                  cert={cert}
                  entityTitle={analytics.entityName}
                  entityArtist={roleLabel}
                  playsCount={analytics.totalPlays}
                />
                {analytics.role === 'ARTIST' && onToggleSubscribeArtist && (
                  <button
                    type="button"
                    onClick={() =>
                      onToggleSubscribeArtist(analytics.entityName)
                    }
                    className={`p-2 sm:px-3 sm:py-1 rounded-full text-xs font-bold border transition flex items-center gap-1.5 ${
                      analytics.isSubscribed
                        ? 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300'
                        : 'bg-[#DE1B34] hover:bg-[#f02845] border-[#DE1B34] text-white shadow-[0_0_12px_rgba(222,27,52,0.4)]'
                    }`}
                    title={
                      analytics.isSubscribed ? 'Abonné' : 'S’abonner à cet artiste'
                    }
                  >
                    {analytics.isSubscribed ? (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                      >
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <polyline points="17 11 19 13 23 9" />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                      >
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">
                      {analytics.isSubscribed ? 'Abonné' : 'S’abonner'}
                    </span>
                    {analytics.subscribersCount !== undefined && (
                      <span className="font-mono text-[11px] opacity-90">
                        ({formatCompactNumber(analytics.subscribersCount)})
                      </span>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8E93A4] mt-1">
                {analytics.tracks.length} titre(s) au catalogue •{' '}
                {formatLongListenDuration(analytics.totalListenSeconds)} d&apos;écoute
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="px-3 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-center">
              <span className="text-[10px] text-[#8E93A4] block">Écoutes</span>
              <span className="font-mono text-xs font-bold text-white">
                {formatCompactNumber(analytics.totalPlays)}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-center">
              <span className="text-[10px] text-[#8E93A4] block">Favoris</span>
              <span className="font-mono text-xs font-bold text-rose-300">
                {formatCompactNumber(analytics.totalLikes)}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-center">
              <span className="text-[10px] text-[#8E93A4] block">Boucles</span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {formatCompactNumber(analytics.totalLoops)}
              </span>
            </div>
          </div>
        </div>

        {/* Détails techniques réservés à l'Admin */}
        {isAdminView && dr && (
          <div className="bg-[#07080C] border border-amber-400/25 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                Diagnostic Admin — Score Métier ({dr.decoupledScore} pts)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[11px]">
                Multiplicateur : x{dr.versatilityMultiplier.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.06]">
                <span className="text-[10px] font-mono text-[#8E93A4] block">
                  {dr.primaryMetricLabel}
                </span>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  {dr.primaryMetricValue}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.06]">
                <span className="text-[10px] font-mono text-[#8E93A4] block">
                  {dr.secondaryMetricLabel}
                </span>
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  {dr.secondaryMetricValue}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#0D1017] border border-white/[0.06]">
                <span className="text-[10px] font-mono text-[#8E93A4] block">
                  {dr.tertiaryMetricLabel}
                </span>
                <span className="text-xs font-bold text-sky-300 font-mono">
                  {dr.tertiaryMetricValue}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Discography / Productions List */}
        <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
            Titres &amp; Collaborations ({analytics.tracks.length})
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
                            FEAT
                          </span>
                        )}
                        <CertificationBadgeSvg
                          cert={tCert}
                          compact
                          entityTitle={t.title}
                          entityArtist={t.artist}
                          playsCount={t.realPlays}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-[#8E93A4] truncate">
                        {t.artist}
                        {t.featuringArtists && t.featuringArtists.length > 0
                          ? ` feat. ${t.featuringArtists.join(', ')}`
                          : ''}{' '}
                        • {formatShortTime(t.duration)} •{' '}
                        {formatCompactNumber(t.realPlays)} écoutes
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
              Collaborateurs &amp; Équipe Studio
            </span>
            {allTeamMembers.length === 0 ? (
              <span className="text-xs text-zinc-500">
                Aucun collaborateur externe associé.
              </span>
            ) : (
              allTeamMembers.map((member) => (
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
                              ? 'AUTEUR'
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
              ))
            )}
          </div>

          <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E93A4]">
              Meilleurs Auditeurs
            </span>
            {!analytics.topListeners || analytics.topListeners.length === 0 ? (
              <span className="text-xs text-zinc-500">
                Aucun auditeur enregistré pour le moment.
              </span>
            ) : (
              analytics.topListeners.map((listener, idx) => {
                if (!listener || !listener.user) return null;
                return (
                  <button
                    key={listener.user.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUserProfile(listener.user.id);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#0D1017] hover:border-emerald-500/40 border border-white/[0.05] text-xs transition text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <RankBadgeSvg rank={idx + 1} delta={0} />
                      <span className="font-semibold text-[#F5F2EB] truncate">
                        {listener.user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8E93A4] shrink-0">
                      <span>
                        {formatLongListenDuration(listener.listenSeconds || 0)}
                      </span>
                      <span>→</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 4. REUSABLE USER LISTENING PROFILE (100% Null-Safe & Épuré)               */
/* ========================================================================= */
export interface UserPlaylist {
  id: string;
  name: string;
  colorTheme: string;
  iconType?: 'heart' | 'fire' | 'moon' | 'sparkle';
  trackIds: string[];
  createdAt: string;
}

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
  userPlaylists?: UserPlaylist[];
  onCreatePlaylist?: (
    name: string,
    colorTheme?: string,
    initialTrackId?: string
  ) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onToggleTrackInPlaylist?: (playlistId: string, trackId: string) => void;
  likedTrackIds?: Record<string, boolean>;
  onToggleLike?: (trackId: string) => void;
  subscribedArtists?: Record<string, boolean>;
  onToggleSubscribeArtist?: (artistName: string) => void;
  onOpenEntityProfile?: (name: string, role: StudioEntityRole) => void;
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
  allTracksFlat = [],
  trackRankMap = {},
  currentTrackId,
  isPlaying,
  userPlaylists = [],
  onCreatePlaylist,
  onDeletePlaylist,
  onToggleTrackInPlaylist,
  likedTrackIds = {},
  onToggleLike,
  subscribedArtists = {},
  onToggleSubscribeArtist,
  onOpenEntityProfile,
  onClose,
  onSelectTrackDetail,
  onPlayOrToggleTrack,
}) => {
  const [profileSectionTab, setProfileSectionTab] = useState<
    'PLAYLISTS' | 'FAVORIS' | 'ECOUTES' | 'PASS'
  >('PLAYLISTS');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistColor, setNewPlaylistColor] = useState('#e11d38');
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(
    null
  );
  const [showAddTrackPickerForPlaylist, setShowAddTrackPickerForPlaylist] =
    useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center bg-[#0D1017] border border-white/[0.1] rounded-2xl p-6 text-center gap-3">
        <p className="text-sm text-zinc-300">Profil auditeur introuvable.</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
          >
            Retour
          </button>
        )}
      </div>
    );
  }

  const safeTrackStats = user.trackStats ? Object.values(user.trackStats) : [];
  const statsList = safeTrackStats
    .map((st) => {
      if (!st || !st.trackId) return null;
      const found = (allTracksFlat || []).find(
        (item) => item?.track?.id === st.trackId
      );
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
    (a, b) => (b.stat.listenSeconds || 0) - (a.stat.listenSeconds || 0)
  );
  const byLoops = [...statsList].sort(
    (a, b) => (b.stat.loopsCount || 0) - (a.stat.loopsCount || 0)
  );
  const topLoopedItem = byLoops[0] || null;

  const genreTotals: Record<
    string,
    { category: string; seconds: number; plays: number; loops: number }
  > = {};
  for (const item of statsList) {
    const cat = item.track.category || 'Musique Gabonaise';
    if (!genreTotals[cat]) {
      genreTotals[cat] = { category: cat, seconds: 0, plays: 0, loops: 0 };
    }
    genreTotals[cat].seconds += item.stat.listenSeconds || 0;
    genreTotals[cat].plays += item.stat.playsCount || 0;
    genreTotals[cat].loops += item.stat.loopsCount || 0;
  }
  const favoriteGenres = Object.values(genreTotals).sort(
    (a, b) => b.seconds - a.seconds
  );

  // Liked tracks list
  const likedTracksList = (allTracksFlat || []).filter(
    (item) =>
      likedTrackIds[item.track.id] ||
      Boolean(user.trackStats?.[item.track.id]?.liked)
  );

  // Followed artists list (deduplicated)
  const followedArtistNames = Array.from(
    new Set(
      Object.entries(subscribedArtists)
        .filter(([, isSub]) => isSub)
        .map(([k]) => {
          const matchedTrack = (allTracksFlat || []).find(
            (m) => m.track.artist.toLowerCase() === k.toLowerCase()
          );
          return matchedTrack ? matchedTrack.track.artist : k;
        })
    )
  );

  const activePassSpec =
    (subscriptionPass && GABON_PASS_SPECS[subscriptionPass]) ||
    GABON_PASS_SPECS.PASS_MENSUEL_HEBDO;

  const PLAYLIST_COLOR_SWATCHES = [
    { hex: '#e11d38', label: 'Rubis' },
    { hex: '#f59e0b', label: 'Ambre' },
    { hex: '#10b981', label: 'Émeraude' },
    { hex: '#8b5cf6', label: 'Violet' },
    { hex: '#06b6d4', label: 'Cyan' },
  ];

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
          <RankBadgeSvg rank={userRank || 1} delta={0} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-0.5">
        {/* User Identity Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#07080C] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center font-bold text-sm text-emerald-300 shrink-0">
              {user.avatar ||
                (user.name ? user.name.slice(0, 2).toUpperCase() : 'AU')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#F5F2EB] truncate">
                  {user.name || 'Auditeur'}
                </h2>
                <RankBadgeSvg rank={userRank || 1} delta={0} />
              </div>
              <div className="text-xs text-[#8E93A4] font-mono truncate mt-0.5">
                {userPlaylists.length} playlist(s) · {likedTracksList.length}{' '}
                likes · {byListenTime.length} titres écoutés
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
              {formatLongListenDuration(user.totalListenSeconds || 0)}
            </div>
          </div>
        </div>

        {/* Navigation interne de la Bibliothèque personnelle (si propre profil) */}
        {isOwnProfile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[#07080C] border border-white/[0.08]">
            {(
              [
                {
                  id: 'PLAYLISTS',
                  label: `Playlists (${userPlaylists.length})`,
                },
                {
                  id: 'FAVORIS',
                  label: `Likes & Favoris (${likedTracksList.length + followedArtistNames.length})`,
                },
                {
                  id: 'ECOUTES',
                  label: `Écoutes (${byListenTime.length})`,
                },
                {
                  id: 'PASS',
                  label: 'Pass +241',
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProfileSectionTab(tab.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap truncate transition ${
                  profileSectionTab === tab.id
                    ? 'bg-[#e11d38] text-white shadow-[0_4px_14px_rgba(225,29,56,0.35)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ================================================================= */}
        {/* SOUS-VOLET 1 : MES PLAYLISTS & RÉPERTOIRES PERSONNELS             */}
        {/* ================================================================= */}
        {isOwnProfile && profileSectionTab === 'PLAYLISTS' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Formulaire rapide de création de playlist */}
            {onCreatePlaylist && (
              <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">
                    Créer une nouvelle playlist personnelle
                  </span>
                  <div className="flex items-center gap-1.5">
                    {PLAYLIST_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setNewPlaylistColor(swatch.hex)}
                        className={`w-5 h-5 rounded-full transition ${
                          newPlaylistColor === swatch.hex
                            ? 'ring-2 ring-white scale-110'
                            : 'opacity-65 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.label}
                        aria-label={`Couleur ${swatch.label}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPlaylistName.trim()) {
                        onCreatePlaylist(
                          newPlaylistName.trim(),
                          newPlaylistColor
                        );
                        setNewPlaylistName('');
                      }
                    }}
                    placeholder="Nom de votre playlist (ex: Sport, Soirée Libreville, Chill...)"
                    className="flex-1 bg-[#0D1017] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPlaylistName.trim()) return;
                      onCreatePlaylist(
                        newPlaylistName.trim(),
                        newPlaylistColor
                      );
                      setNewPlaylistName('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shrink-0 transition"
                  >
                    + Créer
                  </button>
                </div>
              </div>
            )}

            {/* Grille de cartes carrées des playlists de l'utilisateur */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userPlaylists.map((pl) => {
                const plTracks = pl.trackIds
                  .map((id) =>
                    (allTracksFlat || []).find((m) => m.track.id === id)
                  )
                  .filter(
                    (
                      m
                    ): m is {
                      track: AnalyticsTrackItem;
                      albumIndex: number;
                      trackIndex: number;
                    } => Boolean(m)
                  );
                const firstTrack = plTracks[0]?.track;
                const isExpanded = expandedPlaylistId === pl.id;

                return (
                  <div
                    key={pl.id}
                    onClick={() =>
                      setExpandedPlaylistId(isExpanded ? null : pl.id)
                    }
                    className={`group relative aspect-square rounded-2xl overflow-hidden border cursor-pointer transition-transform active:scale-[0.98] ${
                      isExpanded
                        ? 'border-amber-400 ring-2 ring-amber-400/40'
                        : 'border-white/15 hover:border-white/30'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${
                        pl.colorTheme || '#e11d38'
                      } 0%, #090b10 90%)`,
                    }}
                  >
                    {firstTrack && (
                      <div className="absolute inset-0 opacity-65 group-hover:scale-105 transition-transform duration-300">
                        <CoverArtwork
                          artworkType={firstTrack.artworkType}
                          coverUrl={firstTrack.cover}
                          title={pl.name}
                          artist={firstTrack.artist}
                        />
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, rgba(0,0,0,0.92) 10%, ${
                          pl.colorTheme || '#e11d38'
                        }55 55%, rgba(0,0,0,0.25) 100%)`,
                      }}
                    />

                    {/* Bouton Lecture directe en haut à droite */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold text-white/90 drop-shadow">
                        {plTracks.length} titre{plTracks.length > 1 ? 's' : ''}
                      </span>
                      {plTracks.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayOrToggleTrack(
                              plTracks[0].albumIndex,
                              plTracks[0].trackIndex
                            );
                          }}
                          className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg hover:scale-105 transition"
                          title={`Lire ${pl.name}`}
                        >
                          ▶
                        </button>
                      )}
                    </div>

                    {/* Titre court directement sur la carte */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight line-clamp-2 drop-shadow">
                        {pl.name}
                      </h4>
                      <span className="text-[10px] text-white/75 mt-0.5 block">
                        {isExpanded ? 'Masquer les titres ▲' : 'Ouvrir la playlist ▼'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Détail de la playlist sélectionnée (ajout/retrait de titres) */}
            {expandedPlaylistId &&
              (() => {
                const activePl = userPlaylists.find(
                  (p) => p.id === expandedPlaylistId
                );
                if (!activePl) return null;
                const plTracks = activePl.trackIds
                  .map((id) =>
                    (allTracksFlat || []).find((m) => m.track.id === id)
                  )
                  .filter(
                    (
                      m
                    ): m is {
                      track: AnalyticsTrackItem;
                      albumIndex: number;
                      trackIndex: number;
                    } => Boolean(m)
                  );
                const isPickerOpen =
                  showAddTrackPickerForPlaylist === activePl.id;

                return (
                  <div className="bg-[#07080C] border border-amber-400/40 rounded-2xl p-4 space-y-3 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                      <div>
                        <h4 className="text-sm font-extrabold text-white">
                          {activePl.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          {plTracks.length} titre(s) enregistré(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShowAddTrackPickerForPlaylist(
                              isPickerOpen ? null : activePl.id
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold transition"
                        >
                          {isPickerOpen ? 'Fermer le catalogue' : '+ Ajouter des titres'}
                        </button>
                        {onDeletePlaylist && userPlaylists.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeletePlaylist(activePl.id);
                              setExpandedPlaylistId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-xs font-semibold transition"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sélecteur rapide pour ajouter/retirer n'importe quel titre du catalogue */}
                    {isPickerOpen && onToggleTrackInPlaylist && (
                      <div className="p-3 rounded-xl bg-[#0D1017] border border-white/10 space-y-2 max-h-52 overflow-y-auto">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                          Catalogue — Cochez pour ajouter ou retirer de « {activePl.name} »
                        </span>
                        {allTracksFlat.map(({ track: t }) => {
                          const inPlaylist = activePl.trackIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() =>
                                onToggleTrackInPlaylist(activePl.id, t.id)
                              }
                              className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-left transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                  <CoverArtwork
                                    artworkType={t.artworkType}
                                    coverUrl={t.cover}
                                    title={t.title}
                                    artist={t.artist}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">
                                    {t.title}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 truncate">
                                    {t.artist}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                                  inPlaylist
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-white/10 text-white'
                                }`}
                              >
                                {inPlaylist ? 'Ajouté ✓' : '+ Ajouter'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Liste des titres de la playlist */}
                    {plTracks.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-2">
                        Aucun titre dans cette playlist. Cliquez sur « + Ajouter des titres » ci-dessus.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {plTracks.map(({ track: t, albumIndex, trackIndex }) => {
                          const isThisPlaying =
                            currentTrackId === t.id && isPlaying;
                          return (
                            <div
                              key={t.id}
                              onClick={() =>
                                onPlayOrToggleTrack(albumIndex, trackIndex)
                              }
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                                  <CoverArtwork
                                    artworkType={t.artworkType}
                                    coverUrl={t.cover}
                                    title={t.title}
                                    artist={t.artist}
                                  />
                                  <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                                    {isThisPlaying ? '❚❚' : '▶'}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate">
                                    {t.title}
                                  </p>
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    {t.artist}
                                  </p>
                                </div>
                              </div>
                              {onToggleTrackInPlaylist && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTrackInPlaylist(activePl.id, t.id);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 text-[10px] font-semibold transition"
                                >
                                  Retirer
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        )}

        {/* ================================================================= */}
        {/* SOUS-VOLET 2 : MES LIKES & ARTISTES FAVORIS                       */}
        {/* ================================================================= */}
        {isOwnProfile && profileSectionTab === 'FAVORIS' && (
          <div className="space-y-4 animate-fade-in">
            {/* Artistes suivis en Cartes Circulaires */}
            <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-white block">
                Mes Artistes Favoris ({followedArtistNames.length})
              </span>
              {followedArtistNames.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  Vous ne suivez aucun artiste pour le moment. Cliquez sur l&apos;icône d&apos;abonnement sur le lecteur ou une fiche artiste.
                </p>
              ) : (
                <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
                  {followedArtistNames.map((artName) => {
                    const artTrack = (allTracksFlat || []).find(
                      (m) =>
                        m.track.artist.toLowerCase() === artName.toLowerCase()
                    )?.track;
                    return (
                      <div
                        key={artName}
                        className="flex flex-col items-center gap-1.5 shrink-0 w-24"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onOpenEntityProfile?.(artName, 'ARTIST')
                          }
                          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.28)] group"
                        >
                          <CoverArtwork
                            artworkType={artTrack?.artworkType}
                            coverUrl={artTrack?.cover || ''}
                            title={artName}
                            artist={artName}
                          />
                        </button>
                        <span className="text-xs font-bold text-white truncate max-w-full">
                          {artName}
                        </span>
                        {onToggleSubscribeArtist && (
                          <button
                            type="button"
                            onClick={() => onToggleSubscribeArtist(artName)}
                            className="text-[10px] text-rose-300 hover:underline"
                          >
                            Ne plus suivre
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Titres Likés */}
            <div className="bg-[#07080C] border border-white/[0.08] rounded-2xl p-3.5 space-y-2.5">
              <span className="text-xs font-bold text-white block">
                Mes Coups de Cœur &amp; Likes ({likedTracksList.length})
              </span>
              {likedTracksList.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  Aucun titre liké pour le moment. Appuyez sur le cœur sur le lecteur pour enregistrer vos favoris.
                </p>
              ) : (
                <div className="space-y-2">
                  {likedTracksList.map(({ track: t, albumIndex, trackIndex }) => {
                    const isThisPlaying =
                      currentTrackId === t.id && isPlaying;
                    return (
                      <div
                        key={t.id}
                        onClick={() =>
                          onPlayOrToggleTrack(albumIndex, trackIndex)
                        }
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                            <CoverArtwork
                              artworkType={t.artworkType}
                              coverUrl={t.cover}
                              title={t.title}
                              artist={t.artist}
                            />
                            <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                              {isThisPlaying ? '❚❚' : '▶'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">
                              {t.title}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {t.artist} · {t.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onToggleLike && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike(t.id);
                              }}
                              className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/30 transition"
                              title="Retirer des likes"
                            >
                              ♥
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTrackDetail(t.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[10px] font-semibold"
                          >
                            Fiche
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SOUS-VOLET 4 : MON PASS D'ÉCOUTE MOBILE MONEY (+241)              */}
        {/* ================================================================= */}
        {isOwnProfile && profileSectionTab === 'PASS' && (
          <div className="bg-[#07080C] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                  Mon Pass d&apos;Écoute &amp; Mobile Money (+241)
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Forfait actif :{' '}
                  <strong className="text-white">
                    {activePassSpec.shortLabel}
                  </strong>
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
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9.5px] font-bold">
                            Actif
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {spec.paymentMethods}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {onChangeNetworkOperator && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 text-[11px] font-mono">
                <span className="text-zinc-400">Opérateur :</span>
                {(
                  [
                    { id: 'AIRTEL_GABON', label: 'Airtel Money' },
                    { id: 'MOOV_AFRICA', label: 'Moov Money' },
                    { id: 'GABON_TELECOM', label: 'Gabon Telecom' },
                  ] as { id: GabonNetworkOperator; label: string }[]
                ).map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => onChangeNetworkOperator(op.id)}
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
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* SOUS-VOLET 3 (OU VUE AUDITEUR TIERS) : HISTORIQUE D'ÉCOUTES       */}
        {/* ================================================================= */}
        {(!isOwnProfile || profileSectionTab === 'ECOUTES') && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Top Looped Track & Favorite Genres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#07080C] border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  Titre le plus écouté en boucle
                </span>
                {topLoopedItem ? (
                  <div
                    onClick={() =>
                      onSelectTrackDetail(topLoopedItem.track.id)
                    }
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
                          {topLoopedItem.stat.loopsCount}x boucles
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
                      {currentTrackId === topLoopedItem.track.id &&
                      isPlaying ? (
                        <svg
                          className="w-3.5 h-3.5 fill-current"
                          viewBox="0 0 24 24"
                        >
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
                  <div className="text-xs text-[#8E93A4]">
                    Aucune écoute en boucle enregistrée.
                  </div>
                )}
              </div>

              <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#DE1B34]">
                  Genres Favoris
                </span>
                {favoriteGenres.length === 0 ? (
                  <span className="text-xs text-zinc-500">
                    Aucun genre favori.
                  </span>
                ) : (
                  favoriteGenres.map((g, i) => (
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
                  ))
                )}
              </div>
            </div>

            {/* Per-Track Listening History */}
            <div className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E93A4]">
                Historique des titres écoutés ({byListenTime.length})
              </span>
              {byListenTime.length === 0 ? (
                <span className="text-xs text-zinc-500">
                  Aucun historique d&apos;écoute disponible.
                </span>
              ) : (
                byListenTime.map(
                  ({ stat, track, albumIndex, trackIndex }) => {
                    const rInfo = trackRankMap[track.id] || {
                      rank: 1,
                      delta: 0,
                    };
                    const isThisPlaying =
                      currentTrackId === track.id && isPlaying;
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
                              {formatLongListenDuration(stat.listenSeconds)} ·{' '}
                              {stat.playsCount} écoutes · {stat.loopsCount}x
                              boucles
                            </div>
                          </div>
                        </div>
                        <RankBadgeSvg rank={rInfo.rank} delta={rInfo.delta} />
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

