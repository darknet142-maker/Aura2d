import React from 'react';
import { X, Trash2, Clock, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';
import type { SocialFeedPost, UserStatusStory } from '../types/social-feed.types';

export interface ProfileQuotaCleanupModalProps {
  isOpen: boolean;
  maxItems: number;
  ownStatuses: UserStatusStory[];
  ownPosts: SocialFeedPost[];
  onDeleteStatus: (statusId: string) => void;
  onDeletePost: (postId: string) => void;
  onClose: () => void;
}

export function formatRemaining4hLabel(expiresAtIso: string, nowMs = Date.now()): string {
  const diffMs = Math.max(0, Date.parse(expiresAtIso) - nowMs);
  const totalMins = Math.ceil(diffMs / 60_000);
  if (totalMins <= 0) return 'Expiré';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m restantes` : `${m} min restantes`;
}

export const ProfileQuotaCleanupModal: React.FC<ProfileQuotaCleanupModalProps> = ({
  isOpen, maxItems, ownStatuses, ownPosts, onDeleteStatus, onDeletePost, onClose,
}) => {
  if (!isOpen) return null;
  const totalActive = ownStatuses.length + ownPosts.length;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[240] bg-[#07090E]/88 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Gérer vos statuts et recommandations actifs"
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[84dvh] rounded-t-3xl sm:rounded-3xl bg-[#0D1017] border border-white/15 flex flex-col overflow-hidden shadow-[0_24px_70px_rgba(6,8,14,0.95)]"
      >
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#F8FAFC] truncate">
              Emplacements actifs ({totalActive} / {maxItems})
            </h3>
            <p className="text-[11px] text-[#A3A9BA] truncate">
              Maximum {maxItems} simultanément. Supprimez un statut pour libérer une place.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-white/10 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-2.5">
          {ownStatuses.map((st) => (
            <div key={st.id} className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-[#131722] border border-amber-400/25">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0">
                  <CoverArtwork artworkType={st.target.artworkType} coverUrl={st.target.cover} title={st.target.title} artist={st.target.entityName} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9.5px] font-bold shrink-0">Statut 4h</span>
                    <span className="text-xs font-bold text-[#F8FAFC] truncate">{st.target.title}</span>
                  </div>
                  <p className="text-[10.5px] text-[#A3A9BA] inline-flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{formatRemaining4hLabel(st.expiresAtIso)}</span>
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => onDeleteStatus(st.id)} className="px-2.5 py-1.5 rounded-xl bg-[#DE1B34]/20 hover:bg-[#DE1B34] text-[#F8FAFC] text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer">
                <Trash2 className="w-3.5 h-3.5 shrink-0" /><span>Supprimer</span>
              </button>
            </div>
          ))}

          {ownPosts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-[#131722] border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0">
                  <CoverArtwork artworkType={p.target.artworkType} coverUrl={p.target.cover} title={p.target.title} artist={p.target.entityName} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9.5px] font-bold shrink-0 inline-flex items-center gap-0.5">
                      <Compass className="w-2.5 h-2.5" />Recommandation
                    </span>
                    <span className="text-xs font-bold text-[#F8FAFC] truncate">{p.target.title}</span>
                  </div>
                  <p className="text-[10.5px] text-[#A3A9BA] truncate">{p.caption}</p>
                </div>
              </div>
              <button type="button" onClick={() => onDeletePost(p.id)} className="px-2.5 py-1.5 rounded-xl bg-[#DE1B34]/20 hover:bg-[#DE1B34] text-[#F8FAFC] text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer">
                <Trash2 className="w-3.5 h-3.5 shrink-0" /><span>Supprimer</span>
              </button>
            </div>
          ))}

          {totalActive === 0 && (
            <p className="text-xs text-[#A3A9BA] text-center py-6">Aucune publication active.</p>
          )}
        </div>

        <div className="p-3 border-t border-white/10 bg-[#080A0F] shrink-0">
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-amber-400 text-[#080A0F] text-xs font-extrabold cursor-pointer">
            {totalActive < maxItems ? `Continuer (${maxItems - totalActive} place${maxItems - totalActive > 1 ? 's' : ''} libre${maxItems - totalActive > 1 ? 's' : ''})` : 'Fermer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

