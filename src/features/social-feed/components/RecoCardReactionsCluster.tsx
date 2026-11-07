import React from 'react';
import { Trophy, Flame, Heart, Repeat, Eye } from 'lucide-react';
import { formatCompactPlays } from '../../../components/player/playerEngineHelpers';
import type { SocialFeedPost } from '../types/social-feed.types';

export type ReactionClusterType = 'TROPHY' | 'FLAME' | 'HEART' | 'REDROP' | 'VIEWS';

export interface RecoCardReactionsClusterProps {
  post: SocialFeedPost;
  trackPlays?: number;
  onReact?: (reactionType: ReactionClusterType) => void;
  className?: string;
}

export const RecoCardReactionsCluster: React.FC<RecoCardReactionsClusterProps> = ({
  post,
  trackPlays = 100_500,
  onReact,
  className = '',
}) => {
  const likesCount = post.likedByUserIds.length;
  const reDropsCount = post.reDroppedByUserIds.length;
  const discoveriesCount = post.discoveriesCount || 0;
  const uniqueViewsCount = Math.max(trackPlays, (likesCount + reDropsCount + discoveriesCount) * 42 + 12_400);

  return (
    <div
      className={`inline-flex items-center gap-1.5 select-none ${className}`}
      role="group"
      aria-label="Réactions et portée de la recommandation"
    >
      <div className="flex items-center -space-x-1.5">
        <button
          type="button"
          onClick={() => onReact?.('TROPHY')}
          title="Validation Éclaireur Officiel & Points"
          className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#F97316] border border-white/60 shadow-md flex items-center justify-center text-[#080A0F] active:scale-95 transition-transform cursor-pointer"
        >
          <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white drop-shadow stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={() => onReact?.('FLAME')}
          title="Vélocité et tendance virale"
          className="relative z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0D1017] border border-white/40 shadow-md flex items-center justify-center text-amber-400 active:scale-95 transition-transform cursor-pointer"
        >
          <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ff4b2b] fill-[#ff4b2b] stroke-[1.8]" />
        </button>

        <button
          type="button"
          onClick={() => onReact?.('HEART')}
          title={`${likesCount} mentions J'aime`}
          className="relative z-30 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#DE1B34] to-[#ff2d55] border border-white/50 shadow-md flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
        >
          <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white stroke-[1.8]" />
        </button>

        <button
          type="button"
          onClick={() => onReact?.('REDROP')}
          title={`${reDropsCount} re-drops et relais`}
          className="relative z-40 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0D1017] border border-emerald-400/80 shadow-md flex items-center justify-center text-emerald-300 active:scale-95 transition-transform cursor-pointer"
        >
          <Repeat className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 stroke-[2.2]" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onReact?.('VIEWS')}
        className="px-2.5 py-0.5 sm:py-1 rounded-full bg-[#080A0F]/85 hover:bg-[#131722] backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1 active:scale-95 transition cursor-pointer"
        title={`${uniqueViewsCount.toLocaleString('fr-FR')} vues par comptes uniques (cliquer pour voir la portée)`}
      >
        <Eye className="w-3 h-3 text-[#A3A9BA] hidden xs:inline shrink-0" />
        <span className="font-mono text-[11px] sm:text-xs font-bold text-[#F8FAFC] tracking-tight tabular-nums">
          {formatCompactPlays(uniqueViewsCount)}
        </span>
      </button>
    </div>
  );
};
