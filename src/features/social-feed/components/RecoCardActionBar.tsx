import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Video, Play, Pause, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { SocialFeedPost, StudioAudioCaptureMode } from '../types/social-feed.types';

export interface RecoCardActionBarProps {
  post: SocialFeedPost;
  currentUserId: string;
  isPrimaryPlaying?: boolean;
  onPlayPrimary: () => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onToggleReDrop: (quote?: string) => void;
  onOpenStudioReaction: (mode: StudioAudioCaptureMode) => void;
}

export const RecoCardActionBar: React.FC<RecoCardActionBarProps> = ({
  post, currentUserId, isPrimaryPlaying = false, onPlayPrimary,
  onToggleLike, onOpenComments, onToggleReDrop, onOpenStudioReaction,
}) => {
  const [reDropMenuOpen, setReDropMenuOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState('');
  const [showQuoteInput, setShowQuoteInput] = useState(false);

  const isLiked = post.likedByUserIds.includes(currentUserId);
  const isReDropped = post.reDroppedByUserIds.includes(currentUserId);

  return (
    <div className="pt-2 space-y-2 border-t border-white/[0.07]">
      <div className="flex items-center justify-between gap-2 text-xs text-[#A3A9BA] tabular-nums">
        <div className="flex items-center gap-3 min-w-0 truncate">
          <span>{post.likedByUserIds.length} J&apos;aime</span>
          <button type="button" onClick={onOpenComments} className="hover:text-[#F8FAFC] transition cursor-pointer">
            {post.comments.length} commentaire{post.comments.length > 1 ? 's' : ''}
          </button>
        </div>
        <span className="shrink-0">
          {post.reDroppedByUserIds.length} re-drop{post.reDroppedByUserIds.length > 1 ? 's' : ''}
        </span>
      </div>

      {showQuoteInput && (
        <div className="flex items-center gap-2">
          <input
            type="text" value={quoteDraft} onChange={(e) => setQuoteDraft(e.target.value)}
            placeholder="Ajouter un mot en republiant..."
            className="flex-1 min-w-0 bg-[#080A0F] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#A3A9BA]/60 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => { onToggleReDrop(quoteDraft); setQuoteDraft(''); setShowQuoteInput(false); }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-[#080A0F] text-xs font-bold shrink-0 cursor-pointer"
          >
            Republier
          </button>
        </div>
      )}

      <div className="relative flex items-center justify-between gap-1">
        <motion.button
          type="button" whileTap={{ scale: 0.93 }} transition={SPRING_SNAPPY} onClick={onToggleLike}
          aria-label="Aimer cette recommandation"
          className={`inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition cursor-pointer ${
            isLiked ? 'text-[#DE1B34] bg-[#DE1B34]/12' : 'text-[#A3A9BA] hover:text-[#F8FAFC] hover:bg-white/[0.06]'
          }`}
        >
          <Heart className={`w-4 h-4 shrink-0 ${isLiked ? 'fill-[#DE1B34]' : ''}`} />
          <span className="hidden sm:inline">J&apos;aime</span>
        </motion.button>

        <motion.button
          type="button" whileTap={{ scale: 0.95 }} transition={SPRING_SNAPPY} onClick={onOpenComments}
          aria-label="Commenter"
          className="inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold text-[#A3A9BA] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Commenter</span>
        </motion.button>

        <div className="relative">
          <motion.button
            type="button" whileTap={{ scale: 0.95 }} transition={SPRING_SNAPPY}
            onClick={() => (isReDropped ? onToggleReDrop() : setReDropMenuOpen((v) => !v))}
            aria-label="Republier (Re-Drop)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition cursor-pointer ${
              isReDropped ? 'text-emerald-400 bg-emerald-500/12' : 'text-[#A3A9BA] hover:text-emerald-300 hover:bg-white/[0.06]'
            }`}
          >
            {isReDropped ? <Check className="w-4 h-4 shrink-0" /> : <Repeat2 className="w-4 h-4 shrink-0" />}
            <span>Re-Drop</span>
          </motion.button>
          {reDropMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={SPRING_SNAPPY}
              className="absolute bottom-11 left-1/2 -translate-x-1/2 z-30 w-44 rounded-2xl bg-[#131722] border border-white/15 shadow-2xl p-1.5 space-y-1"
            >
              <button type="button" onClick={() => { setReDropMenuOpen(false); onToggleReDrop(); }} className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-emerald-300 hover:bg-white/10 cursor-pointer">
                Re-Drop direct
              </button>
              <button type="button" onClick={() => { setReDropMenuOpen(false); setShowQuoteInput(true); }} className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#F8FAFC] hover:bg-white/10 cursor-pointer">
                Citer &amp; Re-Drop
              </button>
            </motion.div>
          )}
        </div>

        <motion.button
          type="button" whileTap={{ scale: 0.95 }} transition={SPRING_SNAPPY}
          onClick={() => onOpenStudioReaction('DROP_MUSIC_30S')}
          aria-label="Enregistrer une vidéo de 30 secondes"
          className="inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-bold text-[#F8FAFC] bg-[#131722] hover:bg-white/10 border border-white/12 transition cursor-pointer"
        >
          <Video className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>30s</span>
        </motion.button>

        {/* Bouton de Lecture (remplace l'ancien bouton Copier le lien) */}
        <motion.button
          type="button" whileTap={{ scale: 0.94 }} transition={SPRING_SNAPPY} onClick={onPlayPrimary}
          aria-label={isPrimaryPlaying ? 'Mettre en pause' : 'Écouter cette recommandation'}
          className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-[#DE1B34] hover:bg-[#f02842] text-white text-xs font-extrabold shadow-[0_6px_18px_rgba(222,27,52,0.38)] transition cursor-pointer shrink-0"
        >
          {isPrimaryPlaying ? <Pause className="w-3.5 h-3.5 fill-current shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current shrink-0" />}
          <span>{isPrimaryPlaying ? 'Pause' : 'Écouter'}</span>
        </motion.button>
      </div>
    </div>
  );
};
