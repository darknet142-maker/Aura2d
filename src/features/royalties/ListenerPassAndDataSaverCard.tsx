import React, { useState, useMemo } from 'react';
import {
  LISTENER_OFFERS,
  PAYMENT_CHANNEL_LABELS,
  type ListenerPlanId,
  type PaymentChannel,
  type RoyaltySettings,
} from '../economics/economicConfig';
import { computeNetBase } from '../economics/fiscalEngine';
import { formatFcfa, formatFcfaPrecise, formatPercent } from '../economics/formatters';

export interface ListenerTrackShareItem {
  trackId: string;
  title: string;
  artist: string;
  validStreams: number;
  listenSeconds: number;
}

export interface ListenerPassAndDataSaverCardProps {
  selectedPlan: ListenerPlanId;
  onSelectPlan: (plan: ListenerPlanId) => void;
  paymentChannel: PaymentChannel;
  onSelectPaymentChannel: (channel: PaymentChannel) => void;
  audioProfile: 'DATA_SAVER_32K' | 'STANDARD_96K' | 'HIRES_256K';
  onSelectAudioProfile: (profile: 'DATA_SAVER_32K' | 'STANDARD_96K' | 'HIRES_256K') => void;
  offlineDownloadedCount: number;
  listenerTracks: ListenerTrackShareItem[];
  settings: RoyaltySettings;
}

const TELECOM_BUNDLES = [
  { id: 'MICRO', label: 'Micro-forfait 50 Mo (400 FCFA)', costPerGb: 8000 },
  { id: 'MOOV_1_5G', label: 'Moov Mensuel 1,5 Go (4 500 FCFA)', costPerGb: 3000 },
  { id: 'WAMI_750M', label: 'Airtel Wami Hebdo 750 Mo (2 000 FCFA)', costPerGb: 2667 },
  { id: 'WAMI_3G', label: 'Airtel Wami Mensuel 3 Go (6 000 FCFA)', costPerGb: 2000 },
  { id: 'AIRTEL_NUIT', label: 'Airtel Nuit 500 Mo 23h-06h (400 FCFA)', costPerGb: 800 },
] as const;

const AUDIO_PROFILES = [
  {
    id: 'DATA_SAVER_32K' as const,
    label: 'Économie de Données (Opus 32 kbps)',
    mbPerHour: 14.4,
    badge: '-75 % de Data',
    desc: 'Idéal sur 3G/4G prépayée Airtel & Moov. Seulement 288 Mo pour 20h d’écoute.',
  },
  {
    id: 'STANDARD_96K' as const,
    label: 'Qualité Standard (Opus 64 / AAC 96 kbps)',
    mbPerHour: 43.2,
    badge: 'Équilibré',
    desc: 'Clarté studio standard (-14 LUFS) pour écoute quotidienne en 4G ou Wi-Fi.',
  },
  {
    id: 'HIRES_256K' as const,
    label: 'Master Hi-Res Premium (Opus 160 / AAC 256 kbps)',
    mbPerHour: 115.2,
    badge: 'Premium & Cache',
    desc: 'Fidélité maximale recommandée en Wi-Fi ou en téléchargement hors ligne.',
  },
];

export const ListenerPassAndDataSaverCard: React.FC<ListenerPassAndDataSaverCardProps> = ({
  selectedPlan,
  onSelectPlan,
  paymentChannel,
  onSelectPaymentChannel,
  audioProfile,
  onSelectAudioProfile,
  offlineDownloadedCount,
  listenerTracks,
  settings,
}) => {
  const [monthlyListenHours, setMonthlyListenHours] = useState<number>(20);
  const [selectedBundleId, setSelectedBundleId] = useState<string>('MOOV_1_5G');

  const activeOffer = LISTENER_OFFERS[selectedPlan];
  const netBreakdown = useMemo(
    () => computeNetBase(activeOffer.priceTtc, paymentChannel, settings),
    [activeOffer.priceTtc, paymentChannel, settings]
  );

  // Calcul du coût data mensuel selon le profil de compression
  const activeProfileSpec =
    AUDIO_PROFILES.find((p) => p.id === audioProfile) || AUDIO_PROFILES[0];
  const bundleSpec =
    TELECOM_BUNDLES.find((b) => b.id === selectedBundleId) || TELECOM_BUNDLES[1];

  const standardStreamGb = (monthlyListenHours * 57.6) / 1000; // 128 kbps classique = 57,6 Mo/h
  const currentStreamGb = (monthlyListenHours * activeProfileProfileMb(activeProfileSpec.mbPerHour)) / 1000;
  const standardDataCostFcfa = Math.round(standardStreamGb * bundleSpec.costPerGb);
  const opusDataCostFcfa = Math.round(currentStreamGb * bundleSpec.costPerGb);
  const offlineNightCostFcfa = Math.round(currentStreamGb * 800); // Airtel Nuit 800 FCFA/Go

  // Répartition User-Centric en direct du panier de l'auditeur
  const userCentricShares = useMemo(() => {
    const valid = listenerTracks.filter((t) => t.validStreams > 0);
    const totalStreams = valid.reduce((s, t) => s + t.validStreams, 0);
    const totalCappedSec = valid.reduce(
      (s, t) => s + Math.min(t.listenSeconds, t.validStreams * settings.maxCountedSecondsPerStream),
      0
    );
    if (totalStreams === 0 || netBreakdown.rightsHoldersPool <= 0) return [];

    const byArtist = new Map<string, { artist: string; streams: number; seconds: number; weight: number }>();
    valid.forEach((t) => {
      const cappedSec = Math.min(t.listenSeconds, t.validStreams * settings.maxCountedSecondsPerStream);
      const w =
        0.5 * (t.validStreams / totalStreams) +
        0.5 * (totalCappedSec > 0 ? cappedSec / totalCappedSec : t.validStreams / totalStreams);
      const prev = byArtist.get(t.artist) ?? { artist: t.artist, streams: 0, seconds: 0, weight: 0 };
      prev.streams += t.validStreams;
      prev.seconds += t.listenSeconds;
      prev.weight += w;
      byArtist.set(t.artist, prev);
    });

    return Array.from(byArtist.values())
      .map((item) => {
        const rawAmount = netBreakdown.rightsHoldersPool * item.weight;
        const cappedAmount = Math.min(rawAmount, item.streams * settings.capPerStream);
        return {
          ...item,
          rawAmount,
          cappedAmount,
          masterDirect48: cappedAmount * settings.masterShareOfRights,
          bugadaAuthorship12: cappedAmount * (1 - settings.masterShareOfRights),
        };
      })
      .sort((a, b) => b.cappedAmount - a.cappedAmount);
  }, [listenerTracks, netBreakdown.rightsHoldersPool, settings]);

  return (
    <div className="space-y-3.5">
      {/* 1. OFFRES OFFICIELLES & PLAFOND ANTI-CANNIBALISATION */}
      <div className="bg-[#07080C] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
              Tarification Officielle DROP × BUGADA (+241)
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
              Choisissez votre formule Mobile Money &amp; Cache Hors-Ligne
            </h4>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-[10.5px]">
            Cache hors-ligne :{' '}
            {activeOffer.offlineTrackCap === null
              ? `${offlineDownloadedCount} / Illimité`
              : `${offlineDownloadedCount} / ${activeOffer.offlineTrackCap} titres max`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(Object.keys(LISTENER_OFFERS) as ListenerPlanId[]).map((planId) => {
            const offer = LISTENER_OFFERS[planId];
            const active = selectedPlan === planId;
            return (
              <button
                key={planId}
                type="button"
                onClick={() => onSelectPlan(planId)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                    : 'bg-[#0D1017] border-white/[0.08] text-zinc-300 hover:border-white/25'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#F5F2EB]">{offer.label}</span>
                    <span className="font-mono text-xs font-extrabold text-amber-300">
                      {formatFcfa(offer.priceTtc)}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400 mt-1 leading-snug">{offer.pitch}</p>
                </div>
                <ul className="space-y-1 pt-1.5 border-t border-white/[0.07]">
                  {offer.features.map((feat, i) => (
                    <li key={i} className="text-[10px] text-zinc-300 flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Canal de paiement : Mobile Money (2%) vs Crédit d'appel DCB (40%) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
          <span className="text-[11px] font-mono text-zinc-400">Canal d&apos;encaissement :</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PAYMENT_CHANNEL_LABELS) as PaymentChannel[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => onSelectPaymentChannel(ch)}
                className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-mono transition ${
                  paymentChannel === ch
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                    : 'bg-[#0D1017] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {PAYMENT_CHANNEL_LABELS[ch]} ({formatPercent(settings.paymentFeeRate[ch])})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BOUCLIER CONTRE LA « TAXE DATA » & CODEC OPUS 32 KBPS */}
      <div className="bg-[#07080C] border border-amber-400/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
              Économiseur de Forfait Internet Mobile (+241)
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
              Pourquoi le Premium + Cache Hors-Ligne coûte moins cher que le Gratuit
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono text-[10.5px]">
            {monthlyListenHours}h d&apos;écoute / mois
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {AUDIO_PROFILES.map((prof) => {
            const active = audioProfile === prof.id;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => onSelectAudioProfile(prof.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  active
                    ? 'bg-amber-400/15 border-amber-400 text-white'
                    : 'bg-[#0D1017] border-white/[0.07] text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold">{prof.label}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 font-mono text-[9.5px]">
                    {prof.badge}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">{prof.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] space-y-1.5">
            <label className="text-[10.5px] font-mono text-zinc-400 flex justify-between">
              <span>Temps d&apos;écoute mensuel :</span>
              <strong className="text-white">{monthlyListenHours} heures / mois</strong>
            </label>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={monthlyListenHours}
              onChange={(e) => setMonthlyListenHours(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <select
              value={selectedBundleId}
              onChange={(e) => setSelectedBundleId(e.target.value)}
              className="w-full bg-[#07080C] border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
            >
              {TELECOM_BUNDLES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} — {formatFcfa(b.costPerGb)}/Go
                </option>
              ))}
            </select>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0D1017] border border-emerald-500/25 flex flex-col justify-between gap-1 text-[11px]">
            <div className="flex justify-between text-zinc-400">
              <span>Flux classique 128 kbps ({standardStreamGb.toFixed(2)} Go) :</span>
              <span className="font-mono text-rose-300 font-bold">{formatFcfa(standardDataCostFcfa)} de data</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Flux DROP sélectionné ({currentStreamGb.toFixed(2)} Go) :</span>
              <span className="font-mono text-amber-300 font-bold">{formatFcfa(opusDataCostFcfa)} de data</span>
            </div>
            <div className="flex justify-between text-emerald-300 pt-1 border-t border-white/10 font-bold">
              <span>En Cache Hors-Ligne (Wi-Fi / Airtel Nuit) :</span>
              <span className="font-mono">0 à {formatFcfa(offlineNightCostFcfa)} / mois</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRANSPARENCE USER-CENTRIC : « OÙ VONT MES 1 500 FCFA ? » */}
      <div className="bg-[#07080C] border border-white/[0.1] rounded-2xl p-3.5 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block">
              Modèle User-Centric Transparent (60 % Ayants Droit / 40 % Plateforme)
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-[#F5F2EB]">
              Répartition exacte de votre forfait ({formatFcfa(activeOffer.priceTtc)})
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono text-[10.5px]">
            Pot artistes : {formatFcfaPrecise(netBreakdown.rightsHoldersPool)}
          </span>
        </div>

        {activeOffer.priceTtc === 0 ? (
          <p className="text-xs text-zinc-400">
            En formule Gratuite, vos écoutes sont rémunérées via le fonds publicitaire mutualisé. Passez au{' '}
            <strong className="text-emerald-300">Premium (1 500 FCFA)</strong> pour que 60 % de votre abonnement
            financent directement les artistes gabonais que vous écoutez.
          </p>
        ) : userCentricShares.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Aucune écoute certifiée sur la période : conformément à la convention BUGADA, les {formatFcfaPrecise(netBreakdown.rightsHoldersPool)}{' '}
            de votre pot sont reversés au prorata du Catalogue National Gabonais (+241).
          </p>
        ) : (
          <div className="space-y-1.5">
            {userCentricShares.map((item) => (
              <div
                key={item.artist}
                className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#0D1017] border border-white/[0.06] text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-white">{item.artist}</span>
                  <span className="text-[10.5px] font-mono text-zinc-400 ml-2">
                    ({item.streams} écoutes • {formatPercent(item.weight)} de votre panier)
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-emerald-300" title="48 % Master Direct (Artiste & Producteur)">
                    Master: {formatFcfaPrecise(item.masterDirect48)}
                  </span>
                  <span className="text-amber-300" title="12 % Droits d'Auteur BUGADA (Parolier & Beatmaker)">
                    BUGADA: {formatFcfaPrecise(item.bugadaAuthorship12)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                    {formatFcfaPrecise(item.cappedAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function activeProfileProfileMb(mb: number): number {
  return mb;
}

