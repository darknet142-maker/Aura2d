import React, { useState, useEffect } from 'react';

export type ArtworkType =
  | 'creative_yellow'
  | 'crimson_bloom'
  | 'pastel_heart'
  | 'emerald_matrix'
  | 'violet_odyssey';

interface CoverArtworkProps {
  artworkType?: ArtworkType;
  coverUrl?: string;
  title: string;
  artist?: string;
  className?: string;
}

export const CoverArtwork: React.FC<CoverArtworkProps> = ({
  artworkType,
  coverUrl,
  title,
  artist,
  className = 'w-full h-full object-cover',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [coverUrl]);

  // PRIORITÉ ABSOLUE N°1 : Si une pochette a été téléchargée (DataURL ou URL Supabase), on l'affiche en priorité !
  if (coverUrl && coverUrl.trim().length > 0 && !imgError) {
    return (
      <img
        src={coverUrl}
        alt={title}
        draggable={false}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        className={className}
      />
    );
  }

  if (artworkType === 'creative_yellow') {
    return (
      <svg
        viewBox="0 0 400 430"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgYellow" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#fbbd23" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="hoodieGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="50%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="6"
              floodColor="#000"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        <rect width="400" height="430" fill="url(#bgYellow)" />

        <text
          x="58"
          y="325"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="900"
          fontSize="180"
          fill="#d97706"
          opacity="0.45"
        >
          C
        </text>
        <text
          x="235"
          y="330"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="900"
          fontSize="185"
          fill="#d97706"
          opacity="0.45"
        >
          A
        </text>

        <g
          fill="#ffffff"
          style={{
            fontFamily: "'Permanent Marker', cursive, sans-serif",
            textAnchor: 'middle',
          }}
        >
          <text x="200" y="76" fontSize="50" letterSpacing="1">
            ALWAYS BE
          </text>
          <text x="200" y="130" fontSize="55" letterSpacing="1">
            CREATIVE
          </text>
        </g>

        <g
          transform="translate(88, 226)"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="900"
          fontSize="12"
        >
          <text x="0" y="0" fill="#1c1917">
            CREA
          </text>
          <text x="0" y="11" fill="#1c1917">
            TIVITY
          </text>
          <text x="0" y="22" fill="#ffffff">
            IS FUN
          </text>
        </g>

        <path
          d="M 30 355 Q 200 320 375 365"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.85"
        />

        <g transform="translate(0, 8)">
          <path
            d="M 82 430 L 106 320 Q 125 285 200 285 Q 275 285 294 320 L 318 430 Z"
            fill="url(#hoodieGrad)"
            stroke="#713f12"
            strokeWidth="2"
          />
          <path d="M 145 290 L 200 395 L 255 290 Z" fill="#451a03" />
          <path
            d="M 162 325 L 238 325 M 172 355 L 228 355"
            stroke="#d97706"
            strokeWidth="6"
          />
          <path
            d="M 122 292 Q 140 246 200 256 Q 260 246 278 292 Q 245 322 200 320 Q 155 322 122 292 Z"
            fill="#b45309"
            stroke="#fef08a"
            strokeWidth="1.5"
          />
          <path
            d="M 188 312 Q 186 355 189 390"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 212 312 Q 214 355 211 390"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <rect x="176" y="232" width="48" height="45" rx="16" fill="#7c3f1c" />
          <path
            d="M 176 245 Q 200 265 224 245"
            fill="#431407"
            opacity="0.45"
          />

          <rect x="158" y="152" width="84" height="96" rx="40" fill="#8d4925" />
          <circle cx="156" cy="202" r="10" fill="#7c3f1c" />
          <circle cx="244" cy="202" r="10" fill="#7c3f1c" />

          <path
            d="M 173 190 Q 182 181 191 190"
            fill="none"
            stroke="#1c1917"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 209 190 Q 218 181 227 190"
            fill="none"
            stroke="#1c1917"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 170 177 Q 182 170 193 176"
            fill="none"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 207 176 Q 218 170 230 177"
            fill="none"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <path
            d="M 194 202 Q 200 208 206 202"
            fill="none"
            stroke="#52250c"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M 175 213 Q 200 238 225 213 Z"
            fill="#ffffff"
            stroke="#451a03"
            strokeWidth="2.5"
          />
          <path
            d="M 181 221 Q 200 227 219 221"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          <g fill="#1c1917">
            <circle cx="200" cy="142" r="24" />
            <circle cx="176" cy="148" r="20" />
            <circle cx="224" cy="148" r="20" />
            <path d="M 160 165 Q 140 142 152 125 Q 168 135 172 155 Z" />
            <path d="M 175 145 Q 165 112 182 108 Q 192 125 188 148 Z" />
            <path d="M 198 142 Q 202 104 218 110 Q 216 130 208 146 Z" />
            <path d="M 218 148 Q 238 116 250 128 Q 238 148 228 158 Z" />
            <path d="M 232 162 Q 260 146 264 162 Q 246 174 235 172 Z" />
            <path d="M 158 175 Q 134 165 138 182 Q 152 185 162 182 Z" />
          </g>

          <g stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round">
            <line x1="258" y1="205" x2="270" y2="200" />
            <line x1="260" y1="218" x2="274" y2="218" />
            <line x1="258" y1="231" x2="270" y2="236" />
          </g>
        </g>

        <path
          d="M -15 362 Q 45 395 210 402 Q 345 408 415 425"
          fill="none"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
          filter="url(#ribbonGlow)"
        />
      </svg>
    );
  }

  if (artworkType === 'crimson_bloom') {
    return (
      <svg
        viewBox="0 0 400 430"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgCrimson" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="35%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="petalRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </radialGradient>
        </defs>
        <rect width="400" height="430" fill="url(#bgCrimson)" />
        <g stroke="#cbd5e1" strokeWidth="2" opacity="0.35">
          <line x1="0" y1="20" x2="400" y2="90" />
          <line x1="0" y1="40" x2="400" y2="110" />
          <line x1="0" y1="60" x2="400" y2="130" />
          <line x1="0" y1="80" x2="400" y2="150" />
        </g>
        <path
          d="M 40 110 Q 170 120 190 210 Q 140 265 40 250 Z"
          fill="#1e1b4b"
        />
        <path
          d="M 65 175 Q 135 170 155 198 Q 120 218 65 205 Z"
          fill="#f43f5e"
        />
        <text
          x="72"
          y="197"
          fontFamily="monospace"
          fontWeight="bold"
          fontSize="16"
          fill="#fde047"
        >
          KAO..!
        </text>
        <g transform="translate(180, 320)">
          <circle
            cx="-40"
            cy="40"
            r="75"
            fill="url(#petalRed)"
            stroke="#fda4af"
            strokeWidth="1.5"
          />
          <circle
            cx="30"
            cy="10"
            r="80"
            fill="url(#petalRed)"
            stroke="#fda4af"
            strokeWidth="1.5"
          />
          <circle
            cx="-10"
            cy="-30"
            r="65"
            fill="url(#petalRed)"
            stroke="#fda4af"
            strokeWidth="1.5"
          />
          <circle cx="0" cy="15" r="24" fill="#4c0519" />
        </g>
      </svg>
    );
  }

  if (artworkType === 'pastel_heart') {
    return (
      <svg
        viewBox="0 0 400 430"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgSky" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="55%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <radialGradient id="heart3d" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
        </defs>
        <rect width="400" height="430" fill="url(#bgSky)" />
        <path
          d="M 95 115 C 65 90, 35 55, 65 32 C 85 18, 105 38, 110 48 C 115 38, 135 18, 155 32 C 185 55, 155 90, 110 122 Z"
          fill="url(#heart3d)"
          opacity="0.9"
        />
        <path
          d="M 90 155 L 95 168 L 108 173 L 95 178 L 90 191 L 85 178 L 72 173 L 85 168 Z"
          fill="#ffffff"
        />
        <circle cx="60" cy="145" r="3" fill="#ffffff" opacity="0.8" />
        <path
          d="M 150 430 Q 175 210 265 140 L 400 180 L 400 430 Z"
          fill="#f1f5f9"
        />
        <path
          d="M 120 340 Q 195 290 230 330 Q 195 375 130 390 Z"
          fill="#fbcfe8"
          stroke="#f472b6"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (artworkType === 'emerald_matrix') {
    return (
      <svg
        viewBox="0 0 400 430"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgEmerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="50%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
        </defs>
        <rect width="400" height="430" fill="url(#bgEmerald)" />
        <circle
          cx="200"
          cy="215"
          r="120"
          fill="none"
          stroke="#34d399"
          strokeWidth="12"
          opacity="0.35"
        />
        <circle cx="200" cy="215" r="75" fill="#10b981" opacity="0.5" />
        <text
          x="200"
          y="225"
          textAnchor="middle"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="900"
          fontSize="42"
          fill="#ffffff"
          letterSpacing="4"
        >
          PULSE
        </text>
      </svg>
    );
  }

  if (artworkType === 'violet_odyssey') {
    return (
      <svg
        viewBox="0 0 400 430"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgStudioHorizon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0c4a6e" />
            <stop offset="50%" stopColor="#082f49" />
            <stop offset="100%" stopColor="#080a0f" />
          </linearGradient>
        </defs>
        <rect width="400" height="430" fill="url(#bgStudioHorizon)" />
        <circle cx="200" cy="215" r="105" fill="#38bdf8" opacity="0.22" />
        <path
          d="M 70 320 Q 200 120 330 320"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <text
          x="200"
          y="110"
          textAnchor="middle"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="900"
          fontSize="36"
          fill="#f8fafc"
          letterSpacing="3"
        >
          HORIZON
        </text>
      </svg>
    );
  }

  const monogram = (title || artist || 'DR')
    .replace(/[^a-zA-Z0-9À-ÿ]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'DR';

  return (
    <div
      className={`relative overflow-hidden flex flex-col items-center justify-between p-2.5 bg-gradient-to-br from-[#131722] via-[#0D1017] to-[#080A0F] text-[#F8FAFC] select-none ${className}`}
      role="img"
      aria-label={`Master Audio Studio : ${title}${artist ? ` — ${artist}` : ''}`}
    >
      {/* Sillons de vinyle Studio Broadcast SVG locaux */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="vinylSheen" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#DE1B34" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#080A0F" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#vinylSheen)" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="#F8FAFC" strokeOpacity="0.08" strokeWidth="1" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#F8FAFC" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="6 4" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="#F59E0B" strokeOpacity="0.16" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="42" fill="none" stroke="#DE1B34" strokeOpacity="0.28" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="24" fill="#0D1017" stroke="#F59E0B" strokeOpacity="0.45" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="5" fill="#F59E0B" />
      </svg>

      {/* En-tête technique Broadcast */}
      <div className="relative z-10 w-full flex items-center justify-between gap-1 text-[8px] font-mono uppercase tracking-wider text-[#A3A9BA]">
        <span className="truncate px-1.5 py-0.5 rounded bg-[#07090E]/80 border border-white/10 text-amber-300 font-bold">
          MASTER BROADCAST
        </span>
        <span className="shrink-0 text-[7px] text-[#A3A9BA]/90 font-mono">HD</span>
      </div>

      {/* Monogramme & Disque Central */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-[#07090E]/90 border border-amber-500/40 flex items-center justify-center shadow-[0_4px_14px_rgba(222,27,52,0.3)]">
          <span className="text-[11px] font-black tracking-tighter text-amber-300 font-mono">
            {monogram}
          </span>
        </div>
      </div>

      {/* Pied typographique textuel résilient aux titres de 80+ caractères */}
      <div className="relative z-10 w-full min-w-0 bg-[#07090E]/85 backdrop-blur-xs border border-white/10 rounded-lg px-2 py-1 text-center">
        <p className="text-[9px] font-extrabold text-[#F8FAFC] truncate leading-tight">
          {title || ' Piste Studio Sans Titre '}
        </p>
        {artist && (
          <p className="text-[8px] font-mono uppercase tracking-wider text-[#A3A9BA] truncate leading-tight mt-0.5">
            {artist}
          </p>
        )}
      </div>
    </div>
  );
};

// --- Logo Officiel DROP (PNG Officiel Haute Précision Zéro Déformation) ---
export const DropOfficialLogo: React.FC<{ className?: string }> = ({
  className = 'h-[20px] w-auto',
}) => {
  return (
    <img
      src="/drop-logo.png?v=2"
      alt="DROP"
      draggable={false}
      decoding="async"
      className={`${className} object-contain select-none`}
    />
  );
};

// --- Distinctions de Rang 100 % Full SVG (Zéro Emoji : Couronne Or #1, Argent #2, Bronze #3) ---
export const RankMedalSvg: React.FC<{ rank: number; className?: string }> = ({
  rank,
  className = 'w-3.5 h-3.5',
}) => {
  if (rank === 1) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.55)]`}
        aria-label="Rang 1 Or"
      >
        <defs>
          <linearGradient id="goldCrownGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <path
          d="M3 18.5H21V20.5H3V18.5ZM3.5 16L2 7L8 11.2L12 4.5L16 11.2L22 7L20.5 16H3.5Z"
          fill="url(#goldCrownGrad)"
          stroke="#FEF9C3"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (rank === 2) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} shrink-0 drop-shadow-[0_0_5px_rgba(226,232,240,0.45)]`}
        aria-label="Rang 2 Argent"
      >
        <defs>
          <linearGradient id="silverCrestGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="55%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
        </defs>
        <polygon
          points="12,2.5 14.9,8.4 21.4,9.3 16.7,13.9 17.8,20.4 12,17.3 6.2,20.4 7.3,13.9 2.6,9.3 9.1,8.4"
          fill="url(#silverCrestGrad)"
          stroke="#F1F5F9"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (rank === 3) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} shrink-0 drop-shadow-[0_0_5px_rgba(251,146,60,0.45)]`}
        aria-label="Rang 3 Bronze"
      >
        <defs>
          <linearGradient id="bronzeCrestGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="55%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#7C2D12" />
          </linearGradient>
        </defs>
        <polygon
          points="12,2.5 14.9,8.4 21.4,9.3 16.7,13.9 17.8,20.4 12,17.3 6.2,20.4 7.3,13.9 2.6,9.3 9.1,8.4"
          fill="url(#bronzeCrestGrad)"
          stroke="#FFEDD5"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return null;
};

