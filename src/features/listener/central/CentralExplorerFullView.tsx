import React from 'react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import { Play, Pause } from 'lucide-react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { CertificationBadgeSvg } from '../../../components/ReusableAnalyticsSheets';
import { getTrackCertification } from '../../../utils/rankingEngine';
import { triggerBeatAudioDownload } from '../../../services/musicService';
import type { ReturnTypeUseImmersivePlayerState } from '../hooks/useImmersivePlayerState';

export interface CentralExplorerFullViewProps {
  state: ReturnTypeUseImmersivePlayerState;
}

export const CentralExplorerFullView: React.FC<CentralExplorerFullViewProps> = ({ state }) => {
  const {
    centralFullPageView,
    setCentralFullPageView,
    decoupledStudioRankings,
    allTracksFlat,
    currentTrack,
    isPlaying,
    openUserEntitySheet,
    openUserTrackSheet,
    handlePlayOrToggleSpecificTrack,
    catalogue,
    showToast,
  } = state;

  if (!centralFullPageView) return null;
  const onClose = () => setCentralFullPageView(null);
  return (
    <div className="space-y-4 animate-fade-in font-mono">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
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

      {/* 1. Métiers Studio */}
      {centralFullPageView.type === 'ROLE' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {decoupledStudioRankings
            .filter((ent) => centralFullPageView.role === 'ALL' || ent.role === centralFullPageView.role)
            .map((ent) => (
              <motion.button
                key={ent.key}
                type="button"
                whileHover={{ y: -5, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SNAPPY}
                onClick={() => openUserEntitySheet(ent.name, ent.role)}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 text-left cursor-pointer transition-colors"
              >
                <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                  <CoverArtwork artworkType={ent.artworkType} coverUrl={ent.cover} title={ent.name} artist={ent.name} />
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, rgba(0,0,0,0.92) 12%, ${centralFullPageView.accentColor}44 55%, rgba(0,0,0,0.18) 100%)`,
                  }}
                />
                <div className="absolute top-2.5 right-2.5">
                  {ent.careerCertification && ent.careerCertification.level !== 'NONE' && (
                    <CertificationBadgeSvg cert={ent.careerCertification} compact entityTitle={ent.name} />
                  )}
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow">{ent.name}</p>
                  <span className="text-[11px] text-white/80 font-medium block truncate">{ent.primaryMetricValue}</span>
                </div>
              </motion.button>
            ))}
        </div>
      )}

      {/* 2. Genre Musical */}
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
              const isThisPlaying = currentTrack.id === t.id && isPlaying;
              const tCert = getTrackCertification(t.realPlays);
              return (
                <motion.div
                  key={t.id}
                  whileHover={{ y: -5, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => handlePlayOrToggleSpecificTrack(albumIndex, trackIndex)}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-colors"
                >
                  <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                    <CoverArtwork artworkType={t.artworkType} coverUrl={t.cover} title={t.title} artist={t.artist} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/92 via-[#07090E]/35 to-black/15" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <CertificationBadgeSvg cert={tCert} compact entityTitle={t.title} entityArtist={t.artist} playsCount={t.realPlays} />
                    <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-lg">
                      {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
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
                          className="text-sm font-extrabold text-white hover:text-amber-300 truncate drop-shadow block max-w-full text-left transition-colors cursor-pointer"
                        >
                          {t.title}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserEntitySheet(t.artist, 'ARTIST');
                          }}
                          className="text-xs text-amber-300 hover:underline font-semibold truncate block max-w-full text-left cursor-pointer"
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
                        className="px-2 py-1 rounded-lg bg-[#07090E]/75 hover:bg-amber-400 hover:text-[#080A0F] border border-white/20 text-[10px] font-bold text-white shrink-0 transition cursor-pointer"
                      >
                        Fiche
                      </button>
                    </div>
                    {(t.isInstrumental || t.category === 'Beats & Instrumentales') && (
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
                          showToast(`Téléchargement du Beat « ${t.title} » lancé`, 'bg-cyan-400');
                        }}
                        className="w-full py-1.5 px-2 rounded-xl bg-cyan-500/85 hover:bg-cyan-400 text-black font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-lg transition cursor-pointer"
                      >
                        <span>⬇ Télécharger le Beat</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* 3. Tous les Drops Panoramiques */}
      {centralFullPageView.type === 'DROPS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {allTracksFlat.map(({ track: t, albumIndex, trackIndex }) => {
            const isThisPlaying = currentTrack.id === t.id && isPlaying;
            const tCert = getTrackCertification(t.realPlays);
            return (
              <motion.div
                key={t.id}
                whileHover={{ y: -5, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SNAPPY}
                onClick={() => handlePlayOrToggleSpecificTrack(albumIndex, trackIndex)}
                className="group relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-colors"
              >
                <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                  <CoverArtwork artworkType={t.artworkType} coverUrl={t.cover} title={t.title} artist={t.artist} />
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, rgba(0,0,0,0.92) 15%, ${t.ambientPrimary || '#e11d38'}55 60%, rgba(0,0,0,0.2) 100%)`,
                  }}
                />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <CertificationBadgeSvg cert={tCert} compact entityTitle={t.title} entityArtist={t.artist} playsCount={t.realPlays} />
                  <span className="w-9 h-9 rounded-full bg-[#e11d38] text-white flex items-center justify-center font-bold text-xs shadow-lg">
                    {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
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
                      className="text-base font-extrabold text-white hover:text-amber-300 truncate drop-shadow block max-w-full text-left transition-colors cursor-pointer"
                    >
                      {t.title}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserEntitySheet(t.artist, 'ARTIST');
                      }}
                      className="text-xs text-amber-300 hover:underline font-bold truncate block max-w-full text-left cursor-pointer"
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
                    className="px-2.5 py-1 rounded-xl bg-[#080A0F]/80 hover:bg-amber-400 hover:text-[#080A0F] border border-white/20 text-xs font-bold text-white shrink-0 transition cursor-pointer"
                  >
                    Fiche
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. Tous les Albums & Projets */}
      {centralFullPageView.type === 'ALBUMS' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {catalogue.map((alb, aIdx) => {
            const firstTrack = alb.tracks[0] || currentTrack;
            return (
              <motion.div
                key={alb.id}
                whileHover={{ y: -5, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SNAPPY}
                onClick={() => handlePlayOrToggleSpecificTrack(aIdx, 0)}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/15 hover:border-amber-400 cursor-pointer transition-colors"
              >
                <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                  <CoverArtwork artworkType={firstTrack.artworkType} coverUrl={firstTrack.cover} title={alb.albumTitle} artist={alb.artist} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090E]/92 via-[#07090E]/35 to-[#07090E]/15" />
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-[#080A0F]/80 border border-white/20 text-[10px] font-mono text-white/90">
                    {alb.tracks.length} titres
                  </span>
                  <span className="w-8 h-8 rounded-full bg-amber-400 text-[#080A0F] flex items-center justify-center font-bold text-xs shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 space-y-1">
                  <p className="text-sm font-extrabold text-white truncate drop-shadow">{alb.albumTitle}</p>
                  <p className="text-xs text-amber-300 truncate">{alb.artist}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
