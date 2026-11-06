import React, { useState, useEffect } from 'react';
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
  Save,
} from 'lucide-react';
import {
  B2B_PRO_PACKS,
  B2B_DILUTION_COMPARISON,
  type B2bProPackSpec,
} from '../economics/monthlyTreasury36M';
import { formatFcfa } from '../economics/formatters';

const B2B_STORAGE_KEY = 'drop_b2b_horeca_settings_v1';

interface SavedB2bConfig {
  selectedPackId: B2bProPackSpec['id'];
  showWithVat: boolean;
  venueCountTier: 1 | 2 | 3;
  activeVenuesYear: 30 | 100 | 250;
  monthlyTipPerVenue: number;
  enableBeverageSponsorY1: boolean;
  crossfadeSeconds: number;
  daypartingEnabled: boolean;
  autoPauseClosingEnabled: boolean;
  zeroVolumeGuardEnabled: boolean;
  venueJingleIntervalMin: 30 | 45;
}

function loadB2bConfig(): Partial<SavedB2bConfig> {
  try {
    const raw = window.localStorage.getItem(B2B_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedB2bConfig>) : {};
  } catch {
    return {};
  }
}

export interface B2bHorecaBugadaPanelProps {
  onSaveAndSyncAll?: (sectionLabel?: string) => void;
}

export const B2bHorecaBugadaPanel: React.FC<B2bHorecaBugadaPanelProps> = ({
  onSaveAndSyncAll,
}) => {
  const initial = loadB2bConfig();

  const [selectedPackId, setSelectedPackId] = useState<B2bProPackSpec['id']>(
    initial.selectedPackId ?? 'PRO_M'
  );
  const [showWithVat, setShowWithVat] = useState<boolean>(initial.showWithVat ?? false);
  const [venueCountTier, setVenueCountTier] = useState<1 | 2 | 3>(
    initial.venueCountTier ?? 1
  );

  // Simulateur Jukebox Social QR & Sponsoring B2B2C
  const [activeVenuesYear, setActiveVenuesYear] = useState<30 | 100 | 250>(
    initial.activeVenuesYear ?? 30
  );
  const [monthlyTipPerVenue, setMonthlyTipPerVenue] = useState<number>(
    initial.monthlyTipPerVenue ?? 15_000
  );
  const [enableBeverageSponsorY1, setEnableBeverageSponsorY1] = useState<boolean>(
    initial.enableBeverageSponsorY1 ?? true
  );

  // Contrôles techniques Jukebox Pro & Anti-Fraude
  const [crossfadeSeconds, setCrossfadeSeconds] = useState<number>(
    initial.crossfadeSeconds ?? 3
  );
  const [daypartingEnabled, setDaypartingEnabled] = useState<boolean>(
    initial.daypartingEnabled ?? true
  );
  const [autoPauseClosingEnabled, setAutoPauseClosingEnabled] = useState<boolean>(
    initial.autoPauseClosingEnabled ?? true
  );
  const [zeroVolumeGuardEnabled, setZeroVolumeGuardEnabled] = useState<boolean>(
    initial.zeroVolumeGuardEnabled ?? true
  );
  const [venueJingleIntervalMin, setVenueJingleIntervalMin] = useState<30 | 45>(
    initial.venueJingleIntervalMin ?? 30
  );
  const [inspectQrModalOpen, setInspectQrModalOpen] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const payload: SavedB2bConfig = {
        selectedPackId,
        showWithVat,
        venueCountTier,
        activeVenuesYear,
        monthlyTipPerVenue,
        enableBeverageSponsorY1,
        crossfadeSeconds,
        daypartingEnabled,
        autoPauseClosingEnabled,
        zeroVolumeGuardEnabled,
        venueJingleIntervalMin,
      };
      window.localStorage.setItem(B2B_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota
    }
  }, [
    selectedPackId,
    showWithVat,
    venueCountTier,
    activeVenuesYear,
    monthlyTipPerVenue,
    enableBeverageSponsorY1,
    crossfadeSeconds,
    daypartingEnabled,
    autoPauseClosingEnabled,
    zeroVolumeGuardEnabled,
    venueJingleIntervalMin,
  ]);

  const handleSaveB2bSettings = () => {
    onSaveAndSyncAll?.('Offre Pro B2B HORECA × BUGADA');
    setSavedNotice(
      `Paramètres B2B (${selectedPackId.replace('_', ' ')}, Crossfade ${crossfadeSeconds}s, Jingle ${venueJingleIntervalMin}m) sauvegardés et synchronisés.`
    );
    window.setTimeout(() => setSavedNotice(null), 4000);
  };

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
    <div className="space-y-4">
      {/* 1. Bandeau Guichet Unique DROP × BUGADA + Boutons d'Action Symétriques */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-emerald-500/10 border border-amber-500/30 p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>VERTICALE B2B HORECA • GUICHET UNIQUE DROP × BUGADA (+241)</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Offre Professionnelle Bars, Maquis, Snacks, Restaurants &amp; Hôtels
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Conforme à l&apos;<strong>Ordonnance n°0011/PR/2024</strong> et au{' '}
              <strong>Décret n°0282/PR/MCJSA</strong> (campagne nationale de contrôle BUGADA &amp;
              suivi GMC-SA). Chaque Pack Pro ventile <strong>60 % du net</strong> en{' '}
              <span className="text-emerald-300 font-bold">48 % Master Direct</span> et{' '}
              <span className="text-amber-300 font-bold">
                12 % Redevance Communication Publique BUGADA
              </span>
              .
            </p>
          </div>

          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleSaveB2bSettings}
              className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>Sauvegarder Configuration B2B</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectQrModalOpen((v) => !v)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>
                {inspectQrModalOpen ? 'Masquer Certificat QR BUGADA' : 'Simuler Contrôle QR BUGADA'}
              </span>
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {savedNotice}
            </span>
          </div>
        )}

        {inspectQrModalOpen && (
          <div className="rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>MACARON OFFICIEL « ÉTABLISSEMENT PARTENAIRE DROP × BUGADA » VÉRIFIÉ</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong>Établissement :</strong> Le Phare Lounge &amp; Grill (Louis, Libreville) •{' '}
                <strong>Licence :</strong> #GA-BUGADA-2026-PRO-M-0412
              </p>
              <p className="text-xs text-slate-400">
                <strong>Dernier Heartbeat Réseau (&lt; 30 j) :</strong> Synchronisé il y a 4 jours
                (9 420 lectures ISRC certifiées HMAC-SHA256) • <strong>Device ID lié :</strong>{' '}
                TAB-LENOVO-LB-9941A.
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Statut Inspection</p>
              <p className="text-sm font-black text-white mt-0.5">CONFORME &amp; À JOUR</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quittance 12% BUGADA &amp; 48% Master payée
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Comparateur de Dilution User-Centric (Cartes symétriques Mobile/Tablette + Tableau Desktop) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-3">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            1. Mathématique des Boucles en User-Centric : Pourquoi l&apos;abonnement B2C (1 500
            FCFA) est interdit aux Bars
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Un établissement diffusant 12h à 24h/jour joue 18x à 36x plus de titres qu&apos;un
            particulier (20h/mois), ce qui écraserait la rémunération par titre à 0,05 FCFA sans les
            Packs Pro.
          </p>
        </div>

        {/* Vue Cartes Symétriques 2x2 pour Mobile, Tablette et Petit Écran (Zéro débordement horizontal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {B2B_DILUTION_COMPARISON.map((row) => (
            <div
              key={row.profile}
              className="rounded-xl bg-slate-950/85 border border-slate-800 p-3.5 flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{row.profile}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[10px] font-black">
                    {row.volumeVsB2c}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {row.dailyHours} ({row.monthlyHours}h/mois) •{' '}
                  <strong className="text-slate-200">
                    {row.monthlyTracks.toLocaleString('fr-FR')} titres
                  </strong>
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center justify-between text-rose-300">
                  <span>Sur tarif 1 500 FCFA :</span>
                  <span className="font-bold">
                    {row.dilutedRoyaltyAt1500WithoutVat.toFixed(2)} FCFA/titre
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Avec Pack Pro :</span>
                  <span className="font-black">
                    {row.restoredRoyaltyWithoutVat.toFixed(2)} FCFA/titre
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-indigo-300 pt-0.5">
                  → {row.recommendedPack}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Grille Tarifaire Packs Pro S / M / L + Remise Multi-Établissements */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              2. Grille Tarifaire « Packs DROP Pro (S / M / L) » &amp; Économie Unitaire
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Facturation Semaine (Mobile Money), Mois ou Année (2 mois offerts, déblocage séquestre
              par 1/12e mensuel).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWithVat((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              showWithVat
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {showWithVat
              ? 'Régime Année 3 : Avec TVA 18%'
              : 'Régime Années 1-2 : Franchise 0% TVA'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300">
                      {pack.id.replace('_', ' ')} ({pack.multiplierVsB2c}x B2C)
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {pack.dailyHours}h/j • {pack.estimatedMonthlyTracks.toLocaleString('fr-FR')}{' '}
                      titres
                    </span>
                  </div>
                  <h5 className="text-sm font-black text-white">{pack.name}</h5>
                  <p className="text-[11px] text-slate-400 mt-1">{pack.targetVenues}</p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-center">
                    <div className="rounded-lg bg-slate-900 p-2">
                      <p className="text-[10px] text-slate-400">Semaine</p>
                      <p className="text-[11px] font-bold text-white">
                        {formatFcfa(pack.weeklyPriceFcfa)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-indigo-500/20 border border-indigo-500/30 p-2">
                      <p className="text-[10px] text-indigo-300 font-bold">Mois</p>
                      <p className="text-[11px] font-black text-white">
                        {formatFcfa(pack.monthlyPriceFcfa)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-900 p-2">
                      <p className="text-[10px] text-emerald-400">Année (-17%)</p>
                      <p className="text-[11px] font-bold text-white">
                        {formatFcfa(pack.annualPriceFcfa)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs pt-2 border-t border-slate-800/60">
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
                    <span>Rémunération / titre joué :</span>
                    <span className="font-bold text-emerald-400">
                      {metrics.perTrackRoyaltyFcfa.toFixed(2)} FCFA / titre
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Remise Multi-Établissements & Device ID Binding en Grille Symétrique */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Verrouillage Matériel (1 Licence = 1 Device ID actif) &amp; Remise
                  Multi-Établissements
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Empêche le partage d&apos;un même compte hors-ligne sur plusieurs bars. Remise de{' '}
                <strong>-20 % sur le 2e établissement</strong> et{' '}
                <strong>-25 % dès le 3e établissement</strong>.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black text-center shrink-0">
              {selectedPack.id.replace('_', ' ')} : {formatFcfa(discountedMonthlyTtc)} / mois
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setVenueCountTier(tier)}
                className={`py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                  venueCountTier === tier
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {tier === 1
                  ? '1er Établissement (Plein tarif)'
                  : tier === 2
                  ? '2e Établissement (-20%)'
                  : '3e+ Établissement (-25%)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Levier Jukebox Social QR Code de Table (B2B2C) & Sponsoring Brasseries/Télécoms */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                3. Mode « Jukebox Social &amp; Dédicace par QR Code de Table » + Sponsoring CHR
                Année 1
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Transforme chaque table de bar/maquis en canal d&apos;acquisition B2C gratuit (économie
              du CAC marketing de <strong>1 680 FCFA/abonné</strong> sur les 16,8 M FCFA budgétés) et
              en levier de dons/votes payants (200 / 500 / 1 000 FCFA via Mobile Money).
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 shrink-0">
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
                {v === 30 ? 'An 1 (30 bars)' : v === 100 ? 'An 2 (100 bars)' : 'An 3 (250 bars)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Votes Jukebox &amp; Dédicaces / Bar / Mois</span>
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-300 shrink-0">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center">
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

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300">
                  Sponsoring B2B2C Brasseries &amp; Télécoms dès l&apos;Année 1
                </span>
                <button
                  type="button"
                  onClick={() => setEnableBeverageSponsorY1((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer shrink-0 ${
                    enableBeverageSponsorY1
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {enableBeverageSponsorY1 ? 'Contrat 250k/mois Actif' : 'Inactif (0 FCFA en A1)'}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parrainage de playlists CHR (« Ambiance Vendredi Soir », « Grillades &amp; Détente »)
                avec jingle marque de 15s toutes les heures ou achat groupé de 50 Packs Pro S offerts
                aux maquis partenaires.
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-2.5 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300">
                Revenu net Sponsoring Année 1 (après 15% frais directs) :
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 shrink-0">
                +{formatFcfa(annualSponsorNet85)} / an
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Garde-fous Techniques (Anti-Boucle Muette Nocturne, Clock Rollback, Mode Jukebox Pro) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bloc Anti-Boucle Muette Nocturne & Sécurité Hors-Ligne */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>4. Bouclier Anti-« Boucle Muette Nocturne » &amp; Audit HMAC</span>
            </h4>
            <button
              type="button"
              onClick={() => setZeroVolumeGuardEnabled((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Avec 12h Boucle Muette (14 400
                titres)
              </p>
              <p className="text-base font-black text-rose-300 mt-1">
                0,4083 FCFA / titre <span className="text-xs font-normal">(-50%)</span>
              </p>
              <p className="text-[11px] text-slate-400">0,3448 FCFA / titre avec TVA 18%</p>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Vérification matérielle Audio :</strong> Toute lecture à{' '}
                <code>volume == 0</code> est marquée <code>MUTED_INVALID</code> et exclue du pot
                User-Centric.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Anti-Clock Rollback :</strong> Horloge monotone processeur{' '}
                <code>SystemClock.elapsedRealtime()</code> + chiffrement AES-128.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Heartbeat 30 jours &amp; HMAC-SHA256 :</strong> Plafond physique de 24h/24h
                par appareil et synchronisation mensuelle obligatoire (&lt; 200 Ko).
              </span>
            </li>
          </ul>
        </div>

        {/* Console Mode Jukebox Pro & Catalogue Mixte 60% Gabon / 40% Panafricain */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>5. Console « Mode Jukebox Pro » &amp; Catalogue Mixte CHR</span>
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
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Fondu Enchaîné Automatique (Crossfade Auto-DJ)</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Supprime les blancs entre deux morceaux pour maintenir l&apos;ambiance du bar.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-1.5 shrink-0">
                {[2, 3, 4].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setCrossfadeSeconds(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
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
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Programmation Horaire &amp; Auto-Pause Fermeture</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  12h–18h Déjeuner Afro-Jazz → 18h–02h Soirée Ntcham/Afrobeats → 02h Pause Auto.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDaypartingEnabled((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
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
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
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
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Jingle Vocal Promo de l&apos;Établissement (Hors-Ligne)</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Ex : « Bienvenue au Maquis Le Phare, Happy Hour jusqu&apos;à 21h ! »
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 shrink-0">
                {([30, 45] as const).map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setVenueJingleIntervalMin(min)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      venueJingleIntervalMin === min
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Toutes les {min}m
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
