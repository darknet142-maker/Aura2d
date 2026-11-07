import React, { useState, useEffect, useCallback } from 'react';
import { X, Heart, Repeat2, Download, Video, Mic, Music2, ChevronLeft, ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';
import type { GroupedUserStatusRing } from '../hooks/useStatusStoriesState';
import type { SocialTargetSubject, StudioAudioCaptureMode } from '../types/social-feed.types';
import { loadSocialVideoBlob } from '../services/status-video-storage.service';
import { formatRemaining4hLabel } from './ProfileQuotaCleanupModal';

export interface StatusFullscreenViewerModalProps {
  activeUserId: string | null; currentUserId: string; groupedRings: GroupedUserStatusRing[];
  onClose: () => void; onSelectUser: (userId: string) => void; onMarkSeen: (statusId: string) => void;
  onToggleLike: (statusId: string) => void; onToggleReDrop: (statusId: string) => void;
  onDeleteStatus?: (statusId: string) => void; onOpenUserProfile: (userId: string) => void;
  onOpenTarget: (target: SocialTargetSubject) => void;
  onReplyWithVideo: (mode: StudioAudioCaptureMode, target: SocialTargetSubject) => void;
}

export const StatusFullscreenViewerModal: React.FC<StatusFullscreenViewerModalProps> = ({
  activeUserId, currentUserId, groupedRings, onClose, onSelectUser,
  onMarkSeen, onToggleLike, onToggleReDrop, onDeleteStatus, onOpenUserProfile, onOpenTarget, onReplyWithVideo,
}) => {
  const userIdx = groupedRings.findIndex((g) => g.userId === activeUserId);
  const currentGroup = userIdx >= 0 ? groupedRings[userIdx] : null;
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const activeStory = currentGroup?.statuses[Math.min(storyIdx, (currentGroup?.statuses.length || 1) - 1)] ?? null;

  useEffect(() => { setStoryIdx(0); setProgress(0); }, [activeUserId]);
  useEffect(() => {
    if (!activeStory) return;
    onMarkSeen(activeStory.id);
    setProgress(0);
    let revoked: string | null = null;
    if (activeStory.videoIdbKey) {
      loadSocialVideoBlob(activeStory.videoIdbKey).then((b) => { if (b) { revoked = URL.createObjectURL(b); setVideoUrl(revoked); } else setVideoUrl(null); });
    } else setVideoUrl(null);
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, [activeStory, onMarkSeen]);

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIdx + 1 < currentGroup.statuses.length) setStoryIdx((i) => i + 1);
    else if (userIdx + 1 < groupedRings.length) onSelectUser(groupedRings[userIdx + 1].userId);
    else onClose();
  }, [currentGroup, storyIdx, userIdx, groupedRings, onSelectUser, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (userIdx > 0) onSelectUser(groupedRings[userIdx - 1].userId);
  }, [storyIdx, userIdx, groupedRings, onSelectUser]);

  useEffect(() => {
    if (!activeStory || isPaused) return;
    const stepPct = 100 / ((Math.max(5, activeStory.durationSec || 15) * 1000) / 80);
    const timer = window.setInterval(() => setProgress((p) => (p + stepPct >= 100 ? (goNext(), 0) : p + stepPct)), 80);
    return () => window.clearInterval(timer);
  }, [activeStory, isPaused, goNext]);

  useEffect(() => {
    if (!activeStory) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') goNext(); if (e.key === 'ArrowLeft') goPrev(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStory, onClose, goNext, goPrev]);

  if (!currentGroup || !activeStory) return null;
  const isLiked = activeStory.likedByUserIds.includes(currentUserId);
  const isReDropped = activeStory.reDroppedByUserIds.includes(currentUserId);
  const isVoiceOnly = activeStory.captureMode === 'VOICE_OPINION_NO_MUSIC';
  const isOwnStory = activeStory.userId === currentUserId;

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `DROP_Statut_${activeStory.target.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.webm`;
    a.click();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Statut de ${currentGroup.userName}`} className="fixed inset-0 z-[140] bg-[#07090E]/95 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={SPRING_DRAWER} onPointerDown={() => setIsPaused(true)} onPointerUp={() => setIsPaused(false)} className="relative h-full max-h-[100dvh] sm:max-h-[92dvh] aspect-[9/16] w-auto max-w-full bg-[#0D1017] sm:rounded-[28px] border border-white/15 overflow-hidden flex flex-col justify-between shadow-[0_24px_70px_rgba(6,8,14,0.95)]">
        {videoUrl ? <video src={videoUrl} autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover" /> : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#131722] via-[#0D1017] to-[#07090E]">
            <div className="w-44 h-44 rounded-3xl overflow-hidden border border-white/15 shadow-2xl mb-5"><CoverArtwork artworkType={activeStory.target.artworkType} coverUrl={activeStory.target.cover} title={activeStory.target.title} artist={activeStory.target.entityName} /></div>
            <p className="text-sm sm:text-base font-bold text-[#F8FAFC] text-center max-w-xs leading-snug break-words px-2">« {activeStory.caption} »</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090E]/80 via-transparent to-[#07090E]/92 pointer-events-none" />
        <div className="relative z-20 p-3.5 space-y-2.5" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {currentGroup.statuses.map((st, idx) => (
              <div key={st.id} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-[#F8FAFC] transition-all duration-75" style={{ width: idx < storyIdx ? '100%' : idx === storyIdx ? `${progress}%` : '0%' }} /></div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => { onClose(); onOpenUserProfile(currentGroup.userId); }} className="flex items-center gap-2.5 min-w-0 text-left group cursor-pointer">
              <span className="w-9 h-9 rounded-full bg-[#131722] border border-white/20 group-hover:border-amber-400 text-xs font-bold text-[#F8FAFC] flex items-center justify-center shrink-0">{currentGroup.userAvatar}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-amber-300 truncate">{currentGroup.userName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#A3A9BA] truncate">{isVoiceOnly ? <Mic className="w-2.5 h-2.5 text-amber-400" /> : <Music2 className="w-2.5 h-2.5 text-emerald-400" />}{formatRemaining4hLabel(activeStory.expiresAtIso)}</span>
              </div>
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              {isOwnStory && onDeleteStatus && <button type="button" onClick={() => onDeleteStatus(activeStory.id)} aria-label="Supprimer ce statut" className="w-9 h-9 rounded-full bg-[#DE1B34]/25 hover:bg-[#DE1B34] border border-[#DE1B34]/50 text-white flex items-center justify-center cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
              <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-full bg-[#07090E]/70 border border-white/15 text-[#F8FAFC] flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex-1 flex items-center justify-between px-2">
          <button type="button" onClick={goPrev} aria-label="Précédent" className="w-10 h-24 flex items-center justify-start text-white/60 hover:text-white cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
          <button type="button" onClick={goNext} aria-label="Suivant" className="w-10 h-24 flex items-center justify-end text-white/60 hover:text-white cursor-pointer"><ChevronRight className="w-6 h-6" /></button>
        </div>
        <div className="relative z-20 p-3.5 space-y-2.5" onPointerDown={(e) => e.stopPropagation()}>
          {videoUrl && <p className="text-xs text-[#F8FAFC] line-clamp-2 break-words">{activeStory.caption}</p>}
          <button type="button" onClick={() => { onClose(); onOpenTarget(activeStory.target); }} className="w-full p-2.5 rounded-2xl bg-[#131722]/90 border border-white/15 flex items-center justify-between gap-2.5 text-left hover:border-amber-400/50 transition cursor-pointer">
            <div className="min-w-0"><p className="text-xs font-bold text-[#F8FAFC] truncate">{activeStory.target.title}</p><p className="text-[11px] text-[#A3A9BA] truncate">{activeStory.target.subtitle}</p></div>
            <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
          </button>
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => onToggleLike(activeStory.id)} className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${isLiked ? 'bg-[#DE1B34] border-[#DE1B34] text-white' : 'bg-[#131722] border-white/15 text-[#F8FAFC]'}`}><Heart className={`w-3.5 h-3.5 shrink-0 ${isLiked ? 'fill-current' : ''}`} /><span className="tabular-nums">{activeStory.likedByUserIds.length} J&apos;aime</span></button>
            <button type="button" onClick={() => onToggleReDrop(activeStory.id)} className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${isReDropped ? 'bg-emerald-500 border-emerald-400 text-[#080A0F]' : 'bg-[#131722] border-white/15 text-[#F8FAFC]'}`}><Repeat2 className="w-3.5 h-3.5 shrink-0" /><span className="tabular-nums">{activeStory.reDroppedByUserIds.length}</span></button>
            <button type="button" onClick={() => { onClose(); onReplyWithVideo('VOICE_OPINION_NO_MUSIC', activeStory.target); }} aria-label="Répondre en vidéo 30s" className="p-2.5 rounded-xl bg-[#DE1B34]/20 border border-[#DE1B34]/40 text-[#F8FAFC] cursor-pointer"><Video className="w-4 h-4 text-[#DE1B34]" /></button>
            {videoUrl && <button type="button" onClick={handleDownload} aria-label="Télécharger hors plateforme" className="p-2.5 rounded-xl bg-[#131722] border border-white/15 text-emerald-400 cursor-pointer"><Download className="w-4 h-4" /></button>}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
