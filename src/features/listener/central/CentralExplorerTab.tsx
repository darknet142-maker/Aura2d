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
import {
  MusicIntelligenceSearchBanner,
  SmartPlaylistExplorerBar,
} from '../../music-intelligence';
import type { ReturnTypeUseImmersivePlayerState } from '../hooks/useImmersivePlayerState';

export const CentralExplorerTab: React.FC<{ state: ReturnTypeUseImmersivePlayerState }> = ({ state }) => {
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
                  {hubTab === 'EXPLORER' && (
                    <div className="space-y-5 animate-fade-in">
                      {centralFullPageView ? (
                        /* VUE PLEINE PAGE D'UNE CATÉGORIE SÉLECTIONNÉE (« + / VOIR PLUS ») */
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                            <button
                              type="button"
                              onClick={() => setCentralFullPageView(null)}
                              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition"
                            >
                              <span>← Retour à Central</span>
                            </button>
                            <h3
                              className="text-sm sm:text-base font-extrabold tracking-tight truncate"
                              style={{ color: centralFullPageView.accentColor }}
                            >
                              {centralFullPageView.title}
                            </h3>
                          </div>

                          {/* PLEINE PAGE 1 : MÉTIERS STUDIO (Artistes & Feats, Beatmakers, Paroliers, Ingés Son, Labels) */}
                          {centralFullPageView.type === 'ROLE' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {decoupledStudioRankings
                                .filter(
                                  (ent) =>
                                    centralFullPageView.role === 'ALL' ||
                                    ent.role === centralFullPageView.role
                                )
                                .map((ent) => (
                                  <button
                                    key={ent.key}
                                    type="button"
                                    onClick={() =>
                                      openUserEntitySheet(ent.name, ent.role)
                                    }
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 text-left transition-transform active:scale-[0.98]"
                                  >
                                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                      <CoverArtwork
                                        artworkType={ent.artworkType}
                                        coverUrl={ent.cover}
                                        title={ent.name}
                                        artist={ent.name}
                                      />
                                    </div>
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(to top, rgba(0,0,0,0.92) 12%, ${centralFullPageView.accentColor}44 55%, rgba(0,0,0,0.18) 100%)`,
                                      }}
                                    />
                                    <div className="absolute top-2.5 right-2.5">
                                      {ent.careerCertification &&
                                        ent.careerCertification.level !==
                                          'NONE' && (
                                          <CertificationBadgeSvg
                                            cert={ent.careerCertification}
                                            compact
                                            entityTitle={ent.name}
                                          />
                                        )}
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <p className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow">
                                        {ent.name}
                                      </p>
                                      <span className="text-[11px] text-white/80 font-medium block truncate">
                                        {ent.primaryMetricValue}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* PLEINE PAGE 2 : GENRE MUSICAL */}
                          {centralFullPageView.type === 'GENRE' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {allTracksFlat
                                .filter(
                                  ({ track }) =>
                                    !centralFullPageView.genre ||
                                    centralFullPageView.genre === 'ALL' ||
                                    track.category === centralFullPageView.genre
                                )
                                .map(({ track: t, albumIndex, trackIndex }) => {
                                  const isThisPlaying =
                                    currentTrack.id === t.id && isPlaying;
                                  const tCert = getTrackCertification(
                                    t.realPlays
                                  );
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() =>
                                        handlePlayOrToggleSpecificTrack(
                                          albumIndex,
                                          trackIndex
                                        )
                                      }
                                      className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.98]"
                                    >
                                      <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                      </div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/92 via-[#07090E]/35 to-black/15" />
                                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                        <CertificationBadgeSvg
                                          cert={tCert}
                                          compact
                                          entityTitle={t.title}
                                          entityArtist={t.artist}
                                          playsCount={t.realPlays}
                                        />
                                        <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-lg">
                                          {isThisPlaying ? (
                                            <Pause className="w-4 h-4 fill-current" />
                                          ) : (
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>
                                      <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
                                        <div className="flex items-end justify-between gap-1.5">
                                          <div className="min-w-0 flex-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openUserTrackSheet(t.id);
                                              }}
                                              className="text-sm font-extrabold text-white hover:text-amber-300 truncate drop-shadow block max-w-full text-left transition-colors"
                                            >
                                              {t.title}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openUserEntitySheet(t.artist, 'ARTIST');
                                              }}
                                              className="text-xs text-amber-300 hover:underline font-semibold truncate block max-w-full text-left"
                                            >
                                              {t.artist}
                                            </button>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUserTrackSheet(t.id);
                                            }}
                                            className="px-2 py-1 rounded-lg bg-[#07090E]/75 hover:bg-amber-400 hover:text-[#080A0F] border border-white/20 text-[10px] font-bold text-white shrink-0 transition"
                                          >
                                            Fiche
                                          </button>
                                        </div>
                                        {(t.isInstrumental ||
                                          t.category ===
                                            'Beats & Instrumentales') && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              triggerBeatAudioDownload({
                                                title: t.title,
                                                artist: t.artist,
                                                bpm: t.bpm,
                                                duration: t.duration,
                                                audioUrl: t.audioUrl,
                                                dropContentId: t.dropContentId,
                                              });
                                              showToast(
                                                `Téléchargement du Beat « ${t.title} » lancé !`,
                                                'bg-cyan-400'
                                              );
                                            }}
                                            className="w-full py-1.5 px-2 rounded-xl bg-cyan-500/85 hover:bg-cyan-400 text-black font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-lg transition"
                                          >
                                            <span>⬇</span>
                                            <span>Télécharger le Beat</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* PLEINE PAGE 3 : TOUS LES DROPS EN RECTANGLES PANORAMIQUES */}
                          {centralFullPageView.type === 'DROPS' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {allTracksFlat.map(
                                ({ track: t, albumIndex, trackIndex }) => {
                                  const isThisPlaying =
                                    currentTrack.id === t.id && isPlaying;
                                  const tCert = getTrackCertification(
                                    t.realPlays
                                  );
                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() =>
                                        handlePlayOrToggleSpecificTrack(
                                          albumIndex,
                                          trackIndex
                                        )
                                      }
                                      className="group relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.99]"
                                    >
                                      <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                      </div>
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          background: `linear-gradient(to top, rgba(0,0,0,0.92) 15%, ${
                                            t.ambientPrimary || '#e11d38'
                                          }55 60%, rgba(0,0,0,0.2) 100%)`,
                                        }}
                                      />
                                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                        <CertificationBadgeSvg
                                          cert={tCert}
                                          compact
                                          entityTitle={t.title}
                                          entityArtist={t.artist}
                                          playsCount={t.realPlays}
                                        />
                                        <span className="w-9 h-9 rounded-full bg-[#e11d38] text-white flex items-center justify-center font-bold text-xs shadow-lg">
                                          {isThisPlaying ? (
                                            <Pause className="w-4 h-4 fill-current" />
                                          ) : (
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>
                                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUserTrackSheet(t.id);
                                            }}
                                            className="text-base font-extrabold text-white hover:text-amber-300 truncate drop-shadow block max-w-full text-left transition-colors"
                                          >
                                            {t.title}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUserEntitySheet(t.artist, 'ARTIST');
                                            }}
                                            className="text-xs text-amber-300 hover:underline font-bold truncate block max-w-full text-left"
                                          >
                                            {t.artist}
                                          </button>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserTrackSheet(t.id);
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-[#07090E]/75 hover:bg-amber-400 hover:text-[#080A0F] border border-white/20 text-[10px] font-bold text-white shrink-0 transition"
                                        >
                                          Fiche
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}

                          {/* PLEINE PAGE 4 : TOUS LES ARTISTES EN CERCLES */}
                          {centralFullPageView.type === 'ARTISTS_CIRCLES' && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2">
                              {decoupledStudioRankings
                                .filter((ent) => ent.role === 'ARTIST')
                                .map((ent) => (
                                  <button
                                    key={ent.key}
                                    type="button"
                                    onClick={() =>
                                      openUserEntitySheet(ent.name, 'ARTIST')
                                    }
                                    className="flex flex-col items-center gap-2 group"
                                  >
                                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform">
                                      <CoverArtwork
                                        artworkType={ent.artworkType}
                                        coverUrl={ent.cover}
                                        title={ent.name}
                                        artist={ent.name}
                                      />
                                    </div>
                                    <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-full">
                                      {ent.name}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* PLEINE PAGE 5 : PROJETS & ALBUMS */}
                          {centralFullPageView.type === 'ALBUMS' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {analyticsCatalogue.map((alb, aIdx) => {
                                const firstTrack = alb.tracks[0];
                                const albPlays = alb.tracks.reduce(
                                  (acc, t) => acc + t.realPlays,
                                  0
                                );
                                const albCert = getAlbumCertification(albPlays);
                                return (
                                  <div
                                    key={alb.id}
                                    onClick={() =>
                                      handlePlayOrToggleSpecificTrack(aIdx, 0)
                                    }
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.98]"
                                  >
                                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                      <CoverArtwork
                                        artworkType={firstTrack.artworkType}
                                        coverUrl={firstTrack.cover}
                                        title={alb.albumTitle}
                                        artist={alb.artist}
                                      />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/92 via-[#07090E]/35 to-transparent" />
                                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                      <CertificationBadgeSvg
                                        cert={albCert}
                                        compact
                                        entityTitle={alb.albumTitle}
                                        entityArtist={alb.artist}
                                        playsCount={albPlays}
                                      />
                                      <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-lg">
                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                      </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-1.5">
                                      <div className="min-w-0 flex-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserTrackSheet(firstTrack.id);
                                          }}
                                          className="text-sm font-extrabold text-white hover:text-amber-300 truncate drop-shadow block max-w-full text-left transition-colors"
                                        >
                                          {alb.albumTitle}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserEntitySheet(alb.artist, 'ARTIST');
                                          }}
                                          className="text-xs text-amber-300 hover:underline font-semibold truncate block max-w-full text-left"
                                        >
                                          {alb.artist}
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openUserTrackSheet(firstTrack.id);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-[#07090E]/75 hover:bg-amber-400 hover:text-[#080A0F] border border-white/20 text-[10px] font-bold text-white shrink-0 transition"
                                      >
                                        Album
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* =========================================================== */
                        /* FLUX PRINCIPAL AÉRÉ « CENTRAL » (GÉOMÉTRIES ALTERNÉES)      */
                        /* =========================================================== */
                        <>
                          {/* BANNIÈRE SLIDESHOW PUBLICITAIRE HAUT (IMAGE PURE, GÉRÉE DANS ADMIN) */}
                          <CentralAdSlideshowBanner
                            position="TOP"
                            slides={adBanners}
                            settings={adBannerSettings}
                            onSelectTrackId={(tId) => {
                              const found = allTracksFlat.find(
                                (m) => m.track.id === tId
                              );
                              if (found) {
                                handlePlayOrToggleSpecificTrack(
                                  found.albumIndex,
                                  found.trackIndex
                                );
                              }
                            }}
                            onSelectAlbumId={(albId) => {
                              const albIdx = analyticsCatalogue.findIndex(
                                (a) => a.id === albId
                              );
                              if (albIdx >= 0) {
                                onSelectAlbumIndex(albIdx, 0, false);
                                setActiveModal('NONE');
                              }
                            }}
                          />

                          {/* RECHERCHE LANGAGE NATUREL MUSIC INTELLIGENCE (Section 6.C) */}
                          <MusicIntelligenceSearchBanner
                            query={hubSearchQuery}
                            onChangeQuery={setHubSearchQuery}
                          />

                          {/* BARRE D'INTELLIGENCE MUSICALE : SMART PLAYLISTS & DJ MODE (+241) */}
                          <SmartPlaylistExplorerBar
                            entries={allTracksFlat}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            onPlayTrack={handlePlayOrToggleSpecificTrack}
                            onOpenTrackDetail={openUserTrackSheet}
                          />

                          {/* 1. RANGÉE CARRÉE DÉFILANTE : CATÉGORIES MÉTIERS & GENRES */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Catégories &amp; Métiers
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'ROLE',
                                    role: 'ALL',
                                    title: 'Toutes les Catégories & Métiers',
                                    accentColor: '#f59e0b',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
                              {(
                                [
                                  {
                                    id: 'ARTIST' as StudioEntityRole,
                                    title: 'Artistes & Feats',
                                    color: '#f59e0b',
                                    cover:
                                      allTracksFlat[0]?.track.cover || '',
                                    artworkType:
                                      allTracksFlat[0]?.track.artworkType,
                                  },
                                  {
                                    id: 'BEATMAKER' as StudioEntityRole,
                                    title: 'Beatmakers',
                                    color: '#10b981',
                                    cover:
                                      allTracksFlat[1]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[1]?.track.artworkType,
                                  },
                                  {
                                    id: 'LYRICIST' as StudioEntityRole,
                                    title: 'Paroliers',
                                    color: '#0ea5e9',
                                    cover:
                                      allTracksFlat[2]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[2]?.track.artworkType,
                                  },
                                  {
                                    id: 'ENGINEER' as StudioEntityRole,
                                    title: 'Ingés du Son',
                                    color: '#06b6d4',
                                    cover:
                                      allTracksFlat[3]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[3]?.track.artworkType,
                                  },
                                  {
                                    id: 'LABEL' as StudioEntityRole,
                                    title: 'Labels',
                                    color: '#e11d38',
                                    cover:
                                      allTracksFlat[4]?.track.cover ||
                                      allTracksFlat[0]?.track.cover ||
                                      '',
                                    artworkType:
                                      allTracksFlat[4]?.track.artworkType,
                                  },
                                ] as const
                              ).map((catCard) => (
                                <button
                                  key={catCard.id}
                                  type="button"
                                  onClick={() =>
                                    setCentralFullPageView({
                                      type: 'ROLE',
                                      role: catCard.id,
                                      title: catCard.title,
                                      accentColor: catCard.color,
                                    })
                                  }
                                  className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-white/40 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                >
                                  <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300">
                                    <CoverArtwork
                                      artworkType={catCard.artworkType}
                                      coverUrl={catCard.cover}
                                      title={catCard.title}
                                      artist={catCard.title}
                                    />
                                  </div>
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      background: `linear-gradient(145deg, ${catCard.color}66 0%, rgba(0,0,0,0.88) 90%)`,
                                    }}
                                  />
                                  <span
                                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-black font-extrabold text-xs shadow"
                                    style={{ backgroundColor: catCard.color }}
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </span>
                                  <div className="absolute bottom-3 left-3 right-3">
                                    <span className="text-sm sm:text-base font-extrabold text-white leading-tight block drop-shadow">
                                      {catCard.title}
                                    </span>
                                  </div>
                                </button>
                              ))}

                              {/* Cartes carrées des Genres musicaux à la suite dans le défilement */}
                              {availableGenres.map((genre, gIdx) => {
                                const genreTrack =
                                  allTracksFlat.find(
                                    (m) => m.track.category === genre
                                  )?.track || allTracksFlat[0]?.track;
                                const palette = [
                                  '#e11d38',
                                  '#f59e0b',
                                  '#10b981',
                                  '#0ea5e9',
                                  '#06b6d4',
                                ];
                                const gColor = palette[gIdx % palette.length];
                                return (
                                  <button
                                    key={genre}
                                    type="button"
                                    onClick={() =>
                                      setCentralFullPageView({
                                        type: 'GENRE',
                                        genre,
                                        title: genre,
                                        accentColor: gColor,
                                      })
                                    }
                                    className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-white/40 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                  >
                                    {genreTrack && (
                                      <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={genreTrack.artworkType}
                                          coverUrl={genreTrack.cover}
                                          title={genre}
                                          artist={genreTrack.artist}
                                        />
                                      </div>
                                    )}
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(145deg, ${gColor}66 0%, rgba(0,0,0,0.9) 90%)`,
                                      }}
                                    />
                                    <span
                                      className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-black font-extrabold text-xs shadow"
                                      style={{ backgroundColor: gColor }}
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </span>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <span className="text-sm sm:text-base font-extrabold text-white leading-tight block drop-shadow">
                                        {genre}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </section>

                          {/* 2. RANGÉE RECTANGULAIRE PANORAMIQUE (16:9) : DROPS EN VEDETTE */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Drops en Vedette
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'DROPS',
                                    title: 'Tous les Drops en Vedette',
                                    accentColor: '#e11d38',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3.5 overflow-x-auto pb-1.5 no-scrollbar">
                              {allTracksFlat.map(
                                ({ track: t, albumIndex, trackIndex }, idx) => {
                                  const isThisPlaying =
                                    currentTrack.id === t.id && isPlaying;
                                  const tCert = getTrackCertification(
                                    t.realPlays
                                  );
                                  const accentColors = [
                                    '#e11d38',
                                    '#f59e0b',
                                    '#8b5cf6',
                                    '#10b981',
                                    '#06b6d4',
                                  ];
                                  const cardColor =
                                    t.ambientPrimary ||
                                    accentColors[idx % accentColors.length];

                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() =>
                                        handlePlayOrToggleSpecificTrack(
                                          albumIndex,
                                          trackIndex
                                        )
                                      }
                                      className="group relative w-64 sm:w-72 aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 shrink-0 cursor-pointer transition-transform active:scale-[0.98] shadow-xl"
                                    >
                                      <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={t.artworkType}
                                          coverUrl={t.cover}
                                          title={t.title}
                                          artist={t.artist}
                                        />
                                      </div>
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          background: `linear-gradient(to top, rgba(0,0,0,0.92) 12%, ${cardColor}55 58%, rgba(0,0,0,0.18) 100%)`,
                                        }}
                                      />

                                      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                                        <CertificationBadgeSvg
                                          cert={tCert}
                                          compact
                                          entityTitle={t.title}
                                          entityArtist={t.artist}
                                          playsCount={t.realPlays}
                                        />
                                        <span className="w-8 h-8 rounded-full bg-[#e11d38] text-white flex items-center justify-center font-bold text-xs shadow-lg">
                                          {isThisPlaying ? (
                                            <Pause className="w-4 h-4 fill-current" />
                                          ) : (
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                          )}
                                        </span>
                                      </div>

                                      {/* Titre & artiste cliquables directement sur la carte rectangulaire */}
                                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUserTrackSheet(t.id);
                                            }}
                                            className="text-sm sm:text-base font-extrabold text-white hover:text-amber-300 truncate drop-shadow block max-w-full text-left transition-colors"
                                          >
                                            {t.title}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUserEntitySheet(t.artist, 'ARTIST');
                                            }}
                                            className="text-xs font-bold text-amber-300 hover:underline truncate block max-w-full text-left"
                                          >
                                            {t.artist}
                                          </button>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserTrackSheet(t.id);
                                          }}
                                          className="px-2 py-1 rounded-lg bg-[#07090E]/75 hover:bg-amber-400 hover:text-[#080A0F] border border-white/20 text-[10px] font-bold text-white shrink-0 transition"
                                        >
                                          Fiche
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </section>

                          {/* 2-BIS. RANGÉE SPÉCIALE : BEATS & INSTRUMENTALES TÉLÉCHARGEABLES */}
                          {allTracksFlat.some(
                            ({ track }) =>
                              track.isInstrumental ||
                              track.category === 'Beats & Instrumentales'
                          ) && (
                            <section className="space-y-2.5">
                              <div className="flex items-center justify-between px-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-extrabold text-cyan-300 tracking-tight">
                                    Beats &amp; Instrumentales
                                  </h3>
                                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[9px] font-mono font-bold">
                                    Téléchargement Direct
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCentralFullPageView({
                                      type: 'GENRE',
                                      genre: 'Beats & Instrumentales',
                                      title: 'Beats & Instrumentales',
                                      accentColor: '#06b6d4',
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-400 hover:text-black text-[11px] font-bold text-cyan-300 transition"
                                >
                                  + Voir tous les Beats
                                </button>
                              </div>

                              <div className="flex items-center gap-3.5 overflow-x-auto pb-1.5 no-scrollbar">
                                {allTracksFlat
                                  .filter(
                                    ({ track }) =>
                                      track.isInstrumental ||
                                      track.category ===
                                        'Beats & Instrumentales'
                                  )
                                  .map(({ track: t, albumIndex, trackIndex }) => {
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
                                        className="group relative w-64 sm:w-72 rounded-2xl overflow-hidden border border-cyan-400/35 hover:border-cyan-300 bg-zinc-900/90 p-3 shrink-0 cursor-pointer transition-transform active:scale-[0.98] shadow-xl flex flex-col justify-between gap-2.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/15 shrink-0">
                                            <CoverArtwork
                                              artworkType={t.artworkType}
                                              coverUrl={t.cover}
                                              title={t.title}
                                              artist={t.artist}
                                            />
                                            <span className="absolute inset-0 bg-[#07090E]/45 flex items-center justify-center text-white font-bold text-xs">
                                              {isThisPlaying ? (
                                                <Pause className="w-4 h-4 fill-current" />
                                              ) : (
                                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                              )}
                                            </span>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openUserTrackSheet(t.id);
                                              }}
                                              className="text-xs sm:text-sm font-extrabold text-white hover:text-amber-300 truncate block max-w-full text-left transition-colors"
                                            >
                                              {t.title}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openUserEntitySheet(
                                                  t.beatmakerName || t.artist,
                                                  'BEATMAKER'
                                                );
                                              }}
                                              className="text-[11px] text-cyan-300 hover:underline font-bold truncate block max-w-full text-left"
                                            >
                                              Prod. {t.beatmakerName || t.artist}
                                            </button>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[9px] font-mono font-bold">
                                                {t.bpm || 120} BPM
                                              </span>
                                              {t.musicalKey && (
                                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200 text-[9px] font-mono font-bold">
                                                  {t.musicalKey}
                                                </span>
                                              )}
                                              <span className="text-[9px] font-mono text-emerald-300/90 truncate">
                                                {t.dropContentId}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              triggerBeatAudioDownload({
                                                title: t.title,
                                                artist: t.artist,
                                                bpm: t.bpm,
                                                duration: t.duration,
                                                audioUrl: t.audioUrl,
                                                dropContentId: t.dropContentId,
                                              });
                                              showToast(
                                                `Téléchargement du Beat « ${t.title} » lancé !`,
                                                'bg-cyan-400'
                                              );
                                            }}
                                            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition"
                                          >
                                            <span>⬇</span>
                                            <span>Télécharger le Beat</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openUserTrackSheet(t.id);
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition"
                                          >
                                            Fiche
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </section>
                          )}

                          {/* 3. RANGÉE CIRCULAIRE : ARTISTES & TALENTS */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Artistes &amp; Talents
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'ARTISTS_CIRCLES',
                                    title: 'Tous les Artistes & Talents',
                                    accentColor: '#f59e0b',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-4 overflow-x-auto pb-1.5 no-scrollbar">
                              {decoupledStudioRankings
                                .filter((ent) => ent.role === 'ARTIST')
                                .map((ent, idx) => {
                                  const ringColors = [
                                    'border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.3)]',
                                    'border-[#e11d38] shadow-[0_0_16px_rgba(225,29,56,0.3)]',
                                    'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.3)]',
                                    'border-sky-400 shadow-[0_0_16px_rgba(139,92,246,0.3)]',
                                    'border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.3)]',
                                  ];
                                  return (
                                    <button
                                      key={ent.key}
                                      type="button"
                                      onClick={() =>
                                        openUserEntitySheet(ent.name, 'ARTIST')
                                      }
                                      className="flex flex-col items-center gap-1.5 shrink-0 w-24 group"
                                    >
                                      <div
                                        className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 transition-transform group-hover:scale-105 ${
                                          ringColors[idx % ringColors.length]
                                        }`}
                                      >
                                        <CoverArtwork
                                          artworkType={ent.artworkType}
                                          coverUrl={ent.cover}
                                          title={ent.name}
                                          artist={ent.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                      </div>
                                      <span className="text-xs font-extrabold text-white truncate max-w-full">
                                        {ent.name}
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          </section>

                          {/* 4. RANGÉE CARRÉE COLORÉE : MES PLAYLISTS & FAVORIS */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Mes Playlists &amp; Favoris
                              </h3>
                              <button
                                type="button"
                                onClick={() => setHubTab('PROFIL')}
                                className="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-emerald-400 hover:text-black text-[11px] font-bold text-emerald-300 transition"
                              >
                                + Gérer dans Mon Profil
                              </button>
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
                              {/* Carte Carrée Spéciale : Mes Likes ♥ */}
                              <button
                                type="button"
                                onClick={() => setHubTab('PROFIL')}
                                className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-rose-400/40 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                style={{
                                  background:
                                    'linear-gradient(135deg, #e11d38 0%, #4c0519 100%)',
                                }}
                              >
                                <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
                                  ♥
                                </span>
                                <div className="absolute bottom-3 left-3 right-3">
                                  <span className="text-sm sm:text-base font-extrabold text-white block leading-tight">
                                    Mes Likes
                                  </span>
                                  <span className="text-[11px] text-rose-100/90 font-mono">
                                    {
                                      Object.values(likedTrackIds).filter(
                                        Boolean
                                      ).length
                                    }{' '}
                                    titres
                                  </span>
                                </div>
                              </button>

                              {/* Cartes Carrées des Playlists de l'utilisateur */}
                              {playlists.map((pl) => {
                                const firstMatch = allTracksFlat.find((m) =>
                                  pl.trackIds.includes(m.track.id)
                                );
                                return (
                                  <button
                                    key={pl.id}
                                    type="button"
                                    onClick={() => {
                                      if (firstMatch) {
                                        handlePlayOrToggleSpecificTrack(
                                          firstMatch.albumIndex,
                                          firstMatch.trackIndex
                                        );
                                      } else {
                                        setHubTab('PROFIL');
                                      }
                                    }}
                                    className="group relative w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 shrink-0 text-left transition-transform active:scale-95 shadow-lg"
                                    style={{
                                      background: `linear-gradient(135deg, ${
                                        pl.colorTheme || '#f59e0b'
                                      } 0%, #090b10 95%)`,
                                    }}
                                  >
                                    {firstMatch && (
                                      <div className="absolute inset-0 opacity-65 group-hover:scale-110 transition-transform duration-300">
                                        <CoverArtwork
                                          artworkType={
                                            firstMatch.track.artworkType
                                          }
                                          coverUrl={firstMatch.track.cover}
                                          title={pl.name}
                                          artist={firstMatch.track.artist}
                                        />
                                      </div>
                                    )}
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(to top, rgba(0,0,0,0.9) 12%, ${
                                          pl.colorTheme || '#f59e0b'
                                        }55 55%, rgba(0,0,0,0.2) 100%)`,
                                      }}
                                    />
                                    <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-bold shadow">
                                      <Play className="w-3 h-3 fill-current ml-0.5" />
                                    </span>
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <span className="text-sm font-extrabold text-white truncate block drop-shadow">
                                        {pl.name}
                                      </span>
                                      <span className="text-[10px] text-white/80 font-mono">
                                        {pl.trackIds.length} titre
                                        {pl.trackIds.length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </section>

                          {/* 5. RANGÉE PROJETS & ALBUMS EN CARTES COLORÉES */}
                          <section className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <h3 className="text-sm font-extrabold text-white tracking-tight">
                                Projets &amp; Albums
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  setCentralFullPageView({
                                    type: 'ALBUMS',
                                    title: 'Tous les Projets & Albums',
                                    accentColor: '#06b6d4',
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-semibold text-zinc-300 hover:text-white transition"
                              >
                                <span>Tout voir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {analyticsCatalogue.map((alb, aIdx) => {
                                const firstTrack = alb.tracks[0];
                                const albPlays = alb.tracks.reduce(
                                  (acc, t) => acc + t.realPlays,
                                  0
                                );
                                const albCert = getAlbumCertification(albPlays);
                                return (
                                  <div
                                    key={alb.id}
                                    onClick={() =>
                                      handlePlayOrToggleSpecificTrack(aIdx, 0)
                                    }
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-transform active:scale-[0.98] shadow-lg"
                                  >
                                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                                      <CoverArtwork
                                        artworkType={firstTrack.artworkType}
                                        coverUrl={firstTrack.cover}
                                        title={alb.albumTitle}
                                        artist={alb.artist}
                                      />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/92 via-[#07090E]/35 to-black/10" />
                                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                      <CertificationBadgeSvg
                                        cert={albCert}
                                        compact
                                        entityTitle={alb.albumTitle}
                                        entityArtist={alb.artist}
                                        playsCount={albPlays}
                                      />
                                      <span className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-bold shadow">
                                        <Play className="w-3 h-3 fill-current ml-0.5" />
                                      </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-1.5">
                                      <div className="min-w-0 flex-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserTrackSheet(firstTrack.id);
                                          }}
                                          className="text-sm font-extrabold text-white hover:text-amber-300 truncate drop-shadow block max-w-full text-left transition-colors"
                                        >
                                          {alb.albumTitle}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openUserEntitySheet(alb.artist, 'ARTIST');
                                          }}
                                          className="text-xs text-amber-300 hover:underline font-semibold truncate block max-w-full text-left"
                                        >
                                          {alb.artist}
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openUserTrackSheet(firstTrack.id);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-[#07090E]/75 hover:bg-amber-400 hover:text-[#080A0F] border border-white/20 text-[10px] font-bold text-white shrink-0 transition"
                                      >
                                        Album
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </section>

                          {/* BANNIÈRE SLIDESHOW PUBLICITAIRE BAS (TOUT EN BAS APRÈS LES CONTENUS) */}
                          <CentralAdSlideshowBanner
                            position="BOTTOM"
                            slides={adBanners}
                            settings={adBannerSettings}
                            onSelectTrackId={(tId) => {
                              const found = allTracksFlat.find(
                                (m) => m.track.id === tId
                              );
                              if (found) {
                                handlePlayOrToggleSpecificTrack(
                                  found.albumIndex,
                                  found.trackIndex
                                );
                              }
                            }}
                            onSelectAlbumId={(albId) => {
                              const albIdx = analyticsCatalogue.findIndex(
                                (a) => a.id === albId
                              );
                              if (albIdx >= 0) {
                                onSelectAlbumIndex(albIdx, 0, false);
                                setActiveModal('NONE');
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}


    </>
  );
};
