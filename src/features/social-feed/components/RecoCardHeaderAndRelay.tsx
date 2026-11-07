import React, { useState } from 'react';
import { Repeat2, Compass, MoreHorizontal, Trash2 } from 'lucide-react';
import type { SocialFeedPost } from '../types/social-feed.types';

export interface RecoCardHeaderAndRelayProps {
  post: SocialFeedPost;
  isOwnPost?: boolean;
  onOpenAuthorProfile: (userId: string) => void;
  onOpenTargetSheet: () => void;
  onOpenArtistProfile: () => void;
  onDeletePost?: () => void;
}

export const RecoCardHeaderAndRelay: React.FC<RecoCardHeaderAndRelayProps> = ({
  post, isOwnPost = false, onOpenAuthorProfile, onOpenTargetSheet, onOpenArtistProfile, onDeletePost,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const latestRelay = post.reDropRelays[0];

  return (
    <div className="space-y-2">
      {(latestRelay || post.isRandomDiscoverySlot) && (
        <div className="flex items-center justify-between gap-2 text-[11px]">
          {latestRelay ? (
            <button
              type="button" onClick={() => onOpenAuthorProfile(latestRelay.userId)}
              className="flex items-center gap-1.5 text-emerald-400 hover:underline font-medium min-w-0 cursor-pointer"
            >
              <Repeat2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Republié par <strong className="text-[#F8FAFC]">{latestRelay.userName}</strong>
                {post.reDroppedByUserIds.length > 1 ? ` et ${post.reDroppedByUserIds.length - 1} éclaireur${post.reDroppedByUserIds.length > 2 ? 's' : ''}` : ''}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-300 font-medium min-w-0">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Sélection Découverte</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2.5">
        <button
          type="button" onClick={() => onOpenAuthorProfile(post.authorId)}
          aria-label={`Voir la fiche complète de ${post.authorName}`}
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
          <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Options de la publication" className="w-8 h-8 rounded-full hover:bg-white/10 text-[#A3A9BA] hover:text-[#F8FAFC] flex items-center justify-center transition cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-30 w-48 rounded-xl bg-[#131722] border border-white/15 shadow-2xl py-1 text-xs">
              <button type="button" onClick={() => { setMenuOpen(false); onOpenAuthorProfile(post.authorId); }} className="w-full px-3 py-2 text-left text-[#F8FAFC] hover:bg-white/10 cursor-pointer">
                Fiche de {post.authorName}
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onOpenTargetSheet(); }} className="w-full px-3 py-2 text-left text-[#F8FAFC] hover:bg-white/10 cursor-pointer">
                Détails du titre
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onOpenArtistProfile(); }} className="w-full px-3 py-2 text-left text-[#F8FAFC] hover:bg-white/10 cursor-pointer">
                Profil de {post.target.entityName}
              </button>
              {isOwnPost && onDeletePost && (
                <button type="button" onClick={() => { setMenuOpen(false); onDeletePost(); }} className="w-full px-3 py-2 text-left text-[#DE1B34] font-bold hover:bg-white/10 flex items-center gap-1.5 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5 shrink-0" /><span>Supprimer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {latestRelay?.quote && (
        <p className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 break-words">
          « {latestRelay.quote} »
        </p>
      )}
      <p onClick={() => setExpanded((v) => !v)} className={`text-[13px] sm:text-sm text-[#F8FAFC] leading-snug break-words cursor-pointer ${expanded ? '' : 'line-clamp-3'}`}>
        {post.caption}
      </p>
    </div>
  );
};
