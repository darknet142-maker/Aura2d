import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';
import type { SocialFeedPost } from '../types/social-feed.types';

export interface RecoCommentsDrawerProps {
  post: SocialFeedPost | null;
  onClose: () => void;
  onSubmitComment: (postId: string, body: string) => void;
  onOpenUserProfile: (userId: string) => void;
}

export const RecoCommentsDrawer: React.FC<RecoCommentsDrawerProps> = ({
  post, onClose, onSubmitComment, onOpenUserProfile,
}) => {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!post) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [post, onClose]);

  if (!post) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    onSubmitComment(post.id, draft);
    setDraft('');
    window.setTimeout(() => setSubmitting(false), 180);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[135] bg-[#07090E]/82 backdrop-blur-lg flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Commentaires de la recommandation"
        initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[82dvh] rounded-t-3xl sm:rounded-3xl bg-[#0D1017] border border-white/15 flex flex-col overflow-hidden shadow-[0_24px_70px_rgba(6,8,14,0.95)]"
      >
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#F8FAFC] truncate">
              Commentaires ({post.comments.length})
            </h3>
            <p className="text-[11px] text-[#A3A9BA] truncate">
              Discussion autour de « {post.target.title} »
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-white/10 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {post.comments.length === 0 ? (
            <p className="text-xs text-[#A3A9BA] text-center py-8">
              Aucun commentaire pour le moment. Partagez votre ressenti sur « {post.target.title} » !
            </p>
          ) : (
            post.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#131722] border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenUserProfile(c.authorId); }}
                  className="w-8 h-8 rounded-full bg-[#080A0F] border border-white/15 hover:border-amber-400 text-[11px] font-bold text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {c.authorAvatar}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => { onClose(); onOpenUserProfile(c.authorId); }}
                      className="text-xs font-bold text-[#F8FAFC] hover:text-amber-300 truncate text-left cursor-pointer"
                    >
                      {c.authorName}
                    </button>
                    <span className="text-[10px] font-mono text-[#A3A9BA] shrink-0">
                      {c.createdAtLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#F8FAFC]/90 mt-0.5 break-words">{c.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="p-3.5 border-t border-white/10 bg-[#080A0F] flex items-center gap-2 shrink-0">
          <input
            ref={inputRef} type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder={`Écrire un commentaire sur ${post.target.title}...`}
            className="flex-1 min-w-0 bg-[#131722] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#A3A9BA]/60 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit" disabled={!draft.trim() || submitting}
            aria-label="Envoyer le commentaire"
            className="px-3.5 py-2.5 rounded-xl bg-[#DE1B34] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
