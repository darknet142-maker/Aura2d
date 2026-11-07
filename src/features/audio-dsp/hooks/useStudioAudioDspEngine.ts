import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeAutoHeadroomOffsetDb } from '../services/biquad-transfer.service';
import {
  DSP_BANDS_SPEC,
  SPATIAL_AUDIO_PRESETS,
  loadSavedPlaybackPrefs,
  loadSavedSpatialConfig,
  savePlaybackPrefs,
  saveSpatialConfig,
} from '../services/mastering-presets.service';
import { applySpatialDspParams, type SpatialDspNodes } from '../services/spatial-dsp-graph.service';
import type { PlaybackEnginePrefs, PrecisionEqPreset, SpatialAudioConfig } from '../types/audio-dsp.types';

export function useStudioAudioDspEngine(params: {
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
  preampGainRef: React.MutableRefObject<GainNode | null>;
  eqFiltersRef: React.MutableRefObject<BiquadFilterNode[]>;
  onEnsureAudioContext: () => void;
  onUnlockFullNonStop?: () => void;
}) {
  const { audioCtxRef, preampGainRef, eqFiltersRef, onEnsureAudioContext, onUnlockFullNonStop } = params;
  const spatialNodesRef = useRef<SpatialDspNodes | null>(null);
  const [eqGains, setEqGains] = useState<number[]>([4.6, 1.4, -1.5, 2.4, 3.8]);
  const [eqQFactors, setEqQFactors] = useState<number[]>([0.82, 1.4, 1.85, 1.3, 0.78]);
  const [eqBypassed, setEqBypassed] = useState<boolean>(false);
  const [preampDb, setPreampDb] = useState<number>(-2.4);
  const [autoHeadroom, setAutoHeadroom] = useState<boolean>(true);
  const [phaseInvert, setPhaseInvert] = useState<boolean>(false);
  const [spatialConfig, setSpatialConfig] = useState<SpatialAudioConfig>(() => loadSavedSpatialConfig());
  const [playbackPrefs, setPlaybackPrefs] = useState<PlaybackEnginePrefs>(() => loadSavedPlaybackPrefs());

  const effectivePreampDb = useMemo(() => {
    const comp = autoHeadroom && !eqBypassed ? computeAutoHeadroomOffsetDb(DSP_BANDS_SPEC, eqGains, eqQFactors) : 0;
    return Math.max(-18, Math.min(12, Math.round((preampDb + comp) * 10) / 10));
  }, [preampDb, autoHeadroom, eqBypassed, eqGains, eqQFactors]);

  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    if (preampGainRef.current) {
      const lin = (phaseInvert ? -1 : 1) * Math.pow(10, (eqBypassed ? 0 : effectivePreampDb) / 20);
      preampGainRef.current.gain.setTargetAtTime(lin, now, 0.016);
    }
    eqFiltersRef.current.forEach((filter, idx) => {
      const spec = DSP_BANDS_SPEC[idx] || DSP_BANDS_SPEC[0];
      filter.gain.setTargetAtTime(eqBypassed ? 0 : (eqGains[idx] ?? 0), now, 0.016);
      filter.Q.setTargetAtTime(Math.max(0.3, Math.min(10, eqQFactors[idx] ?? spec.defaultQ)), now, 0.016);
    });
    if (spatialNodesRef.current) applySpatialDspParams(ctx, spatialNodesRef.current, spatialConfig, eqBypassed);
  }, [eqGains, eqQFactors, eqBypassed, effectivePreampDb, phaseInvert, spatialConfig, audioCtxRef, preampGainRef, eqFiltersRef]);

  const handleChangeEqBand = useCallback((bandIdx: number, dbVal: number) => {
    onEnsureAudioContext();
    const clamped = Math.max(-12, Math.min(12, Math.round(dbVal * 10) / 10));
    setEqGains((prev) => prev.map((g, i) => (i === bandIdx ? clamped : g)));
  }, [onEnsureAudioContext]);

  const handleChangeBandQ = useCallback((bandIdx: number, nextQ: number, applyAll = false) => {
    onEnsureAudioContext();
    const clamped = Math.max(0.3, Math.min(10, Math.round(nextQ * 100) / 100));
    setEqQFactors((prev) => prev.map((q, i) => (applyAll || i === bandIdx ? clamped : q)));
  }, [onEnsureAudioContext]);

  const handleChangeEqQFactor = useCallback((nextQ: number) => handleChangeBandQ(0, nextQ, true), [handleChangeBandQ]);

  const handleApplyEqPreset = useCallback((gains: number[]) => {
    onEnsureAudioContext();
    setEqGains(gains.map((g) => Math.max(-12, Math.min(12, Math.round(g * 10) / 10))));
    setEqBypassed(false);
  }, [onEnsureAudioContext]);

  const handleApplyPrecisionPreset = useCallback((preset: PrecisionEqPreset) => {
    onEnsureAudioContext();
    setEqGains([...preset.gains]);
    setEqQFactors([...preset.qFactors]);
    setPreampDb(preset.recommendedPreampDb);
    setEqBypassed(false);
    const sp = SPATIAL_AUDIO_PRESETS.find((s) => s.id === preset.spatialPresetId);
    if (sp) {
      const nextSp: SpatialAudioConfig = { enabled: true, presetId: sp.id, stereoWidthPct: sp.stereoWidthPct, roomAmbiencePct: sp.roomAmbiencePct };
      setSpatialConfig(nextSp);
      saveSpatialConfig(nextSp);
    }
  }, [onEnsureAudioContext]);

  const handleResetEq = useCallback(() => {
    onEnsureAudioContext();
    setEqGains([0, 0, 0, 0, 0]);
    setEqQFactors(DSP_BANDS_SPEC.map((b) => b.defaultQ));
    setPreampDb(0); setPhaseInvert(false); setEqBypassed(false);
  }, [onEnsureAudioContext]);

  const handleToggleEqBypass = useCallback(() => { onEnsureAudioContext(); setEqBypassed((p) => !p); }, [onEnsureAudioContext]);
  const handleChangePreampDb = useCallback((db: number) => { onEnsureAudioContext(); setPreampDb(Math.max(-12, Math.min(12, Math.round(db * 10) / 10))); }, [onEnsureAudioContext]);
  const handleToggleAutoHeadroom = useCallback(() => { onEnsureAudioContext(); setAutoHeadroom((p) => !p); }, [onEnsureAudioContext]);
  const handleTogglePhaseInvert = useCallback(() => { onEnsureAudioContext(); setPhaseInvert((p) => !p); }, [onEnsureAudioContext]);
  const handleChangeSpatialConfig = useCallback((next: SpatialAudioConfig) => { onEnsureAudioContext(); setSpatialConfig(next); saveSpatialConfig(next); }, [onEnsureAudioContext]);
  const handleChangePlaybackPrefs = useCallback((next: PlaybackEnginePrefs) => {
    setPlaybackPrefs(next);
    savePlaybackPrefs(next);
    if (next.defaultStartMode === 'FULL_NONSTOP') onUnlockFullNonStop?.();
  }, [onUnlockFullNonStop]);

  return {
    spatialNodesRef, eqGains, eqQFactors, eqQFactor: eqQFactors[2] ?? 1.2, eqBypassed, preampDb, effectivePreampDb,
    autoHeadroom, phaseInvert, spatialConfig, playbackPrefs,
    handleChangeEqBand, handleChangeBandQ, handleChangeEqQFactor, handleApplyEqPreset,
    handleApplyPrecisionPreset, handleResetEq, handleToggleEqBypass, handleChangePreampDb,
    handleToggleAutoHeadroom, handleTogglePhaseInvert, handleChangeSpatialConfig, handleChangePlaybackPrefs,
  };
}
