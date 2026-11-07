import React from 'react';
import { Headphones, Power, Radio } from 'lucide-react';
import { SPATIAL_AUDIO_PRESETS } from '../services/mastering-presets.service';
import type { SpatialAudioConfig, SpatialPresetSpec } from '../types/audio-dsp.types';

export interface EqSpatializerSectionProps {
  spatialConfig: SpatialAudioConfig;
  onChangeSpatialConfig: (next: SpatialAudioConfig) => void;
  onToast: (msg: string) => void;
}

export const EqSpatializerSection: React.FC<EqSpatializerSectionProps> = ({
  spatialConfig,
  onChangeSpatialConfig,
  onToast,
}) => {
  const applyPreset = (preset: SpatialPresetSpec) => {
    onChangeSpatialConfig({
      enabled: true,
      presetId: preset.id,
      stereoWidthPct: preset.stereoWidthPct,
      roomAmbiencePct: preset.roomAmbiencePct,
    });
    onToast(`Spatialisation appliquée : ${preset.name}`);
  };

  const widthLabel =
    spatialConfig.stereoWidthPct === 0
      ? '(Mono Pur)'
      : spatialConfig.stereoWidthPct === 100
        ? '(Natif)'
        : spatialConfig.stereoWidthPct > 100
          ? '(Élargi 3D)'
          : '(Resserré)';

  return (
    <div className="space-y-3">
      <div className="p-3.5 rounded-2xl bg-[#080A0F] border border-white/[0.09] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[#F8FAFC] truncate">
                Matrice Stéréo Mid/Side &amp; Acoustique Studio
              </div>
              <div className="text-[10px] font-mono text-[#A3A9BA] truncate">
                Ancre Sub &lt; 180 Hz 100% Mono • Décorrélation Haas &amp; Réflexions 3.4 kHz
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChangeSpatialConfig({ ...spatialConfig, enabled: !spatialConfig.enabled })}
            className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-mono font-bold flex items-center gap-1 shrink-0 ${
              spatialConfig.enabled
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-white/[0.05] border-white/10 text-[#A3A9BA]'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{spatialConfig.enabled ? '3D ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F8FAFC]">Largeur Scène Stéréo (Mid/Side)</span>
            <span className="font-mono font-bold text-amber-300">
              {spatialConfig.stereoWidthPct}% <span className="text-[10px] text-[#A3A9BA]">{widthLabel}</span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={180}
            step={2}
            value={spatialConfig.stereoWidthPct}
            onChange={(e) =>
              onChangeSpatialConfig({ ...spatialConfig, enabled: true, presetId: 'custom', stereoWidthPct: Number(e.target.value) })
            }
            className="w-full fat-slider cursor-pointer"
            aria-label="Largeur Stéréo Mid/Side"
          />
          <div className="flex justify-between text-[9px] font-mono text-[#A3A9BA]">
            <span>0% Mono</span>
            <span>100% Stéréo Native</span>
            <span>180% Panoramique Binaural</span>
          </div>
        </div>

        <div className="space-y-1 pt-1 border-t border-white/[0.07]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F8FAFC]">Profondeur &amp; Réflexions Acoustiques</span>
            <span className="font-mono font-bold text-emerald-300">{spatialConfig.roomAmbiencePct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={2}
            value={spatialConfig.roomAmbiencePct}
            onChange={(e) =>
              onChangeSpatialConfig({ ...spatialConfig, enabled: true, presetId: 'custom', roomAmbiencePct: Number(e.target.value) })
            }
            className="w-full fat-slider cursor-pointer"
            aria-label="Profondeur Acoustique Studio"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-[#A3A9BA] flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-amber-300" />
          <span>Préréglages de Spatialisation ({SPATIAL_AUDIO_PRESETS.length} scènes)</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {SPATIAL_AUDIO_PRESETS.map((preset) => {
            const active = spatialConfig.enabled && spatialConfig.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-2.5 rounded-xl border text-left min-w-0 ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-400/60 text-[#F8FAFC]'
                    : 'bg-[#080A0F] border-white/[0.08] text-[#F8FAFC] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate">{preset.name}</span>
                  <span className="text-[9.5px] font-mono text-emerald-300 shrink-0">
                    {preset.stereoWidthPct}% • Salle {preset.roomAmbiencePct}%
                  </span>
                </div>
                <p className="text-[10px] text-[#A3A9BA] truncate mt-0.5">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
