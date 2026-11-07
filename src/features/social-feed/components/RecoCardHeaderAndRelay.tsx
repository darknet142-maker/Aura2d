import React, { useState } from 'react';
import { Repeat2, Compass, MoreHorizontal } from 'lucide-react';
import type { SocialFeedPost } from '../types/social-feed.types';
import { computeCohortTierFromEngagement } from '../services/social-points-ledger.service';

export interface RecoCardHeaderAndRelayProps {
  post: SocialFeedPost;
  onOpenAuthorProfile: (userId: string) => void;
  onOpenTargetSheet: () => void;
  onOpenArtistProfile: () => void;
}

export const RecoCardHeaderAndRelay: React.FC<RecoCardHeaderAndRelayProps> = ({
  post,
  onOpenAuthorProfile,
  onOpenTargetSheet,
  onOpenArtistProfile,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const cohort = computeCohortTierFromEngagement(
    post.reDroppedByUserIds.length,
    post.archetype === 'VIDEO_OPINION'
  );
  const latestRelay = post.reDropRelays[0];

  return (
    <div className="space-y-2">
      {/* Bandeau de propagation virale Re-Drop ou Slot Découverte Équitable */}
      {(latestRelay || post.isRandomDiscoverySlot) && (
        <div className="flex items-center justify-between gap-2 text-[11px]">
          {latestRelay ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium min-w-0">
              <Repeat2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Propulsé par <strong className="text-[#F8FAFC]">{latestRelay.userName}</strong>
                {post.reDroppedByUserIds.length > 1
                  ? ` et ${post.reDroppedByUserIds.length - 1} éclaireur${post.reDroppedByUserIds.length > 2 ? 's' : ''}`
                  : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-300 font-medium min-w-0">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Sélection Découverte Équitable (+241)</span>
            </div>
          )}
          {cohort.tier >= 2 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 tabular-nums shrink-0">
              Portée ×{cohort.reachMultiplier.toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* Auteur + @handle + horodatage + menu rapide */}
      <div className="flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onOpenAuthorProfile(post.authorId)}
          className="flex items-center gap-2.5 min-w-0 text-left group cursor-pointer"
        >
          <span className="w-9 h-9 rounded-full bg-[#131722] border border-white/15 group-hover:border-amber-400/60 text-xs font-bold text-[#F8FAFC] flex items-center justify-center shrink-0 transition-colors">
            {post.authorAvatar}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#F8FAFC] group-hover:text-amber-300 truncate leading-tight transition-colors">
              {post.authorName}
            </p>
            <p className="text-xs text-[#A3A9BA] truncate leading-tight">
              {post.authorHandle} • {post.createdAtLabel}
            </p>
          </div>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Options de la publication"
            className="w-8 h-8 rounded-full hover:bg-white/10 text-[#A3A9BA] hover:text-[#F8FAFC] flex items-center justify-center transition cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-30 w-44 rounded-xl bg-[#131722] border border-white/15 shadow-2xl py-1 text-xs">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenTargetSheet(); }}
                className="w-full px-3 py-2 text-left text-[#F8FAFC] hover:bg-white/10 cursor-pointer"
              >
                Ouvrir la fiche Studio
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenArtistProfile(); }}
                className="w-full px-3 py-2 text-left text-[#F8FAFC] hover:bg-white/10 cursor-pointer"
              >
                Profil de {post.target.entityName}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accroche éditoriale de l'utilisateur (résiliente break-ui 80+ car.) */}
      {latestRelay?.quote && (
        <p className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 break-words">
          « {latestRelay.quote} »
        </p>
      )}
      <p
        onClick={() => setExpanded((v) => !v)}
        className={`text-[13px] sm:text-sm text-[#F8FAFC] leading-snug break-words cursor-pointer ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        {post.caption}
      </p>
    </div>
  );
};
