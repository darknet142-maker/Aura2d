import React, { useState } from 'react';
import {
  Search,
  X,
  Compass,
  ChartNoAxesColumn,
  Trophy,
  MessageCircle,
  UserRound,
  Bell,
  Shield,
  Coins,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DropOfficialLogo } from '../../../components/CoverArtwork';
import {
  SynchronizedMiniPlayer,
  ReusableTrackDetailSheet,
  ReusableArtistDetailSheet,
  ReusableUserProfileSheet,
} from '../../../components/ReusableAnalyticsSheets';
import { SPRING_SNAPPY, SUBTLE_ENTRANCE_VARIANTS } from '../../../shared/ui/springMotion';
import type { ReturnTypeUseImmersivePlayerState } from '../hooks/useImmersivePlayerState';
import { CentralInstantSearchView } from './CentralInstantSearchView';
import { CentralExplorerTab } from './CentralExplorerTab';
import { CentralRankingsTab } from './CentralRankingsTab';
import { CentralAwardsTab } from './CentralAwardsTab';
import { CentralRecosAndArtistsTabs } from './CentralRecosAndArtistsTabs';
import { CentralMissionsTab } from './CentralMissionsTab';
import {
  UserTokenWalletModal,
  getOrCreateUserWallet,
  getSponsorCampaigns,
  hasUserCompletedCampaign,
} from '../../tokens';

export interface CentralHubWorkspaceProps {
  state: ReturnTypeUseImmersivePlayerState;
  isEmbeddedDesktopConsole?: boolean;
}

export const CentralHubWorkspace: React.FC<CentralHubWorkspaceProps> = ({
  state,
  isEmbeddedDesktopConsole = false,
}) => {
  const {
    currentTrack,
    currentTime,
    isPlaying,
    isDropMode,
    likedTrackIds,
    recommendedTrackIds,
    subscribedArtists,
    artistSubscribers,
    trackRankMap,
    currentUser,
    userPlan,
    onToggleUserPlan,
    subscriptionPass,
    onChangeSubscriptionPass,
    networkOperator,
    onChangeNetworkOperator,
    lastEcgValidationMsg,
    allTracksFlat,
    playlists,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleToggleTrackInPlaylist,
    rightsLines,
    payoutStatements,
    royaltySettings,
    unreadNotificationsCount,
    onOpenNotifications,
    onOpenAdminStudio,
    onTogglePlay,
    onNavigateTrack,
    onToggleLike,
    onRecommendTrack,
    onToggleSubscribeArtist,
    onConfirmCreditHandshake,
    onOpenCreditDispute,
    onResolveCreditDispute,
    safeRankInfo,
    setActiveModal,
    openTrendStudioWithConfig,
    socialFeedCtrl,
    hubTab,
    setHubTab,
    setCentralFullPageView,
    hubSearchQuery,
    setHubSearchQuery,
    searchInputRef,
    showToast,
    openUserTrackSheet,
    openUserEntitySheet,
    openUserListenerSheet,
    closeAllAnalyticsSheets,
    handlePlayOrToggleSpecificTrack,
    activeTrackSheetData,
    activeEntitySheetData,
    activeUserSheetData,
    instantSearchResults,
    hasOpenAnalyticsSheet,
    enableAwardsCeremony,
  } = state;

  const [isTokenWalletOpen, setIsTokenWalletOpen] = useState(false);
  const activeCampaigns = getSponsorCampaigns('ACTIVE');
  const availableMissionsCount = activeCampaigns.filter(
    (c) => !hasUserCompletedCampaign(currentUser?.id || 'usr-default', c.id)
  ).length;

  return (
    <motion.div
      variants={SUBTLE_ENTRANCE_VARIANTS}
      initial="initial"
      animate="animate"
      className={
        isEmbeddedDesktopConsole
          ? 'w-full h-full rounded-[28px] bg-[#090C15]/65 border border-white/[0.09] shadow-[0_28px_70px_-20px_rgba(4,6,12,0.92),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md flex flex-col justify-between p-4 sm:p-5 overflow-hidden'
          : 'absolute inset-0 z-40 bg-[#090C15]/65 backdrop-blur-md flex flex-col justify-between p-4 sm:p-5 overflow-hidden'
      }
    >
      {/* En-tête de la Console "Central" */}
      <div className="flex items-center justify-between gap-2 shrink-0 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5 min-w-0">
          <DropOfficialLogo className="h-[18px] w-auto shrink-0 max-w-[90px]" />
          <span className="text-sm sm:text-base font-extrabold text-[#F8FAFC] tracking-tight truncate">
            Central
          </span>
        </div>

        {/* Actions rapides épurées en haut de l'écran Central */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenNotifications && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.94 }}
              transition={SPRING_SNAPPY}
              onClick={onOpenNotifications}
              className="relative w-8 h-8 rounded-full bg-[#121622] hover:bg-[#191F2E] border border-white/10 flex items-center justify-center text-[#F8FAFC]"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[#DE1B34] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_SNAPPY}
            onClick={() => setIsTokenWalletOpen(true)}
            className="px-2.5 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
            title="Mon Portefeuille de Jetons Sponsorisés"
          >
            <Coins className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono">{getOrCreateUserWallet(currentUser?.id || 'usr-default').availableBalanceTokens.toLocaleString()}</span>
          </motion.button>


          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_SNAPPY}
            onClick={() => {
              setActiveModal('NONE');
              onOpenAdminStudio();
            }}
            className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5"
            title="Ouvrir l'espace Studio Admin & BUGADA"
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Studio Admin</span>
          </motion.button>

          {!isEmbeddedDesktopConsole && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_SNAPPY}
              onClick={() => {
                closeAllAnalyticsSheets();
                setActiveModal('NONE');
              }}
              className="px-3 py-1.5 rounded-full bg-[#121622] hover:bg-[#191F2E] border border-white/10 text-xs font-semibold text-[#F8FAFC] flex items-center gap-1 shrink-0"
            >
              <span>Lecteur</span>
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>

      {/* Zone Centrale Défilante */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-0.5 flex flex-col gap-4">
        {activeTrackSheetData ? (
          <ReusableTrackDetailSheet
            track={activeTrackSheetData.track}
            album={activeTrackSheetData.album}
            albumIndex={activeTrackSheetData.albumIndex}
            trackIndex={activeTrackSheetData.trackIndex}
            rankInfo={activeTrackSheetData.rankInfo}
            isCurrentTrack={activeTrackSheetData.track.id === currentTrack.id}
            isPlaying={isPlaying}
            isLiked={!!likedTrackIds[activeTrackSheetData.track.id]}
            isRecommended={!!recommendedTrackIds[activeTrackSheetData.track.id]}
            isArtistSubscribed={
              !!subscribedArtists[activeTrackSheetData.track.artist] ||
              !!subscribedArtists[activeTrackSheetData.track.artist.toLowerCase()]
            }
            artistSubscribersCount={
              artistSubscribers[activeTrackSheetData.track.artist] ??
              artistSubscribers[activeTrackSheetData.track.artist.toLowerCase()]
            }
            isAdminView={false}
            onClose={closeAllAnalyticsSheets}
            onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
            onToggleLike={onToggleLike}
            onRecommendTrack={(tId) => {
              onRecommendTrack?.(
                tId,
                'Recommandé depuis la fiche analytique du titre',
                false
              );
              socialFeedCtrl.handleCreateFeedPost(
                'TRACK_VINYL',
                {
                  kind: 'TRACK',
                  trackId: activeTrackSheetData.track.id,
                  entityName: activeTrackSheetData.track.artist,
                  title: activeTrackSheetData.track.title,
                  subtitle: activeTrackSheetData.track.artist,
                  genre: activeTrackSheetData.track.category,
                  cover: activeTrackSheetData.track.cover,
                  artworkType: activeTrackSheetData.track.artworkType,
                  bpm: activeTrackSheetData.track.bpm,
                },
                'Recommandé depuis la fiche Studio du titre'
              );
            }}
            onToggleSubscribeArtist={(artName) => {
              onToggleSubscribeArtist?.(artName);
            }}
            onOpenEntityProfile={(name, role) => openUserEntitySheet(name, role)}
            onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
            onOpenEqModal={() => setActiveModal('EQ')}
            onOpenTrendStudio={() => {
              const sheetTrack = activeTrackSheetData.track;
              openTrendStudioWithConfig('DROP_MUSIC_30S', {
                kind: 'TRACK',
                trackId: sheetTrack.id,
                entityName: sheetTrack.artist,
                title: sheetTrack.title,
                subtitle: sheetTrack.artist,
                genre: sheetTrack.category,
                cover: sheetTrack.cover,
                artworkType: sheetTrack.artworkType,
                bpm: sheetTrack.bpm,
              });
            }}
            onConfirmCreditHandshake={onConfirmCreditHandshake}
            onOpenCreditDispute={onOpenCreditDispute}
            onResolveCreditDispute={onResolveCreditDispute}
          />
        ) : activeEntitySheetData ? (
          <ReusableArtistDetailSheet
            analytics={activeEntitySheetData}
            trackRankMap={trackRankMap}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
            rightsLines={rightsLines}
            payoutStatement={payoutStatements.find(
              (s) =>
                s.holderName.trim().toLowerCase() ===
                activeEntitySheetData.entityName.trim().toLowerCase()
            )}
            royaltySettings={royaltySettings}
            onClose={closeAllAnalyticsSheets}
            onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
            onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
            onOpenEntityProfile={(name, role) => openUserEntitySheet(name, role)}
            onOpenUserProfile={(uId) => openUserListenerSheet(uId)}
            onToggleSubscribeArtist={(artName) => onToggleSubscribeArtist?.(artName)}
          />
        ) : activeUserSheetData ? (
          <ReusableUserProfileSheet
            user={activeUserSheetData.user}
            userRank={activeUserSheetData.rank}
            isOwnProfile={currentUser?.id === activeUserSheetData.user.id}
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
            onOpenEntityProfile={(name, role) => openUserEntitySheet(name, role)}
            onClose={closeAllAnalyticsSheets}
            onSelectTrackDetail={(tId) => openUserTrackSheet(tId)}
            onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
          />
        ) : instantSearchResults ? (
          <CentralInstantSearchView state={state} />
        ) : (
          <>
            <CentralExplorerTab state={state} />
            <CentralRankingsTab state={state} />
            <CentralAwardsTab state={state} />
            <CentralRecosAndArtistsTabs state={state} />
            {hubTab === 'MISSIONS' && (
              <CentralMissionsTab
                currentUser={currentUser}
                catalogue={state.catalogue}
                onPlayOrToggleTrack={handlePlayOrToggleSpecificTrack}
                onOpenWalletModal={() => setIsTokenWalletOpen(true)}
                onCloseCentral={() => {
                  closeAllAnalyticsSheets();
                  setActiveModal('NONE');
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Pile Fixe en Bas : Mini-Lecteur (sur Mobile/Drawer) + Recherche Instantanée + Navigation */}
      <div className="pt-2.5 space-y-2.5 shrink-0 border-t border-white/[0.08]">
        {!isEmbeddedDesktopConsole && (
          <SynchronizedMiniPlayer
            currentTrack={currentTrack}
            currentTime={currentTime}
            isPlaying={isPlaying}
            isDropMode={isDropMode}
            rankInfo={safeRankInfo}
            onTogglePlay={onTogglePlay}
            onNavigateTrack={onNavigateTrack}
            onExpandPlayer={() => {
              closeAllAnalyticsSheets();
              setActiveModal('NONE');
            }}
            onOpenTrackSheet={() => openUserTrackSheet(currentTrack.id)}
            onOpenArtistProfile={() => openUserEntitySheet(currentTrack.artist, 'ARTIST')}
          />
        )}

        {/* Barre de Recherche Instantanée */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none stroke-[2.4]" />
          <input
            ref={searchInputRef}
            type="text"
            value={hubSearchQuery}
            onChange={(e) => {
              if (hasOpenAnalyticsSheet) {
                closeAllAnalyticsSheets();
              }
              setHubSearchQuery(e.target.value);
            }}
            placeholder="Rechercher un titre, artiste, genre, label, beatmaker..."
            className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-[#07090E] hover:bg-[#0D1017] focus:bg-[#07090E] border border-white/15 focus:border-amber-400 text-xs sm:text-sm text-[#F8FAFC] placeholder-[#A3A9BA]/75 focus:outline-none shadow-lg transition"
          />
          {hubSearchQuery.trim().length > 0 && (
            <div className="absolute right-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                {instantSearchResults?.totalCount ?? 0}
              </span>
              <button
                type="button"
                onClick={() => {
                  setHubSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Principale Central */}
        <nav
          aria-label="Navigation principale Central"
          className={`grid ${
            enableAwardsCeremony ? 'grid-cols-6' : 'grid-cols-5'
          } gap-1.5 pt-1 pb-0.5`}
        >
          {(
            [
              {
                id: 'EXPLORER',
                label: 'Explorer',
                icon: <Compass className="w-4 h-4 stroke-[2]" />,
              },
              {
                id: 'RANGS',
                label: 'Classements',
                icon: <ChartNoAxesColumn className="w-4 h-4 stroke-[2]" />,
              },
              {
                id: 'MISSIONS' as const,
                label: 'Missions',
                icon: <Zap className="w-4 h-4 stroke-[2]" />,
                badgeCount: availableMissionsCount,
              },
              ...(enableAwardsCeremony
                ? [
                    {
                      id: 'AWARDS' as const,
                      label: 'Awards',
                      icon: <Trophy className="w-4 h-4 stroke-[2]" />,
                    },
                  ]
                : []),
              {
                id: 'RECOS',
                label: 'Fil Recos',
                icon: <MessageCircle className="w-4 h-4 stroke-[2]" />,
              },
              {
                id: 'PROFIL',
                label: 'Mon Profil',
                icon: <UserRound className="w-4 h-4 stroke-[2]" />,
              },
            ] as const
          ).map((item) => {
            const isActive =
              hubTab === item.id &&
              !instantSearchResults &&
              !hasOpenAnalyticsSheet;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING_SNAPPY}
                onClick={() => {
                  closeAllAnalyticsSheets();
                  setCentralFullPageView(null);
                  setHubSearchQuery('');
                  setHubTab(item.id);
                }}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border cursor-pointer ${
                  isActive
                    ? item.id === 'MISSIONS'
                      ? 'bg-amber-500 border-amber-300 text-[#080A0F] font-bold shadow-[0_6px_16px_rgba(245,158,11,0.38)]'
                      : 'bg-[#DE1B34] border-[#FF4D64] text-white font-bold shadow-[0_6px_16px_rgba(222,27,52,0.38)]'
                    : 'bg-[#07090E]/80 border-white/[0.06] text-[#A3A9BA] hover:text-[#F8FAFC] hover:border-white/15'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {item.icon}
                  {'badgeCount' in item && typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#DE1B34] text-white text-[8.5px] font-mono font-black flex items-center justify-center shadow-md border border-[#080A0F]">
                      {item.badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-none truncate max-w-full">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      <UserTokenWalletModal
        isOpen={isTokenWalletOpen}
        onClose={() => setIsTokenWalletOpen(false)}
        userId={currentUser?.id || 'usr-default'}
        currentActivePass={subscriptionPass}
        onPassRedeemed={(newPass) => {
          if (onChangeSubscriptionPass) onChangeSubscriptionPass(newPass);
        }}
        onToast={showToast}
      />
    </motion.div>
  );
};
