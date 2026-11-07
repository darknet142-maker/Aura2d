import React, { useState, useMemo } from 'react';
import { X, Disc3, Image as ImageIcon, Video, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_DRAWER } from '../../../shared/ui/springMotion';
import type { PostArchetype, SocialTargetKind, SocialTargetSubject, StudioAudioCaptureMode } from '../types/social-feed.types';
import { StudioSearchableTargetDropdown } from './StudioSearchableTargetDropdown';
import type { TargetAudioLookupItem } from '../hooks/useTargetDropAudioPreview';

export interface ComposerSelectableOption { key: string; target: SocialTargetSubject; }

export interface PublishRecoAndStatusModalProps {
  isOpen: boolean; defaultTrackTarget: SocialTargetSubject;
  trackOptions: ComposerSelectableOption[]; albumOptions: ComposerSelectableOption[]; artistOptions: ComposerSelectableOption[];
  activeCount?: number; maxCount?: number; onClose: () => void;
  onPublishCard: (archetype: PostArchetype, target: SocialTargetSubject, caption: string) => boolean | void;
  onOpenCameraStudio: (mode: StudioAudioCaptureMode, target: SocialTargetSubject) => void;
  catalogueLookup?: TargetAudioLookupItem[];
}

export const PublishRecoAndStatusModal: React.FC<PublishRecoAndStatusModalProps> = ({
  isOpen, defaultTrackTarget, trackOptions, albumOptions, artistOptions,
  activeCount = 0, maxCount = 10, onClose, onPublishCard, onOpenCameraStudio,
  catalogueLookup,
}) => {
  const [targetKind, setTargetKind] = useState<SocialTargetKind>('TRACK');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [cardType, setCardType] = useState<'TRACK_VINYL' | 'SPOTLIGHT_VISUAL'>('TRACK_VINYL');
  const [caption, setCaption] = useState<string>('');

  const optionsList = useMemo(() => {
    if (targetKind === 'ALBUM') return albumOptions;
    if (targetKind === 'ARTIST') return artistOptions;
    return trackOptions;
  }, [targetKind, trackOptions, albumOptions, artistOptions]);

  const activeTarget = useMemo(() => {
    const found = optionsList.find((o) => o.key === selectedKey);
    return found?.target || optionsList[0]?.target || defaultTrackTarget;
  }, [optionsList, selectedKey, defaultTrackTarget]);

  const targetSubjects = useMemo(() => optionsList.map((o) => o.target), [optionsList]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[135] bg-[#07090E]/85 backdrop-blur-lg flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Publier une recommandation ou un statut vidéo"
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING_DRAWER}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D1017] border border-white/15 p-4 sm:p-5 space-y-3.5 shadow-[0_24px_70px_rgba(6,8,14,0.95)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] truncate">
              Nouvelle recommandation
            </h3>
            <p className="text-[11px] text-[#A3A9BA] truncate">
              Publications actives sur votre profil : {activeCount} / {maxCount}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-white/10 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#080A0F] border border-white/10">
            {([
              { id: 'TRACK', label: 'Chanson' },
              { id: 'ALBUM', label: 'Projet / EP' },
              { id: 'ARTIST', label: 'Artiste' },
            ] as const).map((tab) => (
              <button
                key={tab.id} type="button"
                onClick={() => { setTargetKind(tab.id); setSelectedKey(''); if (tab.id !== 'TRACK') setCardType('SPOTLIGHT_VISUAL'); }}
                className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  targetKind === tab.id ? 'bg-amber-400 text-[#080A0F]' : 'text-[#A3A9BA] hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <StudioSearchableTargetDropdown
            selectedTarget={activeTarget}
            options={targetSubjects}
            onSelectTarget={(chosen) => {
              const match = optionsList.find((o) => o.target.title === chosen.title && o.target.entityName === chosen.entityName);
              setSelectedKey(match?.key || '');
            }}
            variant="modal-surface"
            catalogueLookup={catalogueLookup}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button" onClick={() => setCardType('TRACK_VINYL')}
            className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              cardType === 'TRACK_VINYL' ? 'bg-[#131722] border-[#DE1B34] text-[#F8FAFC]' : 'bg-[#080A0F] border-white/10 text-[#A3A9BA]'
            }`}
          >
            <Disc3 className="w-4 h-4 text-[#DE1B34] shrink-0" />
            <span className="truncate">Carte Vinyle</span>
          </button>
          <button
            type="button" onClick={() => setCardType('SPOTLIGHT_VISUAL')}
            className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              cardType === 'SPOTLIGHT_VISUAL' ? 'bg-[#131722] border-emerald-400 text-[#F8FAFC]' : 'bg-[#080A0F] border-white/10 text-[#A3A9BA]'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Carte Visuelle</span>
          </button>
        </div>

        <textarea
          rows={2} value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder={`Pourquoi recommander « ${activeTarget.title} » ?`}
          className="w-full bg-[#131722] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#A3A9BA]/60 focus:outline-none focus:border-amber-400 resize-none"
        />

        <button
          type="button"
          onClick={() => {
            const ok = onPublishCard(cardType, activeTarget, caption);
            if (ok !== false) { setCaption(''); onClose(); }
          }}
          className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#080A0F] text-xs font-extrabold transition cursor-pointer"
        >
          Publier la recommandation
        </button>

        <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { onClose(); onOpenCameraStudio('DROP_MUSIC_30S', activeTarget); }} className="py-2.5 px-3 rounded-2xl bg-[#DE1B34] hover:bg-[#f02842] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
            <Video className="w-3.5 h-3.5 shrink-0" /><span>Vidéo sur musique</span>
          </button>
          <button type="button" onClick={() => { onClose(); onOpenCameraStudio('VOICE_OPINION_NO_MUSIC', activeTarget); }} className="py-2.5 px-3 rounded-2xl bg-[#131722] hover:bg-white/10 border border-white/15 text-[#F8FAFC] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
            <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span>Vidéo avis micro</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
