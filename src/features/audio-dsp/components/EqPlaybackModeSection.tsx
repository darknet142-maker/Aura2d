import React from 'react';
import { Disc3, Infinity as InfinityIcon, Sparkles, Zap } from 'lucide-react';
import type { PlaybackChainingMode, PlaybackEnginePrefs } from '../types/audio-dsp.types';

export interface EqPlaybackModeSectionProps {
  playbackPrefs: PlaybackEnginePrefs;
  isDropMode: boolean;
  onChangePlaybackPrefs: (next: PlaybackEnginePrefs) => void;
  onToast: (msg: string) => void;
}

const CROSSFADE_OPTIONS: (0 | 2 | 4 | 6 | 8)[] = [0, 2, 4, 6, 8];
const CHAINING_MODES: { id: PlaybackChainingMode; label: string; sub: string }[] = [
  { id: 'CATALOGUE_NONSTOP', label: 'Catalogue Infini', sub: 'Inter-albums' },
  { id: 'ALBUM_ONLY', label: 'Album Actif', sub: 'Boucle projet' },
  { id: 'STOP_AT_END', label: 'Titre Unique', sub: 'Arrêt fin piste' },
];

export const EqPlaybackModeSection: React.FC<EqPlaybackModeSectionProps> = ({
  playbackPrefs,
  isDropMode,
  onChangePlaybackPrefs,
  onToast,
}) => {
  const isFullNonStop = playbackPrefs.defaultStartMode === 'FULL_NONSTOP';

  return (
    <div className="space-y-3">
      <div className="p-3.5 rounded-2xl bg-[#080A0F] border border-white/[0.09] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <InfinityIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-extrabold text-[#F8FAFC] truncate">Mode de Lecture par Défaut du Lecteur DROP</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-mono text-emerald-300 shrink-0">
            Session : {isDropMode ? 'Extrait Drop 30s' : 'Lecture Intégrale'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onChangePlaybackPrefs({ ...playbackPrefs, defaultStartMode: 'FULL_NONSTOP' });
              onToast('Mode Lecture Intégrale Non-Stop activé (Drop 30s désactivé)');
            }}
            className={`p-3 rounded-xl border text-left min-w-0 ${
              isFullNonStop ? 'bg-emerald-500/15 border-emerald-400/65 text-[#F8FAFC]' : 'bg-[#0D1017] border-white/[0.08] text-[#A3A9BA] hover:text-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-extrabold text-emerald-300 truncate">Intégrale Non-Stop (Drop OFF)</span>
              {isFullNonStop && <Zap className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
            </div>
            <p className="text-[10.5px] text-[#A3A9BA] mt-1 leading-snug">
              Désactive la boucle Drop 30s : chaque chanson démarre à 0:00 et s&apos;enchaîne en entier sans interruption.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangePlaybackPrefs({ ...playbackPrefs, defaultStartMode: 'DROP_30S' });
              onToast('Mode Découverte Drop (Extrait 30s) réactivé par défaut');
            }}
            className={`p-3 rounded-xl border text-left min-w-0 ${
              !isFullNonStop ? 'bg-amber-400/15 border-amber-400/65 text-[#F8FAFC]' : 'bg-[#0D1017] border-white/[0.08] text-[#A3A9BA] hover:text-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-extrabold text-amber-300 truncate">Découverte Drop (Extrait 30s)</span>
              {!isFullNonStop && <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
            </div>
            <p className="text-[10.5px] text-[#A3A9BA] mt-1 leading-snug">
              Zapping rapide sur le refrain/hotspot de 30s. Un appui sur Play lance le titre complet.
            </p>
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-[#080A0F] border border-white/[0.09] space-y-2.5">
        <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
          <Disc3 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="truncate">Enchaînement Continu Personnalisé &amp; Crossfade</span>
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {CHAINING_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangePlaybackPrefs({ ...playbackPrefs, chainingMode: mode.id })}
              className={`p-2 rounded-xl border text-center min-w-0 ${
                playbackPrefs.chainingMode === mode.id ? 'bg-amber-400/20 border-amber-400/60 text-amber-300' : 'bg-[#0D1017] border-white/[0.08] text-[#F8FAFC] hover:border-white/20'
              }`}
            >
              <span className="text-[11px] font-bold block truncate">{mode.label}</span>
              <span className="text-[9.5px] font-mono text-[#A3A9BA] block truncate">{mode.sub}</span>
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F8FAFC]">Fondu Enchaîné (Crossfade)</span>
            <span className="font-mono text-amber-300 font-bold">{playbackPrefs.crossfadeSec === 0 ? 'Gapless Pur (0s)' : `${playbackPrefs.crossfadeSec} secondes`}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {CROSSFADE_OPTIONS.map((sec) => (
              <button key={sec} type="button" onClick={() => onChangePlaybackPrefs({ ...playbackPrefs, crossfadeSec: sec })} className={`py-1.5 rounded-lg text-[10.5px] font-mono font-bold border ${playbackPrefs.crossfadeSec === sec ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-white/[0.04] border-white/10 text-[#A3A9BA] hover:text-[#F8FAFC]'}`}>
                {sec === 0 ? '0s Pur' : `${sec}s`}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <label className="flex items-center justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
              <span className="text-[11px] text-[#F8FAFC] font-medium truncate">Transition calée BPM</span>
              <input type="checkbox" checked={playbackPrefs.bpmSyncCrossfade} onChange={(e) => onChangePlaybackPrefs({ ...playbackPrefs, bpmSyncCrossfade: e.target.checked })} className="w-4 h-4 accent-emerald-400 shrink-0" />
            </label>
            <label className="flex items-center justify-between p-2 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
              <span className="text-[11px] text-[#F8FAFC] font-medium truncate">Coupe silence intro/fin</span>
              <input type="checkbox" checked={playbackPrefs.autoTrimSilence} onChange={(e) => onChangePlaybackPrefs({ ...playbackPrefs, autoTrimSilence: e.target.checked })} className="w-4 h-4 accent-amber-400 shrink-0" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
