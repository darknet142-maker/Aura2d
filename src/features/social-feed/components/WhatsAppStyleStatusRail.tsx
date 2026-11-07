import React from 'react';
import { Plus, Mic, Music2, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { GroupedUserStatusRing } from '../hooks/useStatusStoriesState';
import type { StudioAudioCaptureMode } from '../types/social-feed.types';

export interface WhatsAppStyleStatusRailProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  groupedRings: GroupedUserStatusRing[];
  onOpenViewerForUser: (userId: string) => void;
  onOpenStudioCapture: (mode: StudioAudioCaptureMode) => void;
}

const SegmentedRingSvg: React.FC<{ total: number; unseenCount: number }> = ({ total, unseenCount }) => {
  const r = 25;
  const c = 2 * Math.PI * r;
  const count = Math.max(1, Math.min(10, total));
  const gap = count === 1 ? 0 : 4.5;
  const segLen = Math.max(4, c / count - gap);

  return (
    <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => {
        const isUnseen = idx >= count - unseenCount;
        const offset = -(idx * (c / count));
        return (
          <circle key={idx} cx="28" cy="28" r={r} fill="none" stroke={isUnseen ? '#DE1B34' : '#334155'} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${segLen} ${c - segLen}`} strokeDashoffset={offset} />
        );
      })}
    </svg>
  );
};

export const WhatsAppStyleStatusRail: React.FC<WhatsAppStyleStatusRailProps> = ({
  currentUserId,
  currentUserAvatar,
  groupedRings,
  onOpenViewerForUser,
  onOpenStudioCapture,
}) => {
  const ownRing = groupedRings.find((g) => g.userId === currentUserId);
  const communityRings = groupedRings.filter((g) => g.userId !== currentUserId);

  return (
    <section
      aria-label="Statuts éphémères de la communauté"
      className="rounded-2xl bg-[#0D1017] border border-white/10 px-3.5 py-3 shadow-[0_12px_30px_-14px_rgba(6,8,14,0.9)]"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h3 className="text-xs font-bold text-[#F8FAFC] truncate">
          Statuts Communauté (4h)
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenStudioCapture('DROP_MUSIC_30S')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DE1B34]/15 hover:bg-[#DE1B34]/25 border border-[#DE1B34]/35 text-[11px] font-semibold text-[#F8FAFC] transition cursor-pointer"
          >
            <Video className="w-3 h-3 text-[#DE1B34] shrink-0" />
            <span>Vidéo musique</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenStudioCapture('VOICE_OPINION_NO_MUSIC')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#131722] hover:bg-white/10 border border-white/12 text-[11px] font-semibold text-[#F8FAFC] transition cursor-pointer"
          >
            <Mic className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Avis micro</span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 overflow-x-auto pb-1 no-scrollbar">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAPPY}
          onClick={() => (ownRing ? onOpenViewerForUser(currentUserId) : onOpenStudioCapture('VOICE_OPINION_NO_MUSIC'))}
          className="flex flex-col items-center gap-1.5 w-[64px] shrink-0 group cursor-pointer focus-visible:outline-none"
        >
          <div className="relative w-14 h-14 flex items-center justify-center">
            {ownRing ? (
              <SegmentedRingSvg total={ownRing.statuses.length} unseenCount={ownRing.statuses.length} />
            ) : (
              <span className="absolute inset-0.5 rounded-full border border-dashed border-white/25 group-hover:border-[#DE1B34]" />
            )}
            <span className="w-11 h-11 rounded-full bg-[#131722] text-[#F8FAFC] text-xs font-bold flex items-center justify-center border border-white/10">
              {currentUserAvatar || 'MO'}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#DE1B34] text-white flex items-center justify-center border-2 border-[#0D1017] shadow-md">
              <Plus className="w-3 h-3 stroke-[2.6]" />
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#F8FAFC] truncate w-full text-center">
            {ownRing ? `Mon statut (${ownRing.statuses.length})` : 'Mon statut'}
          </span>
        </motion.button>

        {communityRings.map((ring) => {
          const latest = ring.statuses[ring.statuses.length - 1];
          const unseenCount = ring.statuses.filter((s) => !s.seenByUserIds.includes(currentUserId)).length;
          const isVoiceOnly = latest.captureMode === 'VOICE_OPINION_NO_MUSIC';
          return (
            <motion.button
              key={ring.userId} type="button" whileTap={{ scale: 0.96 }} transition={SPRING_SNAPPY}
              onClick={() => onOpenViewerForUser(ring.userId)}
              className="flex flex-col items-center gap-1.5 w-[64px] shrink-0 group cursor-pointer focus-visible:outline-none"
            >
              <div className="relative w-14 h-14 flex items-center justify-center">
                <SegmentedRingSvg total={ring.statuses.length} unseenCount={unseenCount} />
                <span className="w-11 h-11 rounded-full bg-[#131722] text-[#F8FAFC] text-xs font-bold flex items-center justify-center border border-white/10 group-hover:border-amber-400/50 transition-colors">
                  {ring.userAvatar}
                </span>
                <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0D1017] ${isVoiceOnly ? 'bg-amber-400 text-[#080A0F]' : 'bg-emerald-500 text-[#080A0F]'}`}>
                  {isVoiceOnly ? <Mic className="w-2.5 h-2.5 stroke-[2.5]" /> : <Music2 className="w-2.5 h-2.5 stroke-[2.5]" />}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#A3A9BA] group-hover:text-[#F8FAFC] truncate w-full text-center transition-colors">
                {ring.userName}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
