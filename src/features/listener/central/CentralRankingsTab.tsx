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
  Sparkles,
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

export const CentralRankingsTab: React.FC<{ state: ReturnTypeUseImmersivePlayerState }> = ({ state }) => {
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
  return (
    <>
                  {hubTab === 'RANGS' && (
                    <div className="space-y-3.5 animate-fade-in">
                      {/* Sélecteur de Période (7j / 30j / Annuel) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#07090E]/85 border border-white/10 rounded-2xl p-2.5">
                        <span className="text-xs font-bold text-white px-1">
                          Classements Officiels
                        </span>
                        <div className="flex items-center gap-1">
                          {(
                            [
                              { id: 'WEEKLY_7D', label: '7 Jours' },
                              { id: 'MONTHLY_30D', label: '30 Jours' },
                              { id: 'ANNUAL_365D', label: 'Annuel' },
                            ] as { id: ChartTimeframe; label: string }[]
                          ).map((tf) => (
                            <button
                              key={tf.id}
                              type="button"
                              onClick={() => setChartTimeframe(tf.id)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                                chartTimeframe === tf.id
                                  ? 'bg-[#e11d38] text-white'
                                  : 'bg-white/5 text-[#A3A9BA] hover:text-white'
                              }`}
                            >
                              {tf.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Onglets par catégorie de classement (libellés simples pour les utilisateurs) */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {(
                          [
                            { id: 'ALL', label: 'Top Chansons' },
                            { id: 'ARTIST', label: 'Top Artistes' },
                            { id: 'BEATMAKER', label: 'Top Beatmakers' },
                            { id: 'ENGINEER', label: 'Top Ingénieurs Son' },
                            { id: 'LYRICIST', label: 'Top Auteurs' },
                            { id: 'LABEL', label: 'Top Labels' },
                            { id: 'CATEGORY', label: 'Par Genre' },
                          ] as const
                        ).map((dim) => (
                          <button
                            key={dim.id}
                            type="button"
                            onClick={() => setHubRankDimension(dim.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                              hubRankDimension === dim.id
                                ? 'bg-amber-400 text-black font-bold'
                                : 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {dim.label}
                          </button>
                        ))}
                      </div>

                      {hubRankDimension === 'ALL' ? (
                        <div className="space-y-2">
                          {[...allTracksFlat]
                            .map((item) => ({
                              ...item,
                              explosion: computeTrackExplosionScore(
                                item.track,
                                chartTimeframe
                              ),
                              cert: getTrackCertification(
                                item.track.realPlays,
                                item.track.gabonTerritoryPct ?? 86,
                                item.track.id
                              ),
                            }))
                            .sort(
                              (a, b) =>
                                b.explosion.explosionScore -
                                a.explosion.explosionScore
                            )
                            .map(
                              (
                                {
                                  track: t,
                                  albumIndex,
                                  trackIndex,
                                  explosion,
                                  cert,
                                },
                                idx
                              ) => {
                                const rInfo = trackRankMap[t.id] || {
                                  rank: idx + 1,
                                  delta: 0,
                                };
                                const isThisPlaying =
                                  currentTrack.id === t.id && isPlaying;
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() =>
                                      handlePlayOrToggleSpecificTrack(
                                        albumIndex,
                                        trackIndex
                                      )
                                    }
                                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-[#07090E]/90 hover:bg-white/[0.08] border border-white/10 cursor-pointer transition"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <RankBadgeSvg
                                        rank={idx + 1}
                                        delta={rInfo.delta}
                                      />
                                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                        <span className="absolute inset-0 bg-[#07090E]/45 flex items-center justify-center text-white text-xs">
                                          {isThisPlaying ? (
                                            <Pause className="w-3.5 h-3.5 fill-current" />
                                          ) : (
                                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <p className="text-xs font-bold text-white truncate">
                                            {t.title}
                                          </p>
                                          <CertificationBadgeSvg
                                            cert={cert}
                                            compact
                                          />
                                          {explosion.decayPenaltyPct > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[9px] font-mono shrink-0">
                                              Usure : -{explosion.decayPenaltyPct}%
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-[#A3A9BA] truncate">
                                          {t.artist}
                                          {t.featuringArtists &&
                                          t.featuringArtists.length > 0
                                            ? ` feat. ${t.featuringArtists.join(', ')}`
                                            : ''}{' '}
                                          • {formatCompactPlays(t.realPlays)} ECG
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                                        {explosion.explosionScore} pts
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openUserTrackSheet(t.id);
                                        }}
                                        className="w-7 h-7 rounded-lg text-[#A3A9BA] hover:text-amber-300 hover:bg-white/10 flex items-center justify-center transition"
                                        title="Ouvrir la fiche analytique"
                                        aria-label={`Ouvrir la fiche analytique de ${t.title}`}
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                        </div>
                      ) : hubRankDimension === 'CATEGORY' ? (
                        <div className="space-y-2">
                          {availableGenres.map((genre, idx) => {
                            const tracksInGenre = allTracksFlat.filter(
                              (m) => m.track.category === genre
                            );
                            const totalPlays = tracksInGenre.reduce(
                              (acc, m) => acc + m.track.realPlays,
                              0
                            );
                            return (
                              <div
                                key={genre}
                                onClick={() => {
                                  setHubGenreFilter(genre);
                                  setHubTab('EXPLORER');
                                }}
                                className="flex items-center justify-between p-3 rounded-2xl bg-[#07090E]/90 hover:bg-white/[0.08] border border-white/10 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-3">
                                  <RankBadgeSvg rank={idx + 1} delta={0} />
                                  <div>
                                    <p className="text-xs font-bold text-white">
                                      {genre}
                                    </p>
                                    <p className="text-[11px] text-[#A3A9BA]">
                                      {tracksInGenre.length} titre(s) •{' '}
                                      {formatCompactPlays(totalPlays)} ECG cumulées
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-amber-300 font-semibold">
                                  Explorer →
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {decoupledStudioRankings
                            .filter((ent) => ent.role === hubRankDimension)
                            .map((ent, idx) => (
                              <div
                                key={ent.key}
                                onClick={() =>
                                  openUserEntitySheet(ent.name, ent.role)
                                }
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#07090E]/90 hover:bg-white/[0.08] border border-white/10 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <RankBadgeSvg rank={idx + 1} delta={1} />
                                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                    <CoverArtwork
                                      artworkType={ent.artworkType}
                                      coverUrl={ent.cover}
                                      title={ent.name}
                                      artist={ent.name}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                                        {ent.name}
                                      </p>
                                      {ent.careerCertification &&
                                        ent.careerCertification.level !==
                                          'NONE' && (
                                          <CertificationBadgeSvg
                                            cert={ent.careerCertification}
                                            compact
                                          />
                                        )}
                                      {ent.labelDivision && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                            ent.labelDivision ===
                                            'LABEL_OFFICIEL'
                                              ? 'bg-emerald-500/20 text-emerald-300'
                                              : 'bg-amber-500/20 text-amber-300'
                                          }`}
                                        >
                                          {ent.labelDivision ===
                                          'LABEL_OFFICIEL'
                                            ? 'Label Officiel (≥3 art.)'
                                            : 'Écurie Indé (<3 art.)'}
                                        </span>
                                      )}
                                      {ent.antiOneHitWonderApplied &&
                                        ent.role !== 'LABEL' && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9.5px] font-mono">
                                            Cap{' '}
                                            {ent.role === 'ENGINEER'
                                              ? '20%'
                                              : '25%'}{' '}
                                            • Polyvalence x
                                            {ent.versatilityMultiplier.toFixed(
                                              2
                                            )}
                                          </span>
                                        )}
                                      {ent.hasEscrowDispute && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-mono font-bold">
                                          Litige Séquestre
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                                      <span className="text-amber-300 font-semibold">
                                        {ent.primaryMetricLabel} :{' '}
                                        {ent.primaryMetricValue}
                                      </span>{' '}
                                      • {ent.secondaryMetricLabel} :{' '}
                                      {ent.secondaryMetricValue}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/10">
                                  <span className="px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-extrabold">
                                    {ent.decoupledScore} pts
                                  </span>
                                  <span className="text-xs text-white font-semibold">
                                    Détails →
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}


    </>
  );
};
