import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { EQ_PRESETS, EQ_BANDS_META } from '../types';
import { DropOfficialLogo } from '../../CoverArtwork';

export interface EqualizerModalProps {
  isOpen: boolean;
  isPro: boolean;
  eqGains: number[];
  masterVolume: number;
  onClose: () => void;
  onResetEq: () => void;
  onApplyEqPreset: (gains: number[]) => void;
  onChangeEqBand: (bandIdx: number, gainDb: number) => void;
  onChangeMasterVolume: (val: number) => void;
  onToast: (msg: string) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  isPro,
  eqGains,
  masterVolume,
  onClose,
  onResetEq,
  onApplyEqPreset,
  onChangeEqBand,
  onChangeMasterVolume,
  onToast,
}) => {
  const [selectedBandIdx, setSelectedBandIdx] = useState<number>(0);

  const activePresetId = useMemo(() => {
    const match = EQ_PRESETS.find((p) =>
      p.gains.every((g, i) => Math.abs(g - (eqGains[i] ?? 0)) < 0.25)
    );
    return match ? match.id : null;
  }, [eqGains]);

  const eqCurvePoints = useMemo(() => {
    return eqGains
      .map((gain, i) => {
        const cx = 24 + i * 58;
        const cy = 44 - (gain / 12) * 32;
        return `${cx},${cy}`;
      })
      .join(' ');
  }, [eqGains]);

  const stepSelectedBandGain = (step: number) => {
    const current = eqGains[selectedBandIdx] ?? 0;
    const clamped = Math.min(12, Math.max(-12, current + step));
    onChangeEqBand(selectedBandIdx, Math.round(clamped * 2) / 2);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeMasterVolume(parseFloat(e.target.value));
  };

  if (!isOpen || !isPro) return null;

  const activeBand = EQ_BANDS_META[selectedBandIdx] || EQ_BANDS_META[0];
  const activeGain = eqGains[selectedBandIdx] ?? 0;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-[#07090E]/80 backdrop-blur-md flex flex-col justify-end p-3.5 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl max-h-[90dvh] overflow-y-auto animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <DropOfficialLogo className="h-4 w-auto max-w-[80px]" />
              <h2 className="text-base font-bold text-white">
                Égaliseur &amp; Audio
              </h2>
            </div>
            <p className="text-[11px] text-zinc-400">
              Traitement fréquentiel temps réel au demi-décibel (0.5 dB)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetEq();
                onToast('Égaliseur remis à plat (0 dB)');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-amber-300 transition"
            >
              Plat (0 dB)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition active:scale-95"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-emerald-300 block">
              Normalisation Automatique -14,0 LUFS Active
            </span>
            <span className="text-[10px] text-zinc-300 block truncate">
              Volume uniforme garanti sur toutes les chansons
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-mono text-[10px] font-bold shrink-0">
            -14.0 LUFS Constant
          </span>
        </div>

        {/* Préréglages */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 block">
            Préréglages Audio
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {EQ_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onApplyEqPreset(preset.gains);
                    onToast(`Préréglage : ${preset.name}`);
                  }}
                  className={`px-1.5 py-2 rounded-xl border text-center transition ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 font-medium'
                  }`}
                >
                  <span className="text-[10.5px] sm:text-xs block leading-tight truncate">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Courbe graphique + boutons fréquences */}
        <div className="p-3.5 rounded-2xl bg-[#07090E]/55 border border-white/10 space-y-3">
          <div className="relative h-20 w-full">
            <svg viewBox="0 0 280 88" className="w-full h-full overflow-visible">
              <line
                x1="12"
                y1="44"
                x2="268"
                y2="44"
                stroke="rgba(255,255,255,0.14)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={eqCurvePoints}
              />
              {eqGains.map((gain, i) => {
                const cx = 24 + i * 58;
                const cy = 44 - (gain / 12) * 32;
                const isBandActive = selectedBandIdx === i;
                return (
                  <g
                    key={EQ_BANDS_META[i].freq}
                    onClick={() => setSelectedBandIdx(i)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isBandActive ? 8 : 5.5}
                      fill={isBandActive ? '#fbbf24' : '#18181b'}
                      stroke="#ffffff"
                      strokeWidth={isBandActive ? 2.5 : 1.8}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {EQ_BANDS_META.map((band, idx) => {
              const gain = eqGains[idx] ?? 0;
              const isSelected = selectedBandIdx === idx;
              return (
                <button
                  key={band.freq}
                  type="button"
                  onClick={() => setSelectedBandIdx(idx)}
                  className={`min-h-[54px] py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-[0_0_16px_rgba(251,191,36,0.4)]'
                      : 'bg-white/[0.06] text-white border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[11px] font-bold">{band.freq}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? 'text-black/85 font-extrabold' : 'text-amber-300'
                    }`}
                  >
                    {gain > 0 ? `+${gain}` : gain}dB
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Bande active :{' '}
                <span className="text-amber-400">
                  {activeBand.freq} ({activeBand.label})
                </span>
              </span>
              <span className="font-mono text-sm font-extrabold text-amber-400">
                {activeGain > 0 ? `+${activeGain}` : activeGain} dB
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => stepSelectedBandGain(-0.5)}
                className="min-w-[64px] min-h-[46px] px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white font-mono text-xs font-bold flex items-center justify-center transition"
              >
                -0.5 dB
              </button>

              <input
                type="range"
                min={-12}
                max={12}
                step={0.5}
                value={activeGain}
                onChange={(e) =>
                  onChangeEqBand(selectedBandIdx, parseFloat(e.target.value))
                }
                className="flex-1 fat-slider cursor-pointer"
                aria-label={`Gain ${activeBand.freq}`}
              />

              <button
                type="button"
                onClick={() => stepSelectedBandGain(0.5)}
                className="min-w-[64px] min-h-[46px] px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 active:scale-95 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold flex items-center justify-center transition"
              >
                +0.5 dB
              </button>
            </div>
          </div>
        </div>

        {/* Volume Master */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-200 font-semibold">Volume Master Temps Réel</span>
            <span className="font-mono text-amber-400 font-bold">
              {Math.round(masterVolume)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={masterVolume}
            onChange={handleVolumeChange}
            className="w-full fat-slider cursor-pointer"
            aria-label="Volume Master"
          />
        </div>
      </div>
    </div>
  );
};
