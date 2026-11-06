import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  QrCode,
  VolumeX,
  Volume2,
  Radio,
  Clock,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Disc3,
  Coins,
} from 'lucide-react';
import {
  B2B_PRO_PACKS,
  B2B_DILUTION_COMPARISON,
  type B2bProPackSpec,
} from '../economics/monthlyTreasury36M';
import { formatFcfa } from '../economics/formatters';

export const B2bHorecaBugadaPanel: React.FC = () => {
  const [selectedPackId, setSelectedPackId] = useState<B2bProPackSpec['id']>('PRO_M');
  const [showWithVat, setShowWithVat] = useState<boolean>(false);
  const [venueCountTier, setVenueCountTier] = useState<1 | 2 | 3>(1);

  // Simulateur Jukebox Social QR & Sponsoring B2B2C
  const [activeVenuesYear, setActiveVenuesYear] = useState<30 | 100 | 250>(30);
  const [monthlyTipPerVenue, setMonthlyTipPerVenue] = useState<number>(15_000);
  const [enableBeverageSponsorY1, setEnableBeverageSponsorY1] = useState<boolean>(true);

  // Contrôles techniques Jukebox Pro & Anti-Fraude
  const [crossfadeSeconds, setCrossfadeSeconds] = useState<number>(3);
  const [daypartingEnabled, setDaypartingEnabled] = useState<boolean>(true);
  const [autoPauseClosingEnabled, setAutoPauseClosingEnabled] = useState<boolean>(true);
  const [zeroVolumeGuardEnabled, setZeroVolumeGuardEnabled] = useState<boolean>(true);
  const [venueJingleIntervalMin, setVenueJingleIntervalMin] = useState<30 | 45>(30);
  const [inspectQrModalOpen, setInspectQrModalOpen] = useState<boolean>(false);

  const selectedPack = B2B_PRO_PACKS.find((p) => p.id === selectedPackId) ?? B2B_PRO_PACKS[1];
  const multiVenueDiscount = venueCountTier === 1 ? 0 : venueCountTier === 2 ? 0.2 : 0.25;
  const discountedMonthlyTtc = Math.round(
    selectedPack.monthlyPriceFcfa * (1 - multiVenueDiscount)
  );

  // Calculs Jukebox Social QR Code sur 12 mois
  const annualJukeboxTipVolume = activeVenuesYear * monthlyTipPerVenue * 12;
  const annualArtistsNet90 = Math.round(annualJukeboxTipVolume * 0.9);
  const annualPlatformNet8 = Math.round(annualJukeboxTipVolume * 0.08);
  const annualSponsorNet85 = enableBeverageSponsorY1 ? Math.round(250_000 * 12 * 0.85) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Bandeau Guichet Unique DROP × BUGADA */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-emerald-500/10 border border-amber-500/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              VERTICALE B2B HORECA • GUICHET UNIQUE DROP × BUGADA (+241)
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Offre Professionnelle Bars, Maquis, Snacks, Restaurants & Hôtels
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Conforme à l&apos;<strong>Ordonnance n°0011/PR/2024</strong> et au{' '}
              <strong>Décret n°0282/PR/MCJSA</strong> (campagne nationale de contrôle BUGADA &
              suivi GMC-SA). Chaque Pack Pro ventile automatiquement <strong>60 % du net</strong> en{' '}
              <span className="text-emerald-300 font-bold">48 % Master Direct</span> (Producteurs,
              Artistes, Ingénieurs son) et{' '}
              <span className="text-amber-300 font-bold">
                12 % Redevance Communication Publique BUGADA
              </span>{' '}
              avec relevé certifié des boucles ISRC hors-ligne.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInspectQrModalOpen((v) => !v)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            {inspectQrModalOpen ? 'Masquer Certificat QR BUGADA' : 'Simuler Contrôle Agent BUGADA'}
          </button>
        </div>

        {inspectQrModalOpen && (
          <div className="mt-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                <CheckCircle2 className="w-4 h-4" />
                MACARON OFFICIEL « ÉTABLISSEMENT PARTENAIRE DROP × BUGADA » VÉRIFIÉ
              </div>
              <p className="text-xs text-slate-300">
                <strong>Établissement :</strong> Le Phare Lounge & Grill (Louis, Libreville) •{' '}
                <strong>Licence :</strong> #GA-BUGADA-2026-PRO-M-0412
              </p>
              <p className="text-xs text-slate-400">
                <strong>Dernier Heartbeat Réseau (&lt; 30 j) :</strong> Synchronisé il y a 4 jours
                (9 420 lectures ISRC certifiées HMAC-SHA256) • <strong>Device ID lié :</strong>{' '}
                TAB-LENOVO-LB-9941A (Verrouillage matériel actif).
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Statut Inspection</p>
              <p className="text-sm font-black text-white mt-0.5">CONFORME & À JOUR</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quittance 12% BUGADA & 48% Master payée
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Pourquoi un bar ne peut pas utiliser l'offre B2C (Dilution User-Centric) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Mathématique des Boucles en User-Centric : Pourquoi l&apos;abonnement B2C (1 500
              FCFA) est interdit aux Bars
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Un établissement diffusant 12h à 24h/jour joue 18x à 36x plus de titres qu&apos;un
              particulier (20h/mois), ce qui écraserait la rémunération par titre à 0,05 FCFA sans
              les Packs Pro.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3">Profil d&apos;établissement</th>
                <th className="py-2 px-3">Amplitude</th>
                <th className="py-2 px-3 text-right">Titres / mois</th>
                <th className="py-2 px-3 text-right">Multiple</th>
                <th className="py-2 px-3 text-right text-rose-300">
                  Dilué sur 1 500 FCFA (HT / TVA)
                </th>
                <th className="py-2 pl-3 text-right text-emerald-300">
                  Restauré avec Pack Pro (HT)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {B2B_DILUTION_COMPARISON.map((row) => (
                <tr key={row.profile} className="hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3 font-semibold text-white">{row.profile}</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {row.dailyHours} ({row.monthlyHours}h)
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {row.monthlyTracks.toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                    {row.volumeVsB2c}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300 font-semibold">
                    {row.dilutedRoyaltyAt1500WithoutVat.toFixed(2)} FCFA /{' '}
                    {row.dilutedRoyaltyAt1500WithVat.toFixed(2)} FCFA
                  </td>
                  <td className="py-2.5 pl-3 text-right text-emerald-400 font-black">
                    {row.restoredRoyaltyWithoutVat.toFixed(2)} FCFA ({row.recommendedPack})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Grille Tarifaire Packs Pro S / M / L + Remise Multi-Établissements */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Grille Tarifaire « Packs DROP Pro (S / M / L) » & Économie Unitaire
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Facturation Semaine (Mobile Money), Mois ou Année (2 mois offerts, déblocage séquestre
              par 1/12e mensuel).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWithVat((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showWithVat
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {showWithVat ? 'Régime Année 3 : Avec TVA 18%' : 'Régime Années 1-2 : Franchise 0% TVA'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {B2B_PRO_PACKS.map((pack) => {
            const isSelected = pack.id === selectedPackId;
            const metrics = showWithVat ? pack.withVat18 : pack.withoutVat;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedPackId(pack.id);
                }}
                className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300">
                    {pack.id.replace('_', ' ')} ({pack.multiplierVsB2c}x B2C)
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {pack.dailyHours}h/j • {pack.estimatedMonthlyTracks.toLocaleString('fr-FR')} titres
                  </span>
                </div>
                <h5 className="text-sm font-black text-white">{pack.name}</h5>
                <p className="text-[11px] text-slate-400 mt-1">{pack.targetVenues}</p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-900 p-2">
                    <p className="text-[10px] text-slate-400">Semaine</p>
                    <p className="text-xs font-bold text-white">
                      {formatFcfa(pack.weeklyPriceFcfa)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-indigo-500/20 border border-indigo-500/30 p-2">
                    <p className="text-[10px] text-indigo-300 font-bold">Mois</p>
                    <p className="text-xs font-black text-white">
                      {formatFcfa(pack.monthlyPriceFcfa)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-2">
                    <p className="text-[10px] text-emerald-400">Année (-17%)</p>
                    <p className="text-xs font-bold text-white">
                      {formatFcfa(pack.annualPriceFcfa)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base nette (après 2% Mobile Money) :</span>
                    <span className="font-bold text-white">
                      {formatFcfa(Math.round(metrics.netBase))}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>• Master Direct (48% net) :</span>
                    <span className="font-bold">
                      {formatFcfa(Math.round(metrics.masterDirect48))}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>• Redevance BUGADA (12% net) :</span>
                    <span className="font-bold">
                      {formatFcfa(Math.round(metrics.bugadaPublicPerf12))}
                    </span>
                  </div>
                  <div className="flex justify-between text-indigo-300">
                    <span>• Marge Plateforme DROP (40% net) :</span>
                    <span className="font-bold">
                      {formatFcfa(Math.round(metrics.platformShare40))}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Rémunération moyenne par titre joué :</span>
                    <span className="font-bold text-emerald-400">
                      {metrics.perTrackRoyaltyFcfa.toFixed(2)} FCFA / titre
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Remise Multi-Établissements & Device ID Binding */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              Verrouillage Matériel (1 Licence = 1 Device ID actif) & Remise Multi-Établissements
            </p>
            <p className="text-[11px] text-slate-400">
              Empêche le partage d&apos;un même compte hors-ligne sur plusieurs bars simultanément.
              Remise officielle de <strong>-20 % sur le 2e établissement</strong> et{' '}
              <strong>-25 % dès le 3e établissement</strong> d&apos;un même propriétaire.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {([1, 2, 3] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setVenueCountTier(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  venueCountTier === tier
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {tier === 1
                  ? '1er Établissement (Plein tarif)'
                  : tier === 2
                  ? '2e Établissement (-20%)'
                  : '3e+ Établissement (-25%)'}
              </button>
            ))}
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
              {selectedPack.id.replace('_', ' ')} : {formatFcfa(discountedMonthlyTtc)} / mois
            </span>
          </div>
        </div>
      </div>

      {/* 4. Levier Jukebox Social QR Code de Table (B2B2C) & Sponsoring Brasseries/Télécoms */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              3. Mode « Jukebox Social & Dédicace par QR Code de Table » + Sponsoring CHR Année 1
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Transforme chaque table de bar/maquis en canal d&apos;acquisition B2C gratuit (économie
              du CAC marketing de <strong>1 680 FCFA/abonné</strong> sur les 16,8 M FCFA budgétés) et
              en levier de dons/votes payants (200 / 500 / 1 000 FCFA via Mobile Money).
            </p>
          </div>
          <div className="flex items-center gap-2">
            {([30, 100, 250] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setActiveVenuesYear(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeVenuesYear === v
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {v === 30 ? 'Année 1 (30 bars)' : v === 100 ? 'Année 2 (100 bars)' : 'Année 3 (250 bars)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Votes Jukebox & Dédicaces Clients / Bar / Mois
              </span>
              <span className="text-sm font-black text-amber-300">
                {formatFcfa(monthlyTipPerVenue)} / mois
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={45000}
              step={5000}
              value={monthlyTipPerVenue}
              onChange={(e) => setMonthlyTipPerVenue(Number(e.target.value))}
              aria-label="Volume mensuel de votes Jukebox par bar"
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-lg bg-slate-900 p-2.5">
                <p className="text-[10px] text-slate-400">Flux Jukebox Annuel</p>
                <p className="text-xs font-black text-white">
                  {formatFcfa(annualJukeboxTipVolume)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-2.5">
                <p className="text-[10px] text-emerald-300 font-bold">Net Artistes (90%)</p>
                <p className="text-xs font-black text-emerald-300">
                  +{formatFcfa(annualArtistsNet90)}
                </p>
              </div>
              <div className="rounded-lg bg-indigo-500/15 border border-indigo-500/30 p-2.5">
                <p className="text-[10px] text-indigo-300 font-bold">Net Plateforme (8%)</p>
                <p className="text-xs font-black text-indigo-300">
                  +{formatFcfa(annualPlatformNet8)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Sponsoring B2B2C Brasseries & Télécoms dès l&apos;Année 1
              </span>
              <button
                type="button"
                onClick={() => setEnableBeverageSponsorY1((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  enableBeverageSponsorY1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {enableBeverageSponsorY1 ? 'Contrat 250k/mois Actif' : 'Inactif (0 FCFA en A1)'}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Parrainage de playlists CHR (« Ambiance Vendredi Soir », « Grillades & Détente ») avec
              jingle marque de 15s toutes les heures ou achat groupé de 50 Packs Pro S offerts aux
              maquis partenaires.
            </p>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-300">
                Revenu net Sponsoring Année 1 (après 15% frais directs) :
              </span>
              <span className="text-sm font-black text-emerald-400">
                +{formatFcfa(annualSponsorNet85)} / an
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Garde-fous Techniques (Anti-Boucle Muette Nocturne, Clock Rollback, Mode Jukebox Pro) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bloc Anti-Boucle Muette Nocturne & Sécurité Hors-Ligne */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              4. Bouclier Anti-« Boucle Muette Nocturne » & Audit HMAC
            </h4>
            <button
              type="button"
              onClick={() => setZeroVolumeGuardEnabled((v) => !v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                zeroVolumeGuardEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {zeroVolumeGuardEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Filtre Volume == 0 Actif
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" /> Filtre Désactivé (Dilution -50%)
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Si un gérant de snack (Pack Pro S à 10 000 FCFA, ouvert 12h/j = 7 200 titres/mois) coupe
            ses enceintes ou met le volume Android à zéro la nuit sans mettre en pause (24h/j =
            14 400 titres/mois), la valeur du stream chute de <strong>-50 %</strong> :
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
              <p className="text-[11px] font-bold text-emerald-300">
                Diffusion Légitime 12h/j (7 200 titres)
              </p>
              <p className="text-base font-black text-white mt-1">
                0,8167 FCFA / titre <span className="text-xs font-normal text-slate-400">(HT)</span>
              </p>
              <p className="text-[11px] text-slate-400">0,6895 FCFA / titre avec TVA 18%</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3">
              <p className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Avec 12h de Boucle Muette (14 400 titres)
              </p>
              <p className="text-base font-black text-rose-300 mt-1">
                0,4083 FCFA / titre <span className="text-xs font-normal">(-50%)</span>
              </p>
              <p className="text-[11px] text-slate-400">0,3448 FCFA / titre avec TVA 18%</p>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Vérification matérielle Audio :</strong> Toute lecture à{' '}
                <code>volume == 0</code> est marquée <code>MUTED_INVALID</code> et exclue du pot
                User-Centric.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Anti-Clock Rollback :</strong> Horloge monotone processeur{' '}
                <code>SystemClock.elapsedRealtime()</code> + chiffrement AES-128.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Heartbeat 30 jours & HMAC-SHA256 :</strong> Plafond physique de 24h/24h par
                appareil et synchronisation mensuelle obligatoire (&lt; 200 Ko).
              </span>
            </li>
          </ul>
        </div>

        {/* Console Mode Jukebox Pro & Catalogue Mixte 60% Gabon / 40% Panafricain */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              5. Console « Mode Jukebox Pro » & Catalogue Mixte CHR
            </h4>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold">
              60% Gabon (+241) / 40% Hits Panafricains
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Pour éviter que le barman ne relance YouTube en milieu de soirée, les playlists Pro
            combinent <strong>60 % de nouveautés gabonaises</strong> et{' '}
            <strong>40 % de classiques panafricains</strong> (Rumba, Afrobeats, Coupé-Décalé,
            Amapiano) couverts par les accords de réciprocité internationale du BUGADA et les
            agrégateurs licenciés.
          </p>

          <div className="space-y-3 pt-1">
            {/* Crossfade Auto-DJ */}
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5 text-indigo-400" />
                  Fondu Enchaîné Automatique (Crossfade Auto-DJ)
                </p>
                <p className="text-[11px] text-slate-400">
                  Supprime les blancs entre deux morceaux pour maintenir l&apos;ambiance du bar.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[2, 3, 4].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setCrossfadeSeconds(sec)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      crossfadeSeconds === sec
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Dayparting & Auto-Pause Fermeture */}
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Programmation Horaire & Auto-Pause Fermeture
                </p>
                <p className="text-[11px] text-slate-400">
                  12h–18h Déjeuner Afro-Jazz → 18h–02h Soirée Ntcham/Afrobeats → 02h Pause Auto.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDaypartingEnabled((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    daypartingEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {daypartingEnabled ? 'Dayparting ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => setAutoPauseClosingEnabled((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    autoPauseClosingEnabled
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {autoPauseClosingEnabled ? 'Pause 02h ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Jingle Vocal Personnalisé */}
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Jingle Vocal Promo de l&apos;Établissement (Hors-Ligne)
                </p>
                <p className="text-[11px] text-slate-400">
                  Ex : « Bienvenue au Maquis Le Phare, Happy Hour jusqu&apos;à 21h ! »
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {([30, 45] as const).map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setVenueJingleIntervalMin(min)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      venueJingleIntervalMin === min
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Toutes les {min} min
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
