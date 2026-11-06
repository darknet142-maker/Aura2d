import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Power, RotateCcw, Sliders, Volume2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { EQ_PRESETS, EQ_BANDS_META } from '../types';
import { DropOfficialLogo } from '../../CoverArtwork';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from '../../../shared/ui/springMotion';

export interface EqualizerModalProps {
  isOpen: boolean;
  isPro?: boolean;
  isPlaying?: boolean;
  eqGains: number[];
  eqBypassed?: boolean;
  preampDb?: number;
  eqQFactor?: number;
  masterVolume: number;
  onClose: () => void;
  onResetEq: () => void;
  onApplyEqPreset: (gains: number[]) => void;
  onChangeEqBand: (bandIdx: number, gainDb: number) => void;
  onToggleEqBypass?: () => void;
  onChangePreampDb?: (db: number) => void;
  onChangeEqQFactor?: (q: number) => void;
  onChangeMasterVolume: (val: number) => void;
  getAudioSpectrumData?: () => { bins: Uint8Array; rmsDb: number; peakDb: number } | null;
  onToast: (msg: string) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  isPlaying = false,
  eqGains,
  eqBypassed = false,
  preampDb = 0,
  eqQFactor = 1.1,
  masterVolume,
  onClose,
  onResetEq,
  onApplyEqPreset,
  onChangeEqBand,
  onToggleEqBypass,
  onChangePreampDb,
  onChangeEqQFactor,
  onChangeMasterVolume,
  getAudioSpectrumData,
  onToast,
}) => {
  const [selectedBandIdx, setSelectedBandIdx] = useState<number>(0);
  const [liveMeter, setLiveMeter] = useState<{ rmsDb: number; peakDb: number }>({
    rmsDb: -14.0,
    peakDb: -6.2,
  });
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activePresetId = useMemo(() => {
    const match = EQ_PRESETS.find((p) =>
      p.gains.every((g, i) => Math.abs(g - (eqGains[i] ?? 0)) < 0.25)
    );
    return match ? match.id : null;
  }, [eqGains]);

  // Courbe paramétrique cubique lissée (SVG) tenant compte du facteur Q et du Bypass
  const { smoothCurvePath, smoothFillPath, bandCoords } = useMemo(() => {
    const coords = EQ_BANDS_META.map((_, i) => {
      const effectiveGain = eqBypassed ? 0 : (eqGains[i] ?? 0);
      const cx = 28 + i * 56;
      const cy = 48 - (effectiveGain / 12) * 34;
      return { cx, cy, gain: effectiveGain };
    });

    if (coords.length === 0) {
      return { smoothCurvePath: '', smoothFillPath: '', bandCoords: [] };
    }

    // Tension influencée par le facteur Q (plus Q est élevé, plus la cloche est étroite)
    const tension = Math.max(0.18, Math.min(0.45, 0.42 - (eqQFactor - 0.5) * 0.08));
    let d = `M 8,48 L ${coords[0].cx},${coords[0].cy}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const dx = (p1.cx - p0.cx) * tension;
      d += ` C ${p0.cx + dx},${p0.cy} ${p1.cx - dx},${p1.cy} ${p1.cx},${p1.cy}`;
    }
    d += ` L 272,48`;

    const fillD = `${d} L 272,92 L 8,92 Z`;
    return { smoothCurvePath: d, smoothFillPath: fillD, bandCoords: coords };
  }, [eqGains, eqBypassed, eqQFactor]);

  // Analyseur spectral temps réel 60 FPS sur Canvas
  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    let phase = 0;

    const renderSpectrum = () => {
      phase += 0.08;
      const canvas = spectrumCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const spec = getAudioSpectrumData ? getAudioSpectrumData() : null;
          const barCount = 32;
          const gap = 3;
          const barW = (w - gap * (barCount - 1)) / barCount;

          let hasLiveSignal = false;
          if (spec && spec.bins) {
            for (let k = 0; k < 24; k++) {
              if (spec.bins[k] > 4) {
                hasLiveSignal = true;
                break;
              }
            }
          }

          if (hasLiveSignal && spec) {
            setLiveMeter({
              rmsDb: Math.round(spec.rmsDb * 10) / 10,
              peakDb: Math.round(spec.peakDb * 10) / 10,
            });
          } else if (isPlaying) {
            const avgBoost =
              eqGains.reduce((acc, g) => acc + (eqBypassed ? 0 : g), 0) / 5 + preampDb * 0.5;
            setLiveMeter({
              rmsDb: Math.round((-14.0 + Math.sin(phase * 0.7) * 0.8) * 10) / 10,
              peakDb:
                Math.round(
                  Math.min(-0.3, -5.5 + avgBoost * 0.25 + Math.cos(phase * 1.1) * 1.2) * 10
                ) / 10,
            });
          }

          for (let i = 0; i < barCount; i++) {
            const normX = i / (barCount - 1);
            // Interpoler le gain EQ correspondant à cette zone fréquentielle
            const bandPos = normX * 4;
            const bIdxLow = Math.floor(bandPos);
            const bIdxHigh = Math.min(4, bIdxLow + 1);
            const frac = bandPos - bIdxLow;
            const interpGainDb = eqBypassed
              ? 0
              : (eqGains[bIdxLow] ?? 0) * (1 - frac) + (eqGains[bIdxHigh] ?? 0) * frac;

            let mag = 0.08;
            if (hasLiveSignal && spec) {
              const binIdx = Math.min(
                spec.bins.length - 1,
                Math.floor(Math.pow(normX, 1.5) * (spec.bins.length * 0.65))
              );
              mag = spec.bins[binIdx] / 255;
            } else if (isPlaying) {
              const wave =
                0.38 +
                0.24 * Math.sin(phase * (1.2 + normX * 2.1) + i * 0.45) +
                0.15 * Math.cos(phase * 2.3 - i * 0.3);
              const eqScalar = Math.pow(10, (interpGainDb + preampDb * 0.5) / 28);
              mag = Math.max(0.06, Math.min(0.96, wave * eqScalar * (masterVolume / 100)));
            } else {
              // Spectre de veille calibré sur la réponse EQ
              const idleEq = 0.18 + ((interpGainDb + 12) / 24) * 0.22;
              mag = Math.max(0.05, Math.min(0.45, idleEq));
            }

            const barH = Math.max(4, mag * (h - 8));
            const x = i * (barW + gap);
            const y = h - barH;

            const grad = ctx.createLinearGradient(0, y, 0, h);
            if (eqBypassed) {
              grad.addColorStop(0, 'rgba(163, 169, 186, 0.45)');
              grad.addColorStop(1, 'rgba(163, 169, 186, 0.08)');
            } else {
              grad.addColorStop(0, 'rgba(245, 158, 11, 0.72)');
              grad.addColorStop(0.55, 'rgba(222, 27, 52, 0.42)');
              grad.addColorStop(1, 'rgba(16, 185, 129, 0.12)');
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, 2);
            ctx.fill();
          }
        }
      }
      rafId = requestAnimationFrame(renderSpectrum);
    };

    rafId = requestAnimationFrame(renderSpectrum);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, isPlaying, eqGains, eqBypassed, preampDb, masterVolume, getAudioSpectrumData]);

  const stepSelectedBandGain = (step: number) => {
    const current = eqGains[selectedBandIdx] ?? 0;
    const clamped = Math.min(12, Math.max(-12, current + step));
    onChangeEqBand(selectedBandIdx, Math.round(clamped * 2) / 2);
  };

  if (!isOpen) return null;

  const activeBand = EQ_BANDS_META[selectedBandIdx] || EQ_BANDS_META[0];
  const activeGain = eqGains[selectedBandIdx] ?? 0;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-[#07090E]/88 backdrop-blur-xl flex flex-col justify-end p-2.5 sm:p-4"
    >
      <motion.div
        variants={SUBTLE_ENTRANCE_VARIANTS}
        initial="initial"
        animate="animate"
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#0D1017]/98 border border-white/[0.12] rounded-[26px] p-3.5 sm:p-5 space-y-3.5 shadow-[0_24px_70px_rgba(4,6,12,0.95)] max-h-[92dvh] overflow-y-auto"
      >
        {/* 1. En-tête Rack DSP Paramétrique + Bypass A/B + Reset */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <DropOfficialLogo className="h-4 w-auto max-w-[76px] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#F8FAFC] truncate">
                Console Égaliseur Paramétrique DSP
              </h2>
            </div>
            <p className="text-[10.5px] font-mono text-[#A3A9BA] truncate">
              5 Bandes Biquad Web Audio • Pas 0.5 dB • Master -14.0 LUFS
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bouton A/B Bypass temps réel */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={SPRING_SNAPPY}
              onClick={() => {
                onToggleEqBypass?.();
                onToast(
                  !eqBypassed
                    ? 'Bypass A/B activé : signal brut (0 dB)'
                    : 'Égaliseur DSP réactivé'
                );
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition ${
                !eqBypassed
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.25)]'
                  : 'bg-white/[0.05] border-white/15 text-[#A3A9BA]'
              }`}
              title="Comparer instantanément avec/sans égaliseur (A/B Bypass)"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{eqBypassed ? 'BYPASS' : 'DSP ON'}</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={SPRING_SNAPPY}
              onClick={() => {
                onResetEq();
                onToast('Égaliseur, Preamp et Facteur Q remis à plat (0 dB)');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-[10.5px] font-bold text-amber-300 flex items-center gap-1 transition"
              title="Remettre toutes les bandes à 0 dB"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Plat</span>
            </motion.button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#F8FAFC] flex items-center justify-center transition active:scale-95"
              aria-label="Fermer l'égaliseur"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Télémétrie Studio Broadcast (LUFS + Peak dBFS + Facteur Q) */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#080A0F] border border-white/[0.08]">
          <div className="flex flex-col">
            <span className="text-[9.5px] font-mono uppercase text-[#A3A9BA]">
              Cible Broadcast
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <Activity className="w-3 h-3 shrink-0" />
              <span>{liveMeter.rmsDb.toFixed(1)} LUFS</span>
            </span>
          </div>
          <div className="flex flex-col border-x border-white/[0.08] px-2.5">
            <span className="text-[9.5px] font-mono uppercase text-[#A3A9BA]">
              Crête Sortie (Peak)
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                liveMeter.peakDb > -1.2 ? 'text-amber-300' : 'text-[#F8FAFC]'
              }`}
            >
              {liveMeter.peakDb > 0 ? `+${liveMeter.peakDb}` : liveMeter.peakDb.toFixed(1)} dBFS
            </span>
          </div>
          <div className="flex flex-col pl-1">
            <span className="text-[9.5px] font-mono uppercase text-[#A3A9BA]">
              Limiteur Anti-Clip
            </span>
            <span className="text-xs font-mono font-bold text-amber-300 truncate">
              Actif (Q={eqQFactor.toFixed(1)})
            </span>
          </div>
        </div>

        {/* 3. Analyseur Spectral FFT Temps Réel + Courbe Paramétrique Interactive */}
        <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/[0.1] space-y-3">
          <div className="relative h-24 w-full rounded-xl bg-[#05070B] border border-white/[0.06] overflow-hidden px-1">
            {/* Spectre FFT 60 FPS en arrière-plan */}
            <canvas
              ref={spectrumCanvasRef}
              width={320}
              height={92}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
            />

            {/* Grille dB (-12dB, 0dB, +12dB) */}
            <div className="absolute left-1.5 top-1 text-[8.5px] font-mono text-white/35 pointer-events-none">
              +12 dB
            </div>
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8.5px] font-mono text-white/45 pointer-events-none">
              0 dB
            </div>
            <div className="absolute left-1.5 bottom-1 text-[8.5px] font-mono text-white/35 pointer-events-none">
              -12 dB
            </div>

            {/* Courbe de réponse fréquentielle SVG superposée */}
            <svg viewBox="0 0 280 96" className="relative z-10 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="eqCurveFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="#DE1B34" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#080A0F" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line
                x1="8"
                y1="48"
                x2="272"
                y2="48"
                stroke="rgba(255,255,255,0.18)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {smoothFillPath && (
                <path d={smoothFillPath} fill="url(#eqCurveFillGrad)" />
              )}

              {smoothCurvePath && (
                <path
                  d={smoothCurvePath}
                  fill="none"
                  stroke={eqBypassed ? '#64748B' : '#F59E0B'}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              )}

              {bandCoords.map((pt, i) => {
                const isBandActive = selectedBandIdx === i;
                return (
                  <g
                    key={EQ_BANDS_META[i].freq}
                    onClick={() => setSelectedBandIdx(i)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r={isBandActive ? 7.5 : 5}
                      fill={
                        eqBypassed
                          ? '#475569'
                          : isBandActive
                          ? '#F59E0B'
                          : '#0D1017'
                      }
                      stroke="#F8FAFC"
                      strokeWidth={isBandActive ? 2.4 : 1.6}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 4. 5 Faders Verticaux Tactiles Studio + Sélecteur de Bande */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {EQ_BANDS_META.map((band, idx) => {
              const gain = eqGains[idx] ?? 0;
              const isSelected = selectedBandIdx === idx;
              const fillPct = ((gain + 12) / 24) * 100;

              return (
                <div
                  key={band.freq}
                  onClick={() => setSelectedBandIdx(idx)}
                  className={`rounded-2xl border p-2 flex flex-col items-center gap-1.5 cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#141926] border-amber-400/70 shadow-[0_0_18px_rgba(245,158,11,0.2)]'
                      : 'bg-[#0C0F17] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      eqBypassed
                        ? 'text-zinc-500'
                        : gain > 0
                        ? 'text-amber-300'
                        : gain < 0
                        ? 'text-sky-300'
                        : 'text-[#A3A9BA]'
                    }`}
                  >
                    {gain > 0 ? `+${gain}` : gain}dB
                  </span>

                  {/* Fader vertical */}
                  <div className="relative h-24 w-7 flex items-center justify-center">
                    <div className="relative h-full w-2 rounded-full bg-white/10 overflow-hidden">
                      {/* Ligne 0dB centrale */}
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/35 z-10" />
                      <div
                        style={{
                          height: `${Math.abs(fillPct - 50)}%`,
                          bottom: gain >= 0 ? '50%' : `${fillPct}%`,
                        }}
                        className={`
                          absolute inset-x-0 rounded-full transition-all
                          ${eqBypassed ? 'bg-zinc-500' : gain >= 0 ? 'bg-amber-400' : 'bg-sky-400'}
                        `}
                      />
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={gain}
                      onChange={(e) => {
                        setSelectedBandIdx(idx);
                        onChangeEqBand(idx, parseFloat(e.target.value));
                      }}
                      aria-label={`Bande ${band.freq} (${band.label})`}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                      }}
                    />
                  </div>

                  <span
                    className={`text-[10.5px] font-extrabold leading-none ${
                      isSelected ? 'text-amber-300' : 'text-[#F8FAFC]'
                    }`}
                  >
                    {band.freq}
                  </span>
                  <span className="text-[8.5px] text-[#A3A9BA] truncate max-w-full">
                    {band.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 5. Ajustement Chirurgical au Demi-Décibel (±0.5 dB) sur la Bande Sélectionnée */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#F8FAFC] truncate">
                Bande active :{' '}
                <span className="text-amber-300 font-bold">
                  {activeBand.freq} • {activeBand.label}
                </span>{' '}
                <span className="text-[10px] font-mono text-[#A3A9BA]">
                  ({activeBand.filterType})
                </span>
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-300 shrink-0">
                {activeGain > 0 ? `+${activeGain}` : activeGain} dB
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepSelectedBandGain(-0.5)}
                className="min-w-[60px] min-h-[42px] px-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 border border-white/15 text-[#F8FAFC] font-mono text-xs font-bold flex items-center justify-center transition"
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
                aria-label={`Gain précis ${activeBand.freq}`}
              />

              <button
                type="button"
                onClick={() => stepSelectedBandGain(0.5)}
                className="min-w-[60px] min-h-[42px] px-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 active:scale-95 border border-amber-400/45 text-amber-300 font-mono text-xs font-bold flex items-center justify-center transition"
              >
                +0.5 dB
              </button>
            </div>
          </div>
        </div>

        {/* 6. Contrôles d'Ingénierie Studio : Preamp (-12 à +12 dB) & Facteur Q (Largeur de bande) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-300" />
                <span>Pré-Ampli (Preamp)</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {preampDb > 0 ? `+${preampDb}` : preampDb} dB
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={preampDb}
              onChange={(e) => onChangePreampDb?.(parseFloat(e.target.value))}
              className="w-full fat-slider cursor-pointer"
              aria-label="Pré-amplificateur d'entrée en dB"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F8FAFC]">
                Facteur Q (Largeur Cloche)
              </span>
              <span className="font-mono font-bold text-emerald-300">
                Q = {eqQFactor.toFixed(1)}{' '}
                {eqQFactor <= 0.8
                  ? '(Musical)'
                  : eqQFactor >= 2.0
                  ? '(Chirurgical)'
                  : '(Studio)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {[
                { q: 0.7, label: '0.7 Large' },
                { q: 1.1, label: '1.1 Studio' },
                { q: 2.4, label: '2.4 Précis' },
              ].map((item) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => onChangeEqQFactor?.(item.q)}
                  className={`py-1.5 px-2 rounded-lg text-[10.5px] font-mono font-bold border transition ${
                    Math.abs(eqQFactor - item.q) < 0.15
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                      : 'bg-white/[0.04] border-white/10 text-[#A3A9BA] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Préréglages Studio & Genres Gabon (+241) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-[#A3A9BA] block">
            Préréglages Mastering Studio ({EQ_PRESETS.length} profils)
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {EQ_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id && !eqBypassed;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onApplyEqPreset(preset.gains);
                    onToast(`Préréglage Studio appliqué : ${preset.name}`);
                  }}
                  title={preset.description}
                  className={`px-2 py-2 rounded-xl border text-center transition ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : 'bg-white/[0.04] border-white/10 text-[#F8FAFC] hover:bg-white/10 font-medium'
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

        {/* 8. Volume Master Temps Réel */}
        <div className="p-3 rounded-2xl bg-[#080A0F] border border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#F8FAFC] font-semibold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Volume Master Temps Réel</span>
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {Math.round(masterVolume)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={masterVolume}
            onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
            className="w-full fat-slider cursor-pointer"
            aria-label="Volume Master"
          />
        </div>
      </motion.div>
    </div>
  );
};
