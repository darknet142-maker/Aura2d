import React, { useState, useMemo } from 'react';
import {
  DEFAULT_ROYALTY_SETTINGS,
  TAX_STATUS_LABELS,
  type RoyaltySettings,
} from '../economics/economicConfig';
import { RIGHTS_ROLE_LABELS, type RightsLine } from '../economics/rightsSplitEngine';
import type { PayoutStatement } from '../economics/payoutEngine';
import { formatFcfa, formatFcfaPrecise } from '../economics/formatters';

export interface ArtistRoyaltyAndTipCardProps {
  entityName: string;
  entityRole: 'ARTIST' | 'LABEL' | 'BEATMAKER' | 'ENGINEER' | 'LYRICIST';
  rightsLines?: RightsLine[];
  statement?: PayoutStatement;
  settings?: RoyaltySettings;
  onSendTip?: (params: {
    recipientName: string;
    nominalAmount: number;
    chargedToFan: number;
    artistNetAmount: number;
    platformCommission: number;
    operator: 'AIRTEL_MONEY' | 'MOOV_MONEY';
    idempotencyKey: string;
  }) => void;
}

const TIP_AMOUNTS = [500, 1000, 2500, 5000] as const;

export const ArtistRoyaltyAndTipCard: React.FC<ArtistRoyaltyAndTipCardProps> = ({
  entityName,
  entityRole,
  rightsLines = [],
  statement,
  settings = DEFAULT_ROYALTY_SETTINGS,
  onSendTip,
}) => {
  const [selectedTip, setSelectedTip] = useState<number>(1000);
  const [tipOperator, setTipOperator] = useState<'AIRTEL_MONEY' | 'MOOV_MONEY'>('AIRTEL_MONEY');
  const [passFeeToDonor, setPassFeeToDonor] = useState<boolean>(settings.tipFeePassedToDonor);
  const [tipFeedback, setTipFeedback] = useState<string | null>(null);
  const [receivedTipsTotal, setReceivedTipsTotal] = useState<number>(0);

  const entityLines = useMemo(
    () =>
      rightsLines.filter(
        (l) => l.holderName.trim().toLowerCase() === entityName.trim().toLowerCase()
      ),
    [rightsLines, entityName]
  );

  const masterDirectTotal = useMemo(
    () =>
      entityLines
        .filter((l) => l.stratum === 'MASTER_DIRECT')
        .reduce((s, l) => s + l.amount, 0),
    [entityLines]
  );

  const bugadaAuthorshipTotal = useMemo(
    () =>
      entityLines
        .filter((l) => l.stratum === 'AUTHORSHIP_BUGADA')
        .reduce((s, l) => s + l.amount, 0),
    [entityLines]
  );

  const totalGrossWithCarry = (statement?.totalGross ?? masterDirectTotal) + receivedTipsTotal;
  const thresholdPct = Math.min(100, Math.round((totalGrossWithCarry / settings.payoutThreshold) * 100));

  // Calcul du don selon l'audit (§4) : frais Mobile Money (2%) supportés par le fan pour préserver 90% artiste + 10% plateforme
  const gatewayFee = Math.round(selectedTip * settings.paymentFeeRate.MOBILE_MONEY);
  const chargedToFan = passFeeToDonor ? selectedTip + gatewayFee : selectedTip;
  const artistNetTip = Math.round(selectedTip * (1 - settings.tipCommissionRate));
  const platformNetCommission = passFeeToDonor
    ? Math.round(selectedTip * settings.tipCommissionRate)
    : Math.round(selectedTip * settings.tipCommissionRate - gatewayFee);

  const handleConfirmTip = () => {
    const idempotencyKey = `STK-${Date.now().toString(36).toUpperCase()}`;
    setReceivedTipsTotal((prev) => prev + artistNetTip);
    setTipFeedback(
      `Push STK ${tipOperator === 'AIRTEL_MONEY' ? 'Airtel Money (*150#)' : 'Moov Money (*555#)'} validé (${idempotencyKey}) : ${formatFcfa(artistNetTip)} crédités à ${entityName} !`
    );
    if (onSendTip) {
      onSendTip({
        recipientName: entityName,
        nominalAmount: selectedTip,
        chargedToFan,
        artistNetAmount: artistNetTip,
        platformCommission: platformNetCommission,
        operator: tipOperator,
        idempotencyKey,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* VOLET 1 : COMPTE SÉQUESTRE ROYALTIES (48 % MASTER DIRECT / 12 % BUGADA) */}
      <div className="bg-[#07080C] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              Portail Ayant Droit • Convention BUGADA × Ministère de la Culture
            </span>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                totalGrossWithCarry >= settings.payoutThreshold
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
              }`}
            >
              {totalGrossWithCarry >= settings.payoutThreshold
                ? '✓ Éligible retrait Mobile Money'
                : `Seuil retrait : ${thresholdPct}% de ${formatFcfa(settings.payoutThreshold)}`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">Droits Voisins / Master (48%)</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-300">
                {formatFcfaPrecise(masterDirectTotal + receivedTipsTotal)}
              </span>
              <span className="text-[9.5px] text-zinc-500 block mt-0.5">Paiement direct DROP</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 block">Droits d&apos;Auteur (12%)</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-300">
                {formatFcfaPrecise(bugadaAuthorshipTotal)}
              </span>
              <span className="text-[9.5px] text-zinc-500 block mt-0.5">Gestion collective BUGADA</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-zinc-400 block">Net Mobile Money estimé</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-white">
                {formatFcfaPrecise(
                  (statement?.netPayable ?? masterDirectTotal * 0.89595) + receivedTipsTotal
                )}
              </span>
              <span className="text-[9.5px] text-zinc-500 block mt-0.5">
                Après BNC (9,5%) &amp; frais (1%)
              </span>
            </div>
          </div>

          {entityLines.length > 0 && (
            <div className="pt-1 space-y-1 max-h-28 overflow-y-auto pr-1">
              {entityLines.slice(0, 5).map((line, idx) => (
                <div
                  key={`${line.trackId}-${line.role}-${idx}`}
                  className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-[#0D1017] border border-white/[0.05]"
                >
                  <span className="text-zinc-300 truncate">
                    <strong>{line.trackTitle}</strong> • {RIGHTS_ROLE_LABELS[line.role]}
                  </span>
                  <span
                    className={`font-mono font-bold shrink-0 ml-2 ${
                      line.stratum === 'MASTER_DIRECT' ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {formatFcfaPrecise(line.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
          <div className="w-full h-1.5 bg-[#0D1017] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
              style={{ width: `${thresholdPct}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 flex items-center justify-between">
            <span>
              Statut fiscal :{' '}
              <strong className="text-zinc-200">
                {TAX_STATUS_LABELS[statement?.taxStatus ?? (entityRole === 'LABEL' ? 'RESIDENT_COMPANY' : 'RESIDENT_INDIVIDUAL')]}
              </strong>
            </span>
            <span className="font-mono text-zinc-400">Report sans annulation &lt; 5 000 FCFA</span>
          </p>
        </div>
      </div>

      {/* VOLET 2 : SOUTIEN DIRECT DES FANS (TIPPING MOBILE MONEY +241) */}
      <div className="bg-[#07080C] border border-amber-400/30 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                Soutien Direct des Fans (Tipping +241)
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
                Envoyer un don Mobile Money à {entityName}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono text-[10px] font-bold">
              90 % versés à l&apos;ayant droit
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {TIP_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setSelectedTip(amt)}
                className={`py-2 px-2 rounded-xl font-mono text-xs font-bold border transition ${
                  selectedTip === amt
                    ? 'bg-[#DE1B34] border-[#DE1B34] text-white shadow-[0_0_12px_rgba(222,27,52,0.35)]'
                    : 'bg-[#0D1017] border-white/10 text-zinc-300 hover:border-white/25'
                }`}
              >
                {formatFcfa(amt)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTipOperator('AIRTEL_MONEY')}
                className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-mono transition ${
                  tipOperator === 'AIRTEL_MONEY'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold'
                    : 'bg-[#0D1017] border-white/10 text-zinc-400'
                }`}
              >
                Airtel Money (*150#)
              </button>
              <button
                type="button"
                onClick={() => setTipOperator('MOOV_MONEY')}
                className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-mono transition ${
                  tipOperator === 'MOOV_MONEY'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold'
                    : 'bg-[#0D1017] border-white/10 text-zinc-400'
                }`}
              >
                Moov Money (*555#)
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-[10.5px] text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={passFeeToDonor}
                onChange={(e) => setPassFeeToDonor(e.target.checked)}
                className="accent-emerald-400 rounded"
              />
              <span>Couvrir les frais Mobile Money (+{formatFcfa(gatewayFee)})</span>
            </label>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-zinc-400">
              Débité : <strong className="text-white">{formatFcfa(chargedToFan)}</strong> • Net artiste :{' '}
              <strong className="text-emerald-300">{formatFcfa(artistNetTip)}</strong>
            </span>
            <button
              type="button"
              onClick={handleConfirmTip}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#07080C] font-sans font-bold text-xs transition shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            >
              Soutenir via Push STK ({formatFcfa(chargedToFan)})
            </button>
          </div>
          {tipFeedback && (
            <div
              role="status"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-[11px] font-mono"
            >
              {tipFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

