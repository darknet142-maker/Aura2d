import React, { useState, useMemo } from 'react';
import {
  DEFAULT_ROYALTY_SETTINGS,
  type RoyaltySettings,
} from '../economics/economicConfig';
import {
  RIGHTS_ROLE_LABELS,
  splitTrackRights,
  type RightsLine,
  type TrackRightsMeta,
} from '../economics/rightsSplitEngine';
import { formatFcfa, formatFcfaPrecise } from '../economics/formatters';

export interface TrackRoyaltySplitBadgeProps {
  trackMeta: TrackRightsMeta & { realPlays?: number };
  trackRightsLines?: RightsLine[];
  settings?: RoyaltySettings;
  onOpenEntityProfile?: (
    name: string,
    role: 'ARTIST' | 'LABEL' | 'BEATMAKER' | 'ENGINEER' | 'LYRICIST'
  ) => void;
}

export const TrackRoyaltySplitBadge: React.FC<TrackRoyaltySplitBadgeProps> = ({
  trackMeta,
  trackRightsLines,
  settings = DEFAULT_ROYALTY_SETTINGS,
  onOpenEntityProfile,
}) => {
  const [quickTipOpen, setQuickTipOpen] = useState<boolean>(false);
  const [tipConfirmedMsg, setTipConfirmedMsg] = useState<string | null>(null);

  const isrcCode =
    trackMeta.isrc ||
    `GA-DRP-26-${trackMeta.trackId.replace(/[^0-9A-Za-z]/g, '').slice(-5).padStart(5, '0').toUpperCase()}`;

  // Si aucune ligne User-Centric n'est fournie pour ce titre, calcule la ventilation sur une base nominale de 1 000 FCFA
  const computedLines = useMemo(() => {
    const filtered = (trackRightsLines ?? []).filter((l) => l.trackId === trackMeta.trackId);
    if (filtered.length > 0) return filtered;
    const estTotal = Math.max(600, Math.round((trackMeta.realPlays ?? 120) * 6.5));
    return splitTrackRights(
      {
        trackId: trackMeta.trackId,
        validStreams: trackMeta.realPlays ?? 120,
        fromSubscriptions: estTotal * 0.85,
        fromAdPool: estTotal * 0.15,
        fromEmergingFund: 0,
        fromZeroStreamPool: 0,
        total: estTotal,
      },
      { ...trackMeta, isrc: isrcCode },
      settings
    );
  }, [trackRightsLines, trackMeta, isrcCode, settings]);

  const totalTrackRoyalties = useMemo(
    () => computedLines.reduce((s, l) => s + l.amount, 0),
    [computedLines]
  );

  const masterTotal = useMemo(
    () =>
      computedLines
        .filter((l) => l.stratum === 'MASTER_DIRECT')
        .reduce((s, l) => s + l.amount, 0),
    [computedLines]
  );

  const bugadaTotal = useMemo(
    () =>
      computedLines
        .filter((l) => l.stratum === 'AUTHORSHIP_BUGADA')
        .reduce((s, l) => s + l.amount, 0),
    [computedLines]
  );

  const handleQuickTip = (amount: number, operator: 'AIRTEL' | 'MOOV') => {
    const fee = Math.round(amount * 0.02);
    const artistNet = Math.round(amount * 0.9);
    const stkRef = `STK-${Date.now().toString(36).toUpperCase()}`;
    setTipConfirmedMsg(
      `Don ${operator === 'AIRTEL' ? 'Airtel Money (*150#)' : 'Moov Money (*555#)'} validé (${stkRef}) : ${formatFcfa(artistNet)} nets reversés à ${trackMeta.artist} (${formatFcfa(amount + fee)} TTC).`
    );
  };

  return (
    <div className="bg-[#07080C] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              CERTIFIÉ BUGADA × MINISTÈRE DE LA CULTURE
            </span>
            <span className="px-2 py-0.5 rounded bg-white/[0.06] text-amber-300 font-mono text-[10px]">
              ISRC : {isrcCode}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB] mt-1">
            Clé de Répartition des Royalties du Titre ({formatFcfaPrecise(totalTrackRoyalties)})
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setQuickTipOpen((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#07080C] font-bold text-xs transition shadow-[0_0_12px_rgba(251,191,36,0.3)]"
        >
          {quickTipOpen ? 'Masquer Soutien' : '♥ Soutenir ce titre (+241)'}
        </button>
      </div>

      {quickTipOpen && (
        <div className="p-3 rounded-xl bg-[#0D1017] border border-amber-400/35 space-y-2 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-zinc-300 font-medium">
              Soutien direct Mobile Money (90% net à {trackMeta.artist}, frais 2% inclus) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[500, 1000, 2500].map((amt) => (
                <button
                  key={`airtel-${amt}`}
                  type="button"
                  onClick={() => handleQuickTip(amt, 'AIRTEL')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-mono text-[11px] font-bold"
                >
                  Airtel {formatFcfa(amt)}
                </button>
              ))}
              {[500, 1000].map((amt) => (
                <button
                  key={`moov-${amt}`}
                  type="button"
                  onClick={() => handleQuickTip(amt, 'MOOV')}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-mono text-[11px] font-bold"
                >
                  Moov {formatFcfa(amt)}
                </button>
              ))}
            </div>
          </div>
          {tipConfirmedMsg && (
            <div className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1.5">
              {tipConfirmedMsg}
            </div>
          )}
        </div>
      )}

      {/* Résumé 48 % Master Direct vs 12 % Droits d'Auteur BUGADA */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-emerald-500/25">
          <span className="text-[10px] font-mono text-emerald-400 block">
            Droits Voisins / Master (48 % du Net = 80 %)
          </span>
          <span className="font-mono text-xs sm:text-sm font-bold text-white block mt-0.5">
            {formatFcfaPrecise(masterTotal)}
          </span>
          <span className="text-[10px] text-zinc-400">
            Paiement direct DROP (Artistes, Labels, Ingés)
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-amber-400/25">
          <span className="text-[10px] font-mono text-amber-300 block">
            Droits d&apos;Auteur &amp; Édition (12 % du Net = 20 %)
          </span>
          <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 block mt-0.5">
            {formatFcfaPrecise(bugadaTotal)}
          </span>
          <span className="text-[10px] text-zinc-400">
            Bordereau CRD BUGADA (Parolier &amp; Beatmaker)
          </span>
        </div>
      </div>

      {/* Ventilation nominative par ayant droit du morceau */}
      <div className="space-y-1.5">
        {computedLines.map((line, idx) => {
          const sharePct =
            totalTrackRoyalties > 0 ? Math.round((line.amount / totalTrackRoyalties) * 100) : 0;
          const mappedStudioRole =
            line.role === 'MASTER_OWNER'
              ? 'LABEL'
              : line.role === 'COMPOSER'
                ? 'BEATMAKER'
                : line.role === 'LYRICIST'
                  ? 'LYRICIST'
                  : line.role === 'SOUND_ENGINEER'
                    ? 'ENGINEER'
                    : 'ARTIST';
          return (
            <div
              key={`${line.holderName}-${line.role}-${idx}`}
              onClick={() =>
                onOpenEntityProfile && onOpenEntityProfile(line.holderName, mappedStudioRole)
              }
              className={`flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-xs ${
                onOpenEntityProfile ? 'cursor-pointer hover:border-white/25 transition' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-white truncate">{line.holderName}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-mono text-[10px]">
                  {RIGHTS_ROLE_LABELS[line.role]}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-zinc-400">{sharePct}%</span>
                <span
                  className={`font-bold ${
                    line.stratum === 'MASTER_DIRECT' ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {formatFcfaPrecise(line.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

