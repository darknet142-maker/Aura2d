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

export const CentralRecosAndArtistsTabs: React.FC<{ state: ReturnTypeUseImmersivePlayerState }> = ({ state }) => {
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
                  {hubTab === 'RECOS' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="p-3.5 rounded-2xl bg-[#07090E]/90 border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <DropOfficialLogo className="h-[15px] w-auto max-w-[70px]" />
                            <h3 className="text-sm font-bold text-white">
                              Fil Commun des Recommandations
                            </h3>
                          </div>
                          <p className="text-xs text-[#A3A9BA]">
                            Titres et extraits de paroles poussés par la
                            communauté pour faire découvrir de nouveaux talents
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onRecommendTrack?.(
                              currentTrack.id,
                              `Je recommande « ${currentTrack.title} » de ${currentTrack.artist} !`,
                              false
                            );
                            showToast(
                              'Titre actuel ajouté au Fil Commun DROP !'
                            );
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition shrink-0"
                        >
                          + Recommander « {currentTrack.title} »
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {communityRecommendations.map((rec) => {
                          const foundTrack = allTracksFlat.find(
                            (m) => m.track.id === rec.trackId
                          );
                          return (
                            <div
                              key={rec.id}
                              onClick={() => {
                                if (foundTrack) {
                                  handlePlayOrToggleSpecificTrack(
                                    foundTrack.albumIndex,
                                    foundTrack.trackIndex
                                  );
                                }
                              }}
                              className="p-3 rounded-2xl bg-[#07090E]/90 hover:bg-white/[0.08] border border-white/10 flex flex-col gap-2 cursor-pointer transition"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                                    {rec.userAvatar}
                                  </span>
                                  <span className="text-xs font-bold text-white">
                                    {rec.userName}
                                  </span>
                                  <span className="text-[11px] text-[#A3A9BA]">
                                    {rec.isLyricExcerpt
                                      ? 'a partagé un extrait de paroles'
                                      : 'a recommandé ce titre'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-amber-300">
                                  {rec.createdAt} • +{rec.boostPoints} pt
                                </span>
                              </div>

                              {rec.commentOrLyricExcerpt && (
                                <p
                                  className={`text-xs px-3 py-2 rounded-xl border ${
                                    rec.isLyricExcerpt
                                      ? 'bg-sky-500/15 border-sky-400/35 text-sky-200 italic font-semibold'
                                      : 'bg-[#07090E]/40 border-white/5 text-zinc-200'
                                  }`}
                                >
                                  {rec.commentOrLyricExcerpt}
                                  {rec.isLyricExcerpt && rec.lyricistName && (
                                    <span className="block text-[10px] font-mono text-sky-300 mt-1 not-italic">
                                      — Plume : {rec.lyricistName}
                                    </span>
                                  )}
                                </p>
                              )}

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                                    <CoverArtwork
                                      artworkType={rec.artworkType}
                                      coverUrl={rec.cover}
                                      title={rec.trackTitle}
                                      artist={rec.trackArtist}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">
                                      {rec.trackTitle}
                                    </p>
                                    <p className="text-[11px] text-[#A3A9BA] truncate">
                                      {rec.trackArtist} • {rec.trackCategory}
                                    </p>
                                  </div>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#e11d38] text-white text-[11px] font-bold shrink-0">
                                  <span>Écouter</span>
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ONGLET 5 : ARTISTES, PAROLIERS & ÉQUIPES STUDIO */}
                  {hubTab === 'ARTISTES' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {(
                          [
                            { id: 'ALL', label: 'Tous les Métiers Studio' },
                            { id: 'ARTIST', label: 'Artistes & Featurings' },
                            { id: 'LYRICIST', label: 'Paroliers (Plumes)' },
                            { id: 'BEATMAKER', label: 'Beatmakers' },
                            { id: 'ENGINEER', label: 'Ingénieurs du Son' },
                            { id: 'LABEL', label: 'Labels' },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setHubTeamRoleFilter(f.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                              hubTeamRoleFilter === f.id
                                ? 'bg-amber-400 text-black font-bold'
                                : 'bg-white/[0.06] text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {decoupledStudioRankings
                           .filter(
                            (ent) =>
                              hubTeamRoleFilter === 'ALL' ||
                              ent.role === hubTeamRoleFilter
                          )
                          .map((ent) => (
                            <button
                              key={ent.key}
                              type="button"
                              onClick={() =>
                                openUserEntitySheet(ent.name, ent.role)
                              }
                              className="relative flex items-center justify-between p-3 rounded-2xl border bg-[#07090E]/90 hover:bg-white/[0.08] border-white/10 text-left transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                  <CoverArtwork
                                    artworkType={ent.artworkType}
                                    coverUrl={ent.cover}
                                    title={ent.name}
                                    artist={ent.name}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">
                                      {ent.name}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                        ent.role === 'ARTIST'
                                          ? 'bg-amber-400/20 text-amber-300'
                                          : ent.role === 'LABEL'
                                            ? 'bg-[#e11d38]/20 text-rose-300'
                                            : ent.role === 'BEATMAKER'
                                              ? 'bg-emerald-500/20 text-emerald-300'
                                              : ent.role === 'LYRICIST'
                                                ? 'bg-sky-500/20 text-sky-300'
                                                : 'bg-sky-500/20 text-sky-300'
                                      }`}
                                    >
                                      {ent.role === 'ARTIST'
                                        ? 'ARTISTE'
                                        : ent.role === 'LABEL'
                                          ? 'LABEL'
                                          : ent.role === 'BEATMAKER'
                                            ? 'BEATMAKER'
                                            : ent.role === 'LYRICIST'
                                              ? 'PAROLIER'
                                              : 'INGÉ SON'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#A3A9BA] truncate mt-0.5">
                                    {ent.primaryMetricLabel} :{' '}
                                    {ent.primaryMetricValue} • Score :{' '}
                                    {ent.decoupledScore} pts
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-amber-300 shrink-0 ml-2">
                                Ouvrir →
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* ONGLET 6 : MON PROFIL, BIBLIOTHÈQUE PERSONNELLE (PLAYLISTS, LIKES, FAVORIS, ÉCOUTES) & PASS MOBILE MONEY */}
                  {hubTab === 'PROFIL' && currentUser && (
                    <ReusableUserProfileSheet
                      user={currentUser}
                      userRank={Math.max(
                        1,
                        [...users]
                          .sort(
                            (a, b) =>
                              b.totalListenSeconds - a.totalListenSeconds
                          )
                          .findIndex((u) => u.id === currentUser.id) + 1
                      )}
                      isOwnProfile={true}
                      userPlan={userPlan}
                      onToggleUserPlan={onToggleUserPlan}
                      subscriptionPass={subscriptionPass}
                      onChangeSubscriptionPass={onChangeSubscriptionPass}
                      networkOperator={networkOperator}
                      onChangeNetworkOperator={onChangeNetworkOperator}
                      lastEcgValidationMsg={lastEcgValidationMsg}
                      allTracksFlat={allTracksFlat}
                      trackRankMap={trackRankMap}
                      currentTrackId={currentTrack.id}
                      isPlaying={isPlaying}
                      userPlaylists={playlists}
                      onCreatePlaylist={handleCreatePlaylist}
                      onDeletePlaylist={handleDeletePlaylist}
                      onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
                      likedTrackIds={likedTrackIds}
                      onToggleLike={onToggleLike}
                      subscribedArtists={subscribedArtists}
                      onToggleSubscribeArtist={onToggleSubscribeArtist}
                      onOpenEntityProfile={(name, role) =>
                        openUserEntitySheet(name, role)
                      }
                      onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
                      onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                    />
                  )}

    </>
  );
};
