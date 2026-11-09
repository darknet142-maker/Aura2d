import React from 'react';
import type { SocialFeedPost } from '../types/social-feed.types';

export type ReactionClusterType = 'TROPHY' | 'FLAME' | 'HEART' | 'REDROP' | 'VIEWS';

export interface RecoCardReactionsClusterProps {
  post?: SocialFeedPost;
  trackPlays?: number;
  likesCount?: number;
  reDropsCount?: number;
  uniqueViewsCount?: number;
  hasLiked?: boolean;
  onReact?: (kind: ReactionClusterType) => void;
  className?: string;
}

const formatReactionViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('fr-FR');
};

export const RecoCardReactionsCluster: React.FC<RecoCardReactionsClusterProps> = ({
  post,
  trackPlays = 0,
  likesCount: directLikesCount,
  reDropsCount: directReDropsCount,
  uniqueViewsCount: directUniqueViewsCount,
  hasLiked: directHasLiked,
  onReact,
  className = '',
}) => {
  const likesCount = post ? post.likedByUserIds.length : (directLikesCount ?? 0);
  const reDropsCount = post ? post.reDroppedByUserIds.length : (directReDropsCount ?? 0);
  const uniqueViewsCount = post
    ? Math.max(trackPlays, (likesCount + reDropsCount + 1) * 42 + 12_400)
    : (directUniqueViewsCount ?? 1420);
  const hasLiked = post ? post.likedByUserIds.includes('me') : (directHasLiked ?? false);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`relative flex items-center gap-1 sm:gap-1.5 pointer-events-auto ${className}`}
      aria-label="Réactions et signaux d'engagement de la recommandation"
    >
      <div className="flex items-center -space-x-1.5 sm:-space-x-2">
        {/* 1. Trophée & Récompenses directes */}
        <button
          type="button"
          onClick={() => onReact?.('TROPHY')}
          title="Récompenses & Dons directs"
          className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#131722] hover:bg-[#1A2030] ring-2 ring-[#080A0F] border border-white/15 flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none">
            <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" fill="#FFFFFF" />
            <rect x="3.5" y="6.5" width="17" height="4" rx="1.2" fill="#FFFFFF" />
            <rect x="10.5" y="6.5" width="3" height="13.5" fill="#F59E0B" />
            <path d="M12 6.5C10.2 4 7 3.8 6 5.2C5 6.6 7.5 6.5 12 6.5Z" fill="#FFFFFF" />
            <path d="M12 6.5C13.8 4 17 3.8 18 5.2C19 6.6 16.5 6.5 12 6.5Z" fill="#FFFFFF" />
          </svg>
        </button>

        {/* 2. Flamme Virale / Hype */}
        <button
          type="button"
          onClick={() => onReact?.('FLAME')}
          title="Vélocité virale et engouement"
          className="relative z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#131722] hover:bg-[#1A2030] ring-2 ring-[#080A0F] border border-white/15 flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none">
            <path
              d="M12 2C10.2 4.8 7.5 7.4 7.5 11.8C7.5 15.2 9.8 18.5 12 20.5C14.2 18.5 16.5 15.2 16.5 11.8C16.5 7.8 13.2 4.8 12 2Z"
              fill="#F59E0B"
            />
            <path
              d="M12 11.5C11 13 10 14.5 10 16C10 17.5 11 19 12 19.5C13 19 14 17.5 14 16C14 14.5 13 13 12 11.5Z"
              fill="#FEF08A"
            />
          </svg>
        </button>

        {/* 3. Cœur Rubis DROP */}
        <button
          type="button"
          onClick={() => onReact?.('HEART')}
          title={`${likesCount} mentions J'aime`}
          className="relative z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#131722] hover:bg-[#1A2030] ring-2 ring-[#080A0F] border border-white/15 flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none">
            <path
              d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
              fill={hasLiked ? '#DE1B34' : '#F43F5E'}
            />
          </svg>
        </button>

        {/* 4. Canette Booster / Énergie Émeraude */}
        <button
          type="button"
          onClick={() => onReact?.('REDROP')}
          title={`${reDropsCount} re-drops et relais viraux`}
          className="relative z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#131722] hover:bg-[#1A2030] ring-2 ring-[#080A0F] border border-white/15 flex items-center justify-center active:scale-95 transition cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none">
            <rect x="7" y="5" width="10" height="14.5" rx="3" fill="#064E3B" stroke="#34D399" strokeWidth="1.2" />
            <rect x="9.5" y="3" width="5" height="2" rx="0.5" fill="#34D399" />
            <path d="M12.5 8L10 12.5H13.5L11.5 16.5" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="8" r="0.8" fill="#A7F3D0" />
            <circle cx="8" cy="16" r="0.8" fill="#A7F3D0" />
          </svg>
        </button>
      </div>

      {/* 5. Vues Uniques */}
      <button
        type="button"
        onClick={() => onReact?.('VIEWS')}
        className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#0D1017] hover:bg-[#131722] border border-white/10 flex items-center gap-1 active:scale-95 transition cursor-pointer"
        title={`${uniqueViewsCount.toLocaleString('fr-FR')} vues uniques`}
      >
        <span className="font-mono text-[11px] sm:text-xs font-bold text-[#F8FAFC] tracking-tight tabular-nums">
          {formatReactionViews(uniqueViewsCount)}
        </span>
      </button>
    </div>
  );
};
