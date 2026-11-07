import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Bell,
  Share2,
  Heart,
  UserPlus,
  UserCheck,
  ListPlus,
  MicVocal,
  Video,
  SlidersHorizontal,
  ArrowDownToLine,
  Check,
  X,
  Search,
  Compass,
  ChartNoAxesColumn,
  MessageCircle,
  UserRound,
  Trophy,
  Lock,
  Plus,
  Minus,
  Shuffle,
  Repeat,
  Repeat1,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Flame,
  Radio,
  Download,
} from 'lucide-react';
import {
  CoverArtwork,
  DropOfficialLogo,
  RankMedalSvg,
} from '../../../components/CoverArtwork';
import {
  triggerBeatAudioDownload,
} from '../../../services/musicService';
import {
  StudioEntityRole,
  SynchronizedMiniPlayer,
  ReusableTrackDetailSheet,
  ReusableArtistDetailSheet,
  ReusableUserProfileSheet,
  RankBadgeSvg,
  CertificationBadgeSvg,
  OfficialQrCodeSvg,
} from '../../../components/ReusableAnalyticsSheets';
import { PublicCertificationDossierModal } from '../components/PublicCertificationDossierModal';
import {
  ChartTimeframe,
  computeTrackExplosionScore,
  getTrackCertification,
  getAlbumCertification,
} from '../../../utils/rankingEngine';
import {
  CentralAdSlideshowBanner,
  formatTime,
  formatCompactPlays,
  highlightMatchedText,
  PlaylistVectorIcon,
} from '../../../components/player/playerEngineHelpers';
import type { ReturnTypeUseImmersivePlayerState } from '../hooks/useImmersivePlayerState';

export const CentralAwardsTab: React.FC<{ state: ReturnTypeUseImmersivePlayerState }> = ({ state }) => {
  const {
    catalogue, albumIdx, trackIdx, currentTrack, currentTime, isPlaying, isDropMode,
    likedTrackIds, recommendedTrackIds, subscribedArtists, artistSubscribers,
    communityRecommendations, trackRankMap, users, currentUser, categories,
    userPlan, subscriptionPass, onChangeSubscriptionPass, networkOperator,
    onChangeNetworkOperator, lastEcgValidationMsg, unreadNotificationsCount,
    onOpenNotifications, adBanners, adBannerSettings, enableAwardsCeremony,
    rightsLines, payoutStatements, royaltySettings, onToggleUserPlan, onTogglePlay,
    onSelectAlbumIndex, onNavigateTrack, onToggleLike, onRecommendTrack,
    onToggleSubscribeArtist, onOpenAdminStudio, onConfirmCreditHandshake,
    onOpenCreditDispute, onResolveCreditDispute, safeRankInfo, isPro,
    setActiveModal, hubTab, setHubTab, centralFullPageView, setCentralFullPageView,
    hubGenreFilter, setHubGenreFilter, hubRankDimension, setHubRankDimension,
    chartTimeframe, setChartTimeframe, awardsSubView, setAwardsSubView,
    blindRoleFilter, setBlindRoleFilter, customJuryScores, setCustomJuryScores,
    blindCriteriaDraft, setBlindCriteriaDraft, customPublicVotes, setCustomPublicVotes,
    votesUsedToday, setVotesUsedToday, hubTeamRoleFilter, setHubTeamRoleFilter,
    hubSearchQuery, setHubSearchQuery, searchInputRef, showToast,
    openUserTrackSheet, openUserEntitySheet, openUserListenerSheet,
    closeAllAnalyticsSheets, handlePlayOrToggleSpecificTrack, analyticsCatalogue,
    allTracksFlat, availableGenres, decoupledStudioRankings, blindTestDossiers,
    dropAwardsList, maxDailyVotes, remainingDailyVotes, activeTrackSheetData,
    activeEntitySheetData, activeUserSheetData, instantSearchResults, playlists,
    newPlaylistInput, setNewPlaylistInput, handleCreatePlaylist, handleDeletePlaylist,
    handleToggleTrackInPlaylist, hasOpenAnalyticsSheet,
  } = state;
  const [dossierCert, setDossierCert] = React.useState<{ cert: any; title: string; artist: string; coverUrl?: string; artworkType?: any } | null>(null);
  return (
    <>
                  {hubTab === 'AWARDS' && (
                    <div className="space-y-3.5 animate-fade-in">
                      {/* Sous-Navigation des Awards : 1. Palmarès & Vote Public (+241) | 2. Jury à l'Aveugle (-14 LUFS) | 3. Registre National & QR */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#07090E]/90 border border-white/10 rounded-2xl p-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                          {(
                            [
                              {
                                id: 'PALMARES',
                                label:
                                  '10 Catégories & Vote Public',
                              },
                              {
                                id: 'BLIND_TEST',
                                label:
                                  'Module « Jury à l’Aveugle »',
                              },
                              {
                                id: 'CERTIFICATIONS',
                                label:
                                  'Registre National & QR Codes',
                              },
                            ] as const
                          ).map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setAwardsSubView(sub.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                awardsSubView === sub.id
                                  ? 'bg-amber-400 text-black'
                                  : 'bg-white/5 text-zinc-300 hover:text-white'
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] font-mono px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                          <span>OTP +241 Vérifié</span>
                          <span>•</span>
                          <span>
                            Quota Vote : {remainingDailyVotes}/{maxDailyVotes}{' '}
                            restant(s) aujourd&apos;hui
                          </span>
                        </div>
                      </div>

                      {/* SOUS-VUE 1 : LES 10 CATÉGORIES OFFICIELLES (GRILLES A 50/25/25 & B 50/35/15) + VOTE PUBLIC */}
                      {awardsSubView === 'PALMARES' && (
                        <div className="space-y-3">
                          <div className="p-2.5 rounded-xl bg-[#07090E]/85 border border-white/10 text-[11px] text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                            <span>
                              Période d&apos;éligibilité : <strong>1er Nov N-1 – 31 Oct N</strong> •{' '}
                              <strong className="text-amber-300">
                                Grille A (Artistique) : 50% Algo / 25% Jury / 25% Public
                              </strong>{' '}
                              •{' '}
                              <strong className="text-cyan-300">
                                Grille B (Artisans) : 50% Algo / 35% Blind Test / 15% Public
                              </strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {dropAwardsList.map((award) => (
                              <div
                                key={award.id}
                                className="p-3.5 rounded-2xl bg-[#07090E]/90 border border-white/10 flex flex-col justify-between gap-3"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        award.scoringGrid ===
                                        'GRILLE_B_TECHNIQUE_BLIND'
                                          ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/40'
                                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                      }`}
                                    >
                                      {award.criteriaBadge} (
                                      {award.algoWeightPct}% /{' '}
                                      {award.juryWeightPct}% /{' '}
                                      {award.publicWeightPct}%)
                                    </span>
                                    {award.winner.certification && (
                                      <CertificationBadgeSvg
                                        cert={award.winner.certification}
                                        compact
                                      />
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white mt-1.5">
                                    {award.title}
                                  </h4>
                                  <p className="text-[11px] text-[#A3A9BA] mt-0.5">
                                    {award.subtitle}
                                  </p>
                                  <p className="text-[10px] font-mono text-amber-200/80 mt-1">
                                    {award.eligibilityRuleText}
                                  </p>
                                </div>

                                {/* Lauréat #1 */}
                                <div
                                  onClick={() => {
                                    if (award.winner.trackId) {
                                      openUserTrackSheet(award.winner.trackId);
                                    } else if (award.winner.entityRole) {
                                      openUserEntitySheet(
                                        award.winner.name,
                                        award.winner.entityRole
                                      );
                                    }
                                  }}
                                  className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-amber-400/20 transition"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-amber-300/40">
                                      <CoverArtwork
                                        artworkType={award.winner.artworkType}
                                        coverUrl={award.winner.cover}
                                        title={award.winner.name}
                                        artist={award.winner.secondaryName}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[10px] font-mono font-bold text-amber-300 block">
                                        LAURÉAT EN TÊTE #1
                                      </span>
                                      <p className="text-xs font-bold text-white truncate">
                                        {award.winner.name}
                                      </p>
                                      <p className="text-[10px] text-zinc-300 truncate">
                                        {award.winner.secondaryName}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono shrink-0">
                                    <span className="text-xs font-extrabold text-amber-300 block">
                                      {award.winner.scoreLabel}
                                    </span>
                                    <span className="text-[9.5px] text-zinc-300">
                                      Algo {award.winner.algoScore} | Jury{' '}
                                      {award.winner.juryScore} | Pub{' '}
                                      {award.winner.publicScore}
                                    </span>
                                  </div>
                                </div>

                                {/* Nominés & Bouton Vote Public In-App (+241) */}
                                <div className="space-y-1.5">
                                  {award.nominees.map((nom) => {
                                    const voteKey = `${award.id}:${nom.trackId || nom.name}`;
                                    return (
                                      <div
                                        key={`${award.id}-${nom.rank}-${nom.name}`}
                                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#07090E]/45 border border-white/5 text-xs"
                                      >
                                        <div
                                          onClick={() => {
                                            if (nom.trackId) {
                                              openUserTrackSheet(nom.trackId);
                                            } else if (nom.entityRole) {
                                              openUserEntitySheet(
                                                nom.name,
                                                nom.entityRole
                                              );
                                            }
                                          }}
                                          className="min-w-0 flex-1 cursor-pointer hover:text-amber-300 transition"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <strong className="text-amber-300 font-mono">
                                              #{nom.rank}
                                            </strong>
                                            <span className="text-white font-semibold truncate">
                                              {nom.name}
                                            </span>
                                            {nom.blindDossierCode && (
                                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[9px] font-mono">
                                                {nom.blindDossierCode}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] font-mono text-[#A3A9BA] block truncate">
                                            {nom.metricDetail} •{' '}
                                            {nom.publicVotesCount} votes +241
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="font-mono text-[11px] font-bold text-amber-200">
                                            {nom.finalHybridScore}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (remainingDailyVotes <= 0) {
                                                showToast(
                                                  `Quota quotidien atteint (${maxDailyVotes}/${maxDailyVotes} votes/jour pour votre Pass)`,
                                                  'bg-rose-500'
                                                );
                                                return;
                                              }
                                              setCustomPublicVotes((prev) => ({
                                                ...prev,
                                                [voteKey]:
                                                  (prev[voteKey] || 0) + 1,
                                              }));
                                              setVotesUsedToday((v) => v + 1);
                                              showToast(
                                                `Vote +241 enregistré pour ${nom.name} !`,
                                                'bg-emerald-400'
                                              );
                                            }}
                                            className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold transition"
                                          >
                                            Voter +1
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SOUS-VUE 2 : MODULE « JURY À L'AVEUGLE » (BLIND TEST -14 LUFS — GRILLE B 35%) */}
                      {awardsSubView === 'BLIND_TEST' && (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0B121E] to-[#110D1B] border border-cyan-400/35 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 block">
                                  Pilier IV.3 — Protocole « Jury à l&apos;Aveugle » (Anti-Copinage • Grille B 35%)
                                </span>
                                <h3 className="text-sm font-bold text-white">
                                  Écoute Anonymisée de Packs de 3 Titres Normalisés
                                </h3>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-[10.5px]">
                                <span>Conflit d&apos;intérêts : 0 détecté</span>
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300">
                              Les noms d&apos;artistes, pochettes et studios sont masqués. Notez chaque dossier anonyme sur 20 points : la note met immédiatement à jour la composante Jury (35%) de la Grille B.
                            </p>

                            <div className="flex items-center gap-1.5 pt-1">
                              {(
                                [
                                  {
                                    id: 'BEATMAKER',
                                    label: '5. Beatmaker de l’Année',
                                  },
                                  {
                                    id: 'ENGINEER',
                                    label: '6. Ingénieur du Son de l’Année',
                                  },
                                  {
                                    id: 'LYRICIST',
                                    label: '7. Parolier / Plume de l’Année',
                                  },
                                ] as const
                              ).map((rTab) => (
                                <button
                                  key={rTab.id}
                                  type="button"
                                  onClick={() => setBlindRoleFilter(rTab.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    blindRoleFilter === rTab.id
                                      ? 'bg-cyan-400 text-black'
                                      : 'bg-white/10 text-zinc-300 hover:text-white'
                                  }`}
                                >
                                  {rTab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {blindTestDossiers
                              .filter((d) => d.role === blindRoleFilter)
                              .map((dossier) => {
                                const awardId =
                                  dossier.role === 'BEATMAKER'
                                    ? 'award-beatmaker-year'
                                    : dossier.role === 'ENGINEER'
                                      ? 'award-engineer-year'
                                      : 'award-lyricist-year';
                                const scoreKey = `${awardId}:${dossier.realCandidateName}`;
                                const currentCriteria = blindCriteriaDraft[
                                  dossier.dossierId
                                ] || [4.5, 4.5, 4.5, 4.5];
                                const total20 =
                                  Math.round(
                                    currentCriteria.reduce((a, b) => a + b, 0) *
                                      10
                                  ) / 10;

                                return (
                                  <div
                                    key={dossier.dossierId}
                                    className="p-3.5 rounded-2xl bg-[#07080C] border border-cyan-400/25 flex flex-col justify-between gap-3"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-lg bg-cyan-400/20 text-cyan-200 font-mono text-xs font-extrabold">
                                          {dossier.anonymousCode}
                                        </span>
                                        <span className="text-[10px] font-mono text-emerald-400">
                                          Master : Normalisé Studio
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-[#A3A9BA] font-mono">
                                        Identité &amp; Studio masqués (Blind Test actif)
                                      </p>

                                      {/* Pack de 3 pistes anonymes écoutables */}
                                      <div className="space-y-1.5 pt-1">
                                        {dossier.tracksPack.map((tp) => {
                                          const found = allTracksFlat.find(
                                            (m) => m.track.id === tp.trackId
                                          );
                                          const isPlayingThis =
                                            currentTrack.id === tp.trackId &&
                                            isPlaying;
                                          return (
                                            <button
                                              key={tp.trackId}
                                              type="button"
                                              onClick={() => {
                                                if (found) {
                                                  handlePlayOrToggleSpecificTrack(
                                                    found.albumIndex,
                                                    found.trackIndex
                                                  );
                                                }
                                              }}
                                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#07090E]/90 hover:bg-cyan-400/15 border border-white/10 text-xs transition"
                                            >
                                              <span className="font-mono text-white font-semibold inline-flex items-center gap-1.5">
                                                {isPlayingThis ? (
                                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                                ) : (
                                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                                )}
                                                <span>{tp.slotLabel} ({tp.genre})</span>
                                              </span>
                                              <span className="text-[10px] font-mono text-cyan-300">
                                                Normalisé
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Grille de Notation /20 (4 critères sur 5 pts) */}
                                    <div className="space-y-2 pt-2 border-t border-white/10">
                                      {dossier.criteriaLabels.map(
                                        (cLabel, cIdx) => (
                                          <div
                                            key={cLabel}
                                            className="space-y-0.5"
                                          >
                                            <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                                              <span className="truncate">
                                                {cLabel}
                                              </span>
                                              <span className="text-amber-300 font-bold">
                                                {currentCriteria[cIdx]} / 5
                                              </span>
                                            </div>
                                            <input
                                              type="range"
                                              min={1}
                                              max={5}
                                              step={0.5}
                                              value={currentCriteria[cIdx]}
                                              onChange={(e) => {
                                                const val = parseFloat(
                                                  e.target.value
                                                );
                                                const next: [
                                                  number,
                                                  number,
                                                  number,
                                                  number,
                                                ] = [...currentCriteria] as [
                                                  number,
                                                  number,
                                                  number,
                                                  number,
                                                ];
                                                next[cIdx] = val;
                                                setBlindCriteriaDraft(
                                                  (prev) => ({
                                                    ...prev,
                                                    [dossier.dossierId]: next,
                                                  })
                                                );
                                                const sum20 = next.reduce(
                                                  (a, b) => a + b,
                                                  0
                                                );
                                                setCustomJuryScores((prev) => ({
                                                  ...prev,
                                                  [scoreKey]: sum20,
                                                }));
                                              }}
                                              className="w-full accent-cyan-400 cursor-pointer h-1.5"
                                            />
                                          </div>
                                        )
                                      )}

                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs font-mono font-bold text-cyan-300">
                                          Note Jury : {total20} / 20
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCustomJuryScores((prev) => ({
                                              ...prev,
                                              [scoreKey]: total20,
                                            }));
                                            showToast(
                                              `Note Jury à l’Aveugle (${total20}/20) validée pour ${dossier.anonymousCode}`,
                                              'bg-cyan-400'
                                            );
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-[11px] transition"
                                        >
                                          Valider {total20}/20
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* SOUS-VUE 3 : REGISTRE NATIONAL DES CERTIFICATIONS ECG & QR CODE SHA-256 */}
                      {awardsSubView === 'CERTIFICATIONS' && (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-900 to-cyan-500/10 border border-amber-400/35 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                                  Pilier III — Registre Public des Certifications Nationales (Gabon ≥ 70% ECG • Audit 72h)
                                </span>
                                <h3 className="text-sm font-bold text-white">
                                  Singles (100K/250K/500K) • Albums Anti-Locomotive (300K/750K/1,5M) • Disques d&apos;Artisan (500K/1,25M/2,5M)
                                </h3>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {allTracksFlat.map(
                                ({ track: t }) => {
                                  const cert = getTrackCertification(
                                    t.realPlays,
                                    t.gabonTerritoryPct ?? 86,
                                    t.id
                                  );
                                  if (cert.level === 'NONE') return null;
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() => setDossierCert({ cert, title: t.title, artist: t.artist, coverUrl: t.cover, artworkType: t.artworkType })}
                                      className="p-3 rounded-xl bg-[#07090E]/65 hover:bg-[#07090E]/80 border border-white/15 flex items-center justify-between gap-3 cursor-pointer transition hover:border-amber-400/40"
                                    >
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <CertificationBadgeSvg
                                            cert={cert}
                                            compact
                                          />
                                          <span className="text-[10px] font-mono text-emerald-400">
                                            Gabon {t.gabonTerritoryPct ?? 86}% • Audit 72h OK
                                          </span>
                                        </div>
                                        <p className="text-xs font-bold text-white truncate">
                                          {t.title} — {t.artist}
                                        </p>
                                        <p className="text-[10px] font-mono text-[#A3A9BA] truncate">
                                          {t.realPlays.toLocaleString('fr-FR')} ECG •{' '}
                                          {cert.certificateHash}
                                        </p>
                                        <p className="text-[10px] text-amber-200/90 truncate">
                                          Co-Certifiés : Beatmaker {t.beatmakerName} • Mix {t.mixingEngineerName || t.soundEngineerName} • Plume {t.lyricistName || t.artist}
                                        </p>
                                      </div>
                                      <OfficialQrCodeSvg
                                        hash={cert.certificateHash}
                                        size={58}
                                      />
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

      <PublicCertificationDossierModal
        isOpen={Boolean(dossierCert)}
        cert={dossierCert?.cert ?? null}
        entityTitle={dossierCert?.title}
        entityArtist={dossierCert?.artist}
        coverUrl={dossierCert?.coverUrl}
        artworkType={dossierCert?.artworkType}
        onClose={() => setDossierCert(null)}
      />
    </>
  );
};
