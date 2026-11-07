import React from 'react';
import { Trophy, Flame, Heart, Repeat, Eye } from 'lucide-react';
import { formatCompactPlays } from '../../../components/player/playerEngineHelpers';
import type { SocialFeedPost } from '../types/social-feed.types';

export interface RecoCardReactionsClusterProps {
  post: SocialFeedPost;
  trackPlays?: number;
  onReact?: (reactionType: 'TROPHY' | 'FLAME' | 'HEART' | 'REDROP') => void;
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
      {/* Bulles circulaires superposées fidèles à la capture officielle */}
      <div className="flex items-center -space-x-1.5">
        {/* 1. Trophée Éclaireur Or / Récompense */}
        <button
          type="button"
          onClick={() => onReact?.('TROPHY')}
          title="Validation Éclaireur Officiel"
          className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#F97316] border border-white/60 shadow-md flex items-center justify-center text-[#080A0F] active:scale-95 transition-transform cursor-pointer"
        >
          <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white drop-shadow stroke-[2.2]" />
        </button>

        {/* 2. Flamme Hype / Tendance */}
        <button
          type="button"
          onClick={() => onReact?.('FLAME')}
          title="Titre en tendance virale"
          className="relative z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0D1017] border border-white/40 shadow-md flex items-center justify-center text-amber-400 active:scale-95 transition-transform cursor-pointer"
        >
          <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ff4b2b] fill-[#ff4b2b] stroke-[1.8]" />
        </button>

        {/* 3. Cœur / Coup de cœur mélomane */}
        <button
          type="button"
          onClick={() => onReact?.('HEART')}
          title={`${likesCount} mentions J'aime`}
          className="relative z-30 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#DE1B34] to-[#ff2d55] border border-white/50 shadow-md flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
        >
          <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white stroke-[1.8]" />
        </button>

        {/* 4. Boucle / Relais Re-Drop Vert Émeraude */}
        <button
          type="button"
          onClick={() => onReact?.('REDROP')}
          title={`${reDropsCount} re-drops et relais`}
          className="relative z-40 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0D1017] border border-emerald-400/80 shadow-md flex items-center justify-center text-emerald-300 active:scale-95 transition-transform cursor-pointer"
        >
          <Repeat className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 stroke-[2.2]" />
        </button>
      </div>

      {/* 5. Pilule oblongue : Nombre de vues et portée unique (ex: 100.5k) */}
      <div
        className="px-2.5 py-0.5 sm:py-1 rounded-full bg-[#080A0F]/85 backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1"
        title={`${uniqueViewsCount.toLocaleString('fr-FR')} vues par comptes uniques`}
      >
        <Eye className="w-3 h-3 text-[#A3A9BA] hidden xs:inline shrink-0" />
        <span className="font-mono text-[11px] sm:text-xs font-bold text-[#F8FAFC] tracking-tight tabular-nums">
          {formatCompactPlays(uniqueViewsCount)}
        </span>
      </div>
    </div>
  );
};

