import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Video, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { SocialFeedPost, StudioAudioCaptureMode } from '../types/social-feed.types';

export interface RecoCardActionBarProps {
  post: SocialFeedPost;
  currentUserId: string;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onToggleReDrop: (quote?: string) => void;
  onOpenStudioReaction: (mode: StudioAudioCaptureMode) => void;
  onSharePost: () => void;
}

export const RecoCardActionBar: React.FC<RecoCardActionBarProps> = ({
  post, currentUserId, onToggleLike, onOpenComments, onToggleReDrop, onOpenStudioReaction, onSharePost,
}) => {
  const [likeBurstKey, setLikeBurstKey] = useState(0);
  const [reDropMenuOpen, setReDropMenuOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState('');
  const [showQuoteInput, setShowQuoteInput] = useState(false);

  const isLiked = post.likedByUserIds.includes(currentUserId);
  const isReDropped = post.reDroppedByUserIds.includes(currentUserId);
  const isOwnPost = post.authorId === currentUserId;

  const handleLikeClick = () => {
    if (!isLiked && !isOwnPost) setLikeBurstKey((k) => k + 1);
    onToggleLike();
  };

  return (
    <div className="pt-2 space-y-2 border-t border-white/[0.07]">
      <div className="flex items-center justify-between gap-2 text-xs text-[#A3A9BA] tabular-nums">
        <div className="flex items-center gap-3 min-w-0 truncate">
          <span>{post.likedByUserIds.length} J&apos;aime</span>
          <button type="button" onClick={onOpenComments} className="hover:text-[#F8FAFC] transition cursor-pointer">
            {post.comments.length} commentaire{post.comments.length > 1 ? 's' : ''}
          </button>
          <span className="text-amber-300/90 font-mono text-[11px]">
            +{post.totalPointsGenerated.toFixed(2).replace('.', ',')} pt
          </span>
        </div>
        <span className="shrink-0">
          {post.reDroppedByUserIds.length} re-drop{post.reDroppedByUserIds.length > 1 ? 's' : ''}
        </span>
      </div>

      {showQuoteInput && (
        <div className="flex items-center gap-2">
          <input type="text" value={quoteDraft} onChange={(e) => setQuoteDraft(e.target.value)} placeholder="Ajouter un mot en republiant (+0,30 pt)..." className="flex-1 min-w-0 bg-[#080A0F] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#A3A9BA]/60 focus:outline-none focus:border-emerald-400" />
          <button type="button" onClick={() => { onToggleReDrop(quoteDraft); setQuoteDraft(''); setShowQuoteInput(false); }} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-[#080A0F] text-xs font-bold shrink-0 cursor-pointer">Publier</button>
        </div>
      )}

      <div className="relative flex items-center justify-between gap-1">
        <motion.button
          type="button" whileTap={{ scale: 0.94 }} transition={SPRING_SNAPPY} onClick={handleLikeClick}
          aria-label="Aimer cette recommandation (+0,25 point artiste)"
          className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition cursor-pointer ${
            isLiked ? 'text-[#DE1B34] bg-[#DE1B34]/12' : 'text-[#A3A9BA] hover:text-[#F8FAFC] hover:bg-white/[0.06]'
          }`}
        >
          <Heart className={`w-4 h-4 shrink-0 ${isLiked ? 'fill-[#DE1B34]' : ''}`} />
          <span className="hidden sm:inline">+0,25 pt</span>
          <AnimatePresence>
            {likeBurstKey > 0 && (
              <motion.span
                key={likeBurstKey}
                initial={{ opacity: 0, y: 2, scale: 0.92 }}
                animate={{ opacity: 1, y: -14, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                onAnimationComplete={() => setLikeBurstKey(0)}
                className="pointer-events-none absolute -top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-400 text-[#080A0F] text-[10px] font-mono font-bold shadow"
              >
                +0,25 pt
              </motion.span>
            )}
          </AnimatePresence>
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
              className="absolute bottom-11 left-1/2 -translate-x-1/2 z-30 w-48 rounded-2xl bg-[#131722] border border-white/15 shadow-2xl p-1.5 space-y-1"
            >
              <button type="button" onClick={() => { setReDropMenuOpen(false); onToggleReDrop(); }} className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-emerald-300 hover:bg-white/10 cursor-pointer">
                Re-Drop direct (+0,30 pt)
              </button>
              <button type="button" onClick={() => { setReDropMenuOpen(false); setShowQuoteInput(true); }} className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#F8FAFC] hover:bg-white/10 cursor-pointer">
                Citer &amp; Re-Drop (+0,30 pt)
              </button>
            </motion.div>
          )}
        </div>

        <motion.button
          type="button" whileTap={{ scale: 0.95 }} transition={SPRING_SNAPPY}
          onClick={() => onOpenStudioReaction('DROP_MUSIC_30S')}
          aria-label="Enregistrer une vidéo de réaction 30 secondes"
          className="inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-bold text-[#F8FAFC] bg-[#DE1B34]/15 hover:bg-[#DE1B34]/28 border border-[#DE1B34]/30 transition cursor-pointer"
        >
          <Video className="w-3.5 h-3.5 text-[#DE1B34] shrink-0" />
          <span>30s</span>
        </motion.button>

        <motion.button
          type="button" whileTap={{ scale: 0.95 }} transition={SPRING_SNAPPY} onClick={onSharePost}
          aria-label="Partager le lien"
          className="inline-flex items-center justify-center p-2 min-w-[40px] min-h-[40px] rounded-xl text-[#A3A9BA] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition cursor-pointer"
        >
          <Send className="w-4 h-4 shrink-0" />
        </motion.button>
      </div>
    </div>
  );
};
