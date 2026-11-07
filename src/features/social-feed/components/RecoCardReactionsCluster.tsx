import React from 'react';
import { formatCompactPlays } from '../../../components/player/playerEngineHelpers';
import type { SocialFeedPost } from '../types/social-feed.types';

export type ReactionClusterType = 'TROPHY' | 'FLAME' | 'HEART' | 'REDROP' | 'VIEWS';

export interface RecoCardReactionsClusterProps {
  post: SocialFeedPost;
  trackPlays?: number;
  onReact?: (reactionType: ReactionClusterType) => void;
  className?: string;
}

function formatReactionViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`;
  return formatCompactPlays(views);
}

export const RecoCardReactionsCluster: React.FC<RecoCardReactionsClusterProps> = ({
  post,
  trackPlays = 100_500,
  onReact,
  className = '',
}) => {
  const likesCount = post.likedByUserIds.length;
  const reDropsCount = post.reDroppedByUserIds.length;
  const uniqueViewsCount = Math.max(trackPlays, (likesCount + reDropsCount + 1) * 42 + 12_400);

  return (
    <div
      className={`inline-flex items-center gap-1.5 sm:gap-2 select-none ${className}`}
      role="group"
      aria-label="Réactions d'impact et portée communautaire"
    >
      <div className="flex items-center -space-x-1.5 sm:-space-x-2">
        {/* 1. Cadeau & Récompenses directes (Pêche / Corail) */}
        <button
          type="button"
          onClick={() => onReact?.('TROPHY')}
          title="Récompenses & Dons directs"
          className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#FF7A59] via-[#FF8E53] to-[#FFA876] ring-2 ring-[#0D1017] border border-white/50 shadow-[0_2px_8px_rgba(255,122,89,0.45)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" fill="none">
            <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" fill="#FFFFFF" />
            <rect x="3.5" y="6.5" width="17" height="4" rx="1.2" fill="#FFFFFF" />
            <rect x="10.5" y="6.5" width="3" height="13.5" fill="#FF7A59" />
            <path d="M12 6.5C10.2 4 7 3.8 6 5.2C5 6.6 7.5 6.5 12 6.5Z" fill="#FFFFFF" />
            <path d="M12 6.5C13.8 4 17 3.8 18 5.2C19 6.6 16.5 6.5 12 6.5Z" fill="#FFFFFF" />
          </svg>
        </button>

        {/* 2. Flamme Virale / Hype Incandescente */}
        <button
          type="button"
          onClick={() => onReact?.('FLAME')}
          title="Vélocité virale et engouement"
          className="relative z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#1E2330] to-[#0A0D15] ring-2 ring-[#0D1017] border border-orange-500/50 shadow-[0_2px_8px_rgba(249,115,22,0.35)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]" fill="none">
            <defs>
              <linearGradient id="dropFlameGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="45%" stopColor="#EA580C" />
                <stop offset="75%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FDE047" />
              </linearGradient>
            </defs>
            <path
              d="M12 2C10.2 4.8 7.5 7.4 7.5 11.8C7.5 15.2 9.8 18.5 12 20.5C14.2 18.5 16.5 15.2 16.5 11.8C16.5 7.8 13.2 4.8 12 2Z"
              fill="url(#dropFlameGrad)"
            />
            <path
              d="M12 11.5C11 13 10 14.5 10 16C10 17.5 11 19 12 19.5C13 19 14 17.5 14 16C14 14.5 13 13 12 11.5Z"
              fill="#FEF08A"
            />
          </svg>
        </button>

        {/* 3. Cœur Cosmique / Cristal Facetté */}
        <button
          type="button"
          onClick={() => onReact?.('HEART')}
          title={`${likesCount} mentions J'aime et coups de cœur`}
          className="relative z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#5B21B6] via-[#7C3AED] to-[#A855F7] ring-2 ring-[#0D1017] border border-[#C4B5FD]/40 shadow-[0_2px_8px_rgba(168,85,247,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(216,180,254,0.7)]" fill="none">
            <defs>
              <linearGradient id="dropHeartGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="50%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
            <path
              d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
              fill="url(#dropHeartGrad)"
            />
            <path d="M12 6L8.5 9.5L12 17.5L15.5 9.5L12 6Z" fill="#FFFFFF" fillOpacity="0.32" />
          </svg>
        </button>

        {/* 4. Canette Booster / Énergie Émeraude */}
        <button
          type="button"
          onClick={() => onReact?.('REDROP')}
          title={`${reDropsCount} re-drops et relais viraux`}
          className="relative z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0A121A] ring-2 ring-[#0D1017] border border-emerald-400/80 shadow-[0_2px_8px_rgba(16,185,129,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]" fill="none">
            <rect x="7" y="5" width="10" height="14.5" rx="3" fill="#064E3B" stroke="#34D399" strokeWidth="1.2" />
            <rect x="9.5" y="3" width="5" height="2" rx="0.5" fill="#34D399" />
            <path d="M12.5 8L10 12.5H13.5L11.5 16.5" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="8" r="0.8" fill="#A7F3D0" />
            <circle cx="8" cy="16" r="0.8" fill="#A7F3D0" />
          </svg>
        </button>
      </div>

      {/* 5. Pilule de Portée & Vues Uniques (Verre Lavande / Nébuleuse) */}
      <button
        type="button"
        onClick={() => onReact?.('VIEWS')}
        className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#181028]/85 hover:bg-[#25183d] backdrop-blur-md border border-[#C084FC]/50 shadow-[0_2px_10px_rgba(168,85,247,0.22)] flex items-center gap-1 active:scale-95 transition cursor-pointer"
        title={`${uniqueViewsCount.toLocaleString('fr-FR')} vues par comptes uniques (cliquer pour voir la portée)`}
      >
        <span className="font-sans text-[11px] sm:text-xs font-extrabold text-[#E9D5FF] tracking-tight tabular-nums">
          {formatReactionViews(uniqueViewsCount)}
        </span>
      </button>
    </div>
  );
};
