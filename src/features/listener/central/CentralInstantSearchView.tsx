import React from 'react';
import { Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { triggerBeatAudioDownload } from '../../../services/musicService';
import {
  RankBadgeSvg,
  CertificationBadgeSvg,
} from '../../../components/ReusableAnalyticsSheets';
import { getTrackCertification } from '../../../utils/rankingEngine';
import { highlightMatchedText } from '../../../components/player/playerEngineHelpers';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { MusicIntelligenceSearchBanner } from '../../music-intelligence';
import type { ReturnTypeUseImmersivePlayerState } from '../hooks/useImmersivePlayerState';

export const CentralInstantSearchView: React.FC<{ state: ReturnTypeUseImmersivePlayerState }> = ({
  state,
}) => {
  const {
    currentTrack,
    isPlaying,
    trackRankMap,
    setHubTab,
    setCentralFullPageView,
    hubSearchQuery,
    setHubSearchQuery,
    showToast,
    openUserTrackSheet,
    openUserEntitySheet,
    handlePlayOrToggleSpecificTrack,
    instantSearchResults,
  } = state;

  if (!instantSearchResults) return null;

  return (
    <div className="space-y-3.5 animate-fade-in">
      <MusicIntelligenceSearchBanner
        query={hubSearchQuery}
        onChangeQuery={setHubSearchQuery}
      />

      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-amber-300">
          Recherche « {hubSearchQuery} » ({instantSearchResults.totalCount} résultat
          {instantSearchResults.totalCount > 1 ? 's' : ''})
        </span>
        <button
          type="button"
          onClick={() => setHubSearchQuery('')}
          className="text-[11px] font-semibold text-[#A3A9BA] hover:text-[#F8FAFC]"
        >
          Réinitialiser
        </button>
      </div>

      {instantSearchResults.totalCount === 0 && (
        <div className="p-6 rounded-2xl bg-[#07090E] border border-white/[0.08] text-center space-y-2">
          <p className="text-xs font-bold text-[#F8FAFC]">
            Aucune correspondance pour « {hubSearchQuery} »
          </p>
          <p className="text-[11px] text-[#A3A9BA]">
            Essayez un titre, un artiste, un beatmaker ou un genre musical.
          </p>
          <button
            type="button"
            onClick={() => setHubSearchQuery('')}
            className="mt-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#F8FAFC]"
          >
            Afficher tout le catalogue
          </button>
        </div>
      )}

      {/* Genres correspondants */}
      {instantSearchResults.genres.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A9BA] px-1 block">
            Genres ({instantSearchResults.genres.length})
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {instantSearchResults.genres.map((g) => (
              <motion.button
                key={g}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING_SNAPPY}
                onClick={() => {
                  setHubSearchQuery('');
                  setHubTab('EXPLORER');
                  setCentralFullPageView({
                    type: 'GENRE',
                    genre: g,
                    title: g,
                    accentColor: '#f59e0b',
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-[#07090E] hover:bg-amber-400 text-amber-300 hover:text-[#080A0F] border border-amber-400/35 text-xs font-bold whitespace-nowrap shrink-0"
              >
                {highlightMatchedText(g, hubSearchQuery)} →
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Beats & Instrumentales téléchargeables (Max 3 points de données par carte) */}
      {instantSearchResults.beats.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 px-1 block">
            Beats &amp; Instrumentales Studio ({instantSearchResults.beats.length})
          </span>
          {instantSearchResults.beats.map(({ track: t, albumIndex, trackIndex }) => {
            const isThisPlaying = currentTrack.id === t.id && isPlaying;
            return (
              <motion.div
                key={t.id}
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.99 }}
                transition={SPRING_SNAPPY}
                onClick={() => handlePlayOrToggleSpecificTrack(albumIndex, trackIndex)}
                className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border cursor-pointer ${
                  currentTrack.id === t.id
                    ? 'bg-[#121622] border-amber-400/50'
                    : 'bg-[#07090E]/90 border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 cover-card-bevel">
                    <CoverArtwork
                      artworkType={t.artworkType}
                      coverUrl={t.cover}
                      title={t.title}
                      artist={t.artist}
                    />
                    <span className="absolute inset-0 bg-[#07090E]/45 flex items-center justify-center text-white">
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
                      className="text-xs sm:text-sm font-bold text-[#F8FAFC] hover:text-amber-300 truncate block max-w-full text-left transition-colors"
                    >
                      {highlightMatchedText(t.title, hubSearchQuery)}
                    </button>
                    <div className="text-[11px] text-[#A3A9BA] truncate flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUserEntitySheet(t.beatmakerName || t.artist, 'BEATMAKER');
                        }}
                        className="hover:text-amber-300 hover:underline truncate text-left"
                      >
                        Prod. {highlightMatchedText(t.beatmakerName || t.artist, hubSearchQuery)}
                      </button>
                      <span>·</span>
                      <span className="font-mono text-amber-300 shrink-0">
                        {t.bpm ? `${t.bpm} BPM` : 'BPM —'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
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
                      showToast(`Téléchargement du Beat « ${t.title} » lancé !`, 'bg-amber-400');
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border bg-amber-400/15 hover:bg-amber-400/25 border-amber-400/40 text-amber-300"
                  >
                    ⬇ Beat
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openUserTrackSheet(t.id);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border bg-[#121622] hover:bg-[#191F2E] border-white/10 text-[#F8FAFC]"
                  >
                    Fiche
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Titres correspondants (Règle des 3 points de données : Pochette + Titre/Artiste + Rang/Fiche) */}
      {instantSearchResults.tracks.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A9BA] px-1 block">
            Titres &amp; Featurings ({instantSearchResults.tracks.length})
          </span>
          {instantSearchResults.tracks.map(({ track: t, albumIndex, trackIndex }) => {
            const isThisPlaying = currentTrack.id === t.id && isPlaying;
            const rInfo = trackRankMap[t.id] || { rank: 1, delta: 0 };
            const cert = getTrackCertification(t.realPlays);
            return (
              <motion.div
                key={t.id}
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.99 }}
                transition={SPRING_SNAPPY}
                onClick={() => handlePlayOrToggleSpecificTrack(albumIndex, trackIndex)}
                className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border cursor-pointer ${
                  currentTrack.id === t.id
                    ? 'bg-[#121622] border-[#DE1B34]/55'
                    : 'bg-[#07090E]/90 border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 cover-card-bevel">
                    <CoverArtwork
                      artworkType={t.artworkType}
                      coverUrl={t.cover}
                      title={t.title}
                      artist={t.artist}
                    />
                    <span className="absolute inset-0 bg-[#07090E]/45 flex items-center justify-center text-white">
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUserTrackSheet(t.id);
                        }}
                        className="text-xs sm:text-sm font-bold text-[#F8FAFC] hover:text-amber-300 truncate text-left transition-colors"
                      >
                        {highlightMatchedText(t.title, hubSearchQuery)}
                      </button>
                      <CertificationBadgeSvg cert={cert} compact />
                    </div>
                    <div className="text-[11px] text-[#A3A9BA] truncate flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUserEntitySheet(t.artist, 'ARTIST');
                        }}
                        className="hover:text-amber-300 hover:underline truncate text-left"
                      >
                        {highlightMatchedText(t.artist, hubSearchQuery)}
                        {t.featuringArtists && t.featuringArtists.length > 0
                          ? ` feat. ${t.featuringArtists.join(', ')}`
                          : ''}
                      </button>
                      <span className="shrink-0">
                        · {highlightMatchedText(t.category, hubSearchQuery)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/35 text-amber-300 font-mono text-[10px] font-bold">
                    {t.bpm || 120} BPM
                  </span>
                  <RankBadgeSvg rank={rInfo.rank} delta={rInfo.delta} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openUserTrackSheet(t.id);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border bg-[#121622] hover:bg-[#191F2E] border-white/10 text-[#F8FAFC]"
                  >
                    Fiche
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Artistes, Paroliers, Beatmakers, Ingés Son & Labels correspondants */}
      {instantSearchResults.entities.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A9BA] px-1 block">
            Artistes &amp; Talents Studio ({instantSearchResults.entities.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {instantSearchResults.entities.map((ent) => (
              <motion.button
                key={ent.key}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SNAPPY}
                onClick={() => openUserEntitySheet(ent.name, ent.role)}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 text-left"
              >
                <CoverArtwork
                  artworkType={ent.artworkType}
                  coverUrl={ent.cover}
                  title={ent.name}
                  artist={ent.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/92 via-[#07090E]/35 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] truncate">
                    {highlightMatchedText(ent.name, hubSearchQuery)}
                  </p>
                  <span className="text-[10px] text-amber-300 font-semibold">
                    {ent.role === 'ARTIST'
                      ? 'Artiste'
                      : ent.role === 'BEATMAKER'
                        ? 'Beatmaker'
                        : ent.role === 'LYRICIST'
                          ? 'Parolier'
                          : ent.role === 'ENGINEER'
                            ? 'Ingé Son'
                            : 'Label'}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
