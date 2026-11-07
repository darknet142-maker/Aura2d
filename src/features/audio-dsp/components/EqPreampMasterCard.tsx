import React from 'react';
import { Sliders, Volume2 } from 'lucide-react';
import { PRECISION_EQ_PRESETS } from '../services/mastering-presets.service';
import type { PrecisionEqPreset } from '../types/audio-dsp.types';

export interface EqPreampMasterCardProps {
  eqGains: number[];
  eqBypassed: boolean;
  preampDb: number;
  effectivePreampDb: number;
  autoHeadroom: boolean;
  phaseInvert: boolean;
  masterVolume: number;
  onChangePreampDb: (db: number) => void;
  onToggleAutoHeadroom: () => void;
  onTogglePhaseInvert: () => void;
  onApplyPrecisionPreset: (preset: PrecisionEqPreset) => void;
  onChangeMasterVolume: (val: number) => void;
  onToast: (msg: string) => void;
}

export const EqPreampMasterCard: React.FC<EqPreampMasterCardProps> = ({
  eqGains,
  eqBypassed,
  preampDb,
  effectivePreampDb,
  autoHeadroom,
  phaseInvert,
  masterVolume,
  onChangePreampDb,
  onToggleAutoHeadroom,
  onTogglePhaseInvert,
  onApplyPrecisionPreset,
  onChangeMasterVolume,
  onToast,
}) => {
  const activePresetId =
    PRECISION_EQ_PRESETS.find((p) =>
      p.gains.every((g, i) => Math.abs(g - (eqGains[i] ?? 0)) < 0.15)
    )?.id ?? null;

  return (
    <div className="space-y-2.5">
      {/* 1. Pré-Ampli Mastering (10^(dB/20)) + Auto-Headroom Anti-Clip + Polarité Ø 180° */}
      <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/[0.09] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5 min-w-0">
            <Sliders className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Pré-Ampli Mastering (0.1 dB)</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleAutoHeadroom}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                autoHeadroom
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-white/[0.04] border-white/10 text-[#A3A9BA]'
              }`}
            >
              Auto-Headroom {autoHeadroom ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={onTogglePhaseInvert}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                phaseInvert
                  ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                  : 'bg-white/[0.04] border-white/10 text-[#A3A9BA]'
              }`}
              aria-label="Inverser la polarité de 180 degrés"
            >
              Ø 180°
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={-12}
            max={12}
            step={0.1}
            value={preampDb}
            onChange={(e) => onChangePreampDb(parseFloat(e.target.value))}
            className="flex-1 fat-slider cursor-pointer"
            aria-label="Pré-amplificateur d'entrée en dB"
          />
          <span className="font-mono text-[11px] font-bold text-amber-300 shrink-0">
            {preampDb > 0 ? `+${preampDb.toFixed(1)}` : preampDb.toFixed(1)} dB{' '}
            <span className="text-[#A3A9BA]">
              (Eff. {effectivePreampDb > 0 ? `+${effectivePreampDb.toFixed(1)}` : effectivePreampDb.toFixed(1)})
            </span>
          </span>
        </div>
      </div>

      {/* 2. Préréglages Mastering Millimétrés (Gains + Facteurs Q + Preamp + Scène) */}
      <div className="space-y-1.5">
        <span className="text-[10.5px] font-semibold text-[#A3A9BA] block">
          Préréglages Mastering Calibrés ({PRECISION_EQ_PRESETS.length} profils Gains + Q + Preamp)
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {PRECISION_EQ_PRESETS.map((preset) => {
            const active = activePresetId === preset.id && !eqBypassed;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onApplyPrecisionPreset(preset);
                  onToast(`Profil Mastering : ${preset.name}`);
                }}
                className={`px-2 py-2 rounded-xl border text-center min-w-0 ${
                  active
                    ? 'bg-amber-400/20 border-amber-400/75 text-amber-300 font-bold'
                    : 'bg-[#080A0F] border-white/[0.08] text-[#F8FAFC] hover:border-white/20 font-medium'
                }`}
              >
                <span className="text-[10.5px] block truncate">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Volume Master Temps Réel */}
      <div className="p-2.5 rounded-2xl bg-[#080A0F] border border-white/[0.09] flex items-center gap-2.5">
        <Volume2 className="w-4 h-4 text-amber-300 shrink-0" />
        <span className="text-xs font-semibold text-[#F8FAFC] shrink-0">Master</span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={masterVolume}
          onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
          className="flex-1 fat-slider cursor-pointer"
          aria-label="Volume Master"
        />
        <span className="font-mono text-xs font-bold text-amber-300 w-10 text-right shrink-0">
          {Math.round(masterVolume)}%
        </span>
      </div>
    </div>
  );
};

