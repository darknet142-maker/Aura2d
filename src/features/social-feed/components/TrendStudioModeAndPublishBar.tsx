import React, { useState } from 'react';
import { Mic, Music2, Check, Sparkles, Radio } from 'lucide-react';
import type { SocialTargetSubject, StudioAudioCaptureMode } from '../types/social-feed.types';
import { StudioSearchableTargetDropdown } from './StudioSearchableTargetDropdown';

export interface TrendStudioCaptureModeSelectorProps {
  captureMode: StudioAudioCaptureMode;
  onChangeCaptureMode: (mode: StudioAudioCaptureMode) => void;
  activeTarget: SocialTargetSubject;
  availableTargets?: SocialTargetSubject[];
  onChangeTarget?: (target: SocialTargetSubject) => void;
  isRecording: boolean;
  micLevel01: number;
}

export const TrendStudioCaptureModeSelector: React.FC<TrendStudioCaptureModeSelectorProps> = ({
  captureMode, onChangeCaptureMode, activeTarget, availableTargets = [], onChangeTarget, isRecording, micLevel01,
}) => {
  return (
    <div className="absolute top-14 inset-x-3 z-30 flex flex-col items-center gap-2 pointer-events-auto">
      {!isRecording ? (
        <>
          <div className="inline-flex items-center p-1 rounded-full bg-[#07090E]/82 backdrop-blur-xl border border-white/15 shadow-lg">
            <button
              type="button"
              onClick={() => onChangeCaptureMode('DROP_MUSIC_30S')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                captureMode === 'DROP_MUSIC_30S' ? 'bg-[#DE1B34] text-white' : 'text-[#A3A9BA] hover:text-white'
              }`}
            >
              <Music2 className="w-3 h-3 shrink-0" />
              <span>Avec musique</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeCaptureMode('VOICE_OPINION_NO_MUSIC')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                captureMode === 'VOICE_OPINION_NO_MUSIC' ? 'bg-amber-400 text-[#080A0F]' : 'text-[#A3A9BA] hover:text-white'
              }`}
            >
              <Mic className="w-3 h-3 shrink-0" />
              <span>Avis micro (sans musique)</span>
            </button>
          </div>

          {availableTargets.length > 1 && onChangeTarget ? (
            <StudioSearchableTargetDropdown
              selectedTarget={activeTarget}
              options={availableTargets}
              onSelectTarget={onChangeTarget}
              variant="studio-glass"
              ariaLabel="Choisir la chanson ou le projet pour la vidéo"
            />
          ) : (
            <span className="max-w-[90%] px-3 py-1 rounded-full bg-[#07090E]/75 border border-white/15 text-[11px] font-medium text-[#F8FAFC] truncate">
              {activeTarget.title}
            </span>
          )}
        </>
      ) : (
        captureMode === 'VOICE_OPINION_NO_MUSIC' && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#07090E]/80 backdrop-blur-md border border-amber-400/40">
            <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-amber-300">MICRO ACTIF</span>
            <div className="w-20 h-2 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-emerald-400 transition-all duration-75" style={{ width: `${Math.max(8, Math.round(micLevel01 * 100))}%` }} />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export interface TrendStudioInAppPublishPanelProps {
  activeTarget: SocialTargetSubject;
  captureMode: StudioAudioCaptureMode;
  durationSec: number;
  onPublishToDrop: (options: { caption: string; publishToStatus: boolean; publishToFeed: boolean }) => Promise<boolean | void> | boolean | void;
}

export const TrendStudioInAppPublishPanel: React.FC<TrendStudioInAppPublishPanelProps> = ({
  activeTarget, captureMode, onPublishToDrop,
}) => {
  const [caption, setCaption] = useState('');
  const [publishedKind, setPublishedKind] = useState<'NONE' | 'STATUS' | 'BOTH'>('NONE');

  const triggerPublish = async (toFeed: boolean) => {
    if (publishedKind !== 'NONE') return;
    const ok = await onPublishToDrop({ caption, publishToStatus: true, publishToFeed: toFeed });
    if (ok !== false) setPublishedKind(toFeed ? 'BOTH' : 'STATUS');
  };

  return (
    <div className="rounded-2xl bg-[#0D1017]/90 border border-white/20 p-2.5 space-y-2 shadow-lg">
      <input
        type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
        placeholder={captureMode === 'VOICE_OPINION_NO_MUSIC' ? `Votre avis sur ${activeTarget.title}...` : `Ajouter une légende à votre statut...`}
        className="w-full bg-[#07090E]/75 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#A3A9BA]/70 focus:outline-none focus:border-amber-400"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button" disabled={publishedKind !== 'NONE'} onClick={() => triggerPublish(false)}
          className="py-2 px-2.5 rounded-xl bg-[#DE1B34] hover:bg-[#f02842] disabled:opacity-60 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          {publishedKind === 'STATUS' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Radio className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{publishedKind === 'STATUS' ? 'Publié en statut' : 'Publier en statut'}</span>
        </button>
        <button
          type="button" disabled={publishedKind !== 'NONE'} onClick={() => triggerPublish(true)}
          className="py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-[#080A0F] text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          {publishedKind === 'BOTH' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Sparkles className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate">{publishedKind === 'BOTH' ? 'Publié partout' : 'Statut + Fil'}</span>
        </button>
      </div>
    </div>
  );
};
