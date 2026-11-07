import type { SpatialAudioConfig } from '../types/audio-dsp.types';

export interface SpatialDspNodes {
  input: GainNode;
  output: GainNode;
  subLowpass: BiquadFilterNode;
  subGain: GainNode;
  highpass: BiquadFilterNode;
  llGain: GainNode;
  rlGain: GainNode;
  lrGain: GainNode;
  rrGain: GainNode;
  haasGainL: GainNode;
  haasGainR: GainNode;
  roomWetGain: GainNode;
}

/**
 * Construit un étage Web Audio professionnel de Spatialisation Stéréo Mid/Side + Salle Studio :
 * - < 180 Hz : Ancre Sub-Grave 100% cohérente en phase (aucune annulation mono sur les kicks).
 * - > 180 Hz : Matrice Mid/Side continue (0% Mono -> 100% Stéréo native -> 180% Panoramique)
 *   enrichie d'un micro-décalage Haas (> 320 Hz, 8.5ms / 13.5ms) et de réflexions précoces amorties.
 */
export function createSpatialDspGraph(ctx: AudioContext, initial: SpatialAudioConfig): SpatialDspNodes {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // 1. Ancre Sub-Basse (< 180 Hz) centrée et solide
  const subLowpass = ctx.createBiquadFilter();
  subLowpass.type = 'lowpass';
  subLowpass.frequency.value = 180;
  subLowpass.Q.value = 0.707;
  const subGain = ctx.createGain();
  subGain.gain.value = 1.0;
  input.connect(subLowpass);
  subLowpass.connect(subGain);
  subGain.connect(output);

  // 2. Bande Stéréo Spatialisée (> 180 Hz)
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 180;
  highpass.Q.value = 0.707;
  input.connect(highpass);

  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  highpass.connect(splitter);

  const llGain = ctx.createGain();
  const rlGain = ctx.createGain();
  const lrGain = ctx.createGain();
  const rrGain = ctx.createGain();

  splitter.connect(llGain, 0);
  splitter.connect(rlGain, 1);
  splitter.connect(lrGain, 0);
  splitter.connect(rrGain, 1);

  llGain.connect(merger, 0, 0);
  rlGain.connect(merger, 0, 0);
  lrGain.connect(merger, 0, 1);
  rrGain.connect(merger, 0, 1);

  // 3. Micro-décorrélation Haas (> 340 Hz) pour élargir proprement même les sources mono
  const haasHp = ctx.createBiquadFilter();
  haasHp.type = 'highpass';
  haasHp.frequency.value = 340;
  highpass.connect(haasHp);

  const delayL = ctx.createDelay(0.05);
  delayL.delayTime.value = 0.0085;
  const delayR = ctx.createDelay(0.05);
  delayR.delayTime.value = 0.0135;
  const haasGainL = ctx.createGain();
  const haasGainR = ctx.createGain();

  haasHp.connect(delayL);
  haasHp.connect(delayR);
  delayL.connect(haasGainL);
  delayR.connect(haasGainR);
  haasGainL.connect(merger, 0, 0);
  haasGainR.connect(merger, 0, 1);

  merger.connect(output);

  // 4. Réflexions Précoces de Pièce Studio (24ms / 38ms avec amortissement ruban 3.4 kHz)
  const roomLp = ctx.createBiquadFilter();
  roomLp.type = 'lowpass';
  roomLp.frequency.value = 3400;
  highpass.connect(roomLp);

  const erDelayA = ctx.createDelay(0.1);
  erDelayA.delayTime.value = 0.024;
  const erDelayB = ctx.createDelay(0.1);
  erDelayB.delayTime.value = 0.038;
  const roomMerger = ctx.createChannelMerger(2);
  const roomWetGain = ctx.createGain();

  roomLp.connect(erDelayA);
  roomLp.connect(erDelayB);
  erDelayA.connect(roomMerger, 0, 1);
  erDelayB.connect(roomMerger, 0, 0);
  roomMerger.connect(roomWetGain);
  roomWetGain.connect(output);

  const nodes: SpatialDspNodes = {
    input,
    output,
    subLowpass,
    subGain,
    highpass,
    llGain,
    rlGain,
    lrGain,
    rrGain,
    haasGainL,
    haasGainR,
    roomWetGain,
  };
  applySpatialDspParams(ctx, nodes, initial, false);
  return nodes;
}

export function applySpatialDspParams(
  ctx: AudioContext,
  nodes: SpatialDspNodes,
  config: SpatialAudioConfig,
  bypassed: boolean
): void {
  const now = ctx.currentTime;
  const active = config.enabled && !bypassed;
  const w = active ? Math.max(0, Math.min(1.8, config.stereoWidthPct / 100)) : 1.0;

  // Matrice Mid/Side : L' = 0.5*(1+w)*L + 0.5*(1-w)*R ; R' = 0.5*(1-w)*L + 0.5*(1+w)*R
  const sameCh = 0.5 * (1 + w);
  const crossCh = 0.5 * (1 - w);
  const haasAmt = active && w > 1.02 ? (w - 1.0) * 0.22 : 0;
  const roomAmt = active ? (Math.max(0, Math.min(100, config.roomAmbiencePct)) / 100) * 0.28 : 0;

  nodes.llGain.gain.setTargetAtTime(sameCh, now, 0.018);
  nodes.rrGain.gain.setTargetAtTime(sameCh, now, 0.018);
  nodes.rlGain.gain.setTargetAtTime(crossCh, now, 0.018);
  nodes.lrGain.gain.setTargetAtTime(crossCh, now, 0.018);
  nodes.haasGainL.gain.setTargetAtTime(haasAmt, now, 0.02);
  nodes.haasGainR.gain.setTargetAtTime(-haasAmt * 0.88, now, 0.02);
  nodes.roomWetGain.gain.setTargetAtTime(roomAmt, now, 0.025);
}

