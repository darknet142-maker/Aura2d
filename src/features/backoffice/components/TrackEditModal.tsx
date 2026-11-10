import React from 'react';
import { X } from 'lucide-react';
import {
  uploadCoverFile,
  fileToPersistentDataUrl,
} from '../../../services/musicService';
import type { FeaturingSplitMode } from '../../../utils/rankingEngine';
import type { EntityDatabase } from '../../../shared/types/domain.types';
import type { EditingTrackState } from '../backoffice.types';
import { AnalysisReview, ensureTrackSurgicalAnalysis } from '../../music-intelligence';
import { formatLyricsToRawText, parseRawLyricsInput, generateStandardLyricsTemplate } from '../services/lyrics-parser.service';

export interface TrackEditModalProps {
  editingTrack: EditingTrackState | null;
  setEditingTrack: React.Dispatch<
    React.SetStateAction<EditingTrackState | null>
  >;
  entityDb: EntityDatabase;
  categories: string[];
  onSaveEditedTrack: (e: React.FormEvent) => void;
}

export const TrackEditModal: React.FC<TrackEditModalProps> = ({
  editingTrack,
  setEditingTrack,
  entityDb,
  categories,
  onSaveEditedTrack,
}) => {
  if (!editingTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E]/75 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={onSaveEditedTrack}
        className="w-full max-w-md bg-[#0E1118] border border-white/15 rounded-2xl p-4 flex flex-col gap-3 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <h3 className="text-sm font-bold text-[#F5F2EB] truncate">
            Modifier — {editingTrack.track.title}
          </h3>
          <button
            type="button"
            onClick={() => setEditingTrack(null)}
            className="p-1 text-[#A3A9BA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer">
          <span className="text-xs font-bold text-amber-300">
            Piste Instrumentale (Sans paroles)
          </span>
          <input
            type="checkbox"
            checked={Boolean(editingTrack.track.isInstrumental)}
            onChange={(e) =>
              setEditingTrack({
                ...editingTrack,
                track: {
                  ...editingTrack.track,
                  isInstrumental: e.target.checked,
                },
              })
            }
            className="w-4 h-4 accent-amber-400"
          />
        </label>

        {/* Cycle de Vie & Statut de Publication */}
        <div className="p-3 rounded-xl bg-[#07080C] border border-white/10 space-y-2.5">
          <label className="block text-[11px] font-bold text-[#F8FAFC]">
            Statut de Publication &amp; Diffusion
          </label>
          <div className="grid grid-cols-4 gap-1.5 text-[11px]">
            {(
              [
                { id: 'PUBLISHED', label: 'En ligne' },
                { id: 'SCHEDULED', label: 'Programmé' },
                { id: 'PENDING', label: 'En attente' },
                { id: 'DRAFT', label: 'Brouillon' },
              ] as const
            ).map((st) => {
              const active = (editingTrack.track.releaseStatus || 'PUBLISHED') === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() =>
                    setEditingTrack({
                      ...editingTrack,
                      track: { ...editingTrack.track, releaseStatus: st.id },
                    })
                  }
                  className={`py-1.5 px-2 rounded-lg font-bold text-center cursor-pointer transition ${
                    active
                      ? st.id === 'PUBLISHED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : st.id === 'SCHEDULED'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : st.id === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-zinc-700/60 text-zinc-200 border border-zinc-600/40'
                      : 'bg-white/5 text-[#A3A9BA] hover:text-white border border-white/5'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {editingTrack.track.releaseStatus === 'SCHEDULED' && (
            <div className="pt-1">
              <label className="block text-[10.5px] text-[#A3A9BA] mb-1">
                Date &amp; Heure de publication programmée
              </label>
              <input
                type="datetime-local"
                value={
                  editingTrack.track.scheduledPublishDate
                    ? editingTrack.track.scheduledPublishDate.slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setEditingTrack({
                    ...editingTrack,
                    track: {
                      ...editingTrack.track,
                      scheduledPublishDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    },
                  })
                }
                className="w-full bg-[#0E1118] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
              />
            </div>
          )}

          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-[11px] text-[#CBD5E1]">Master Audio Immersif 3D / Spatial</span>
            <input
              type="checkbox"
              checked={Boolean(editingTrack.track.isSpatialAudio || editingTrack.track.category === 'Immersif 3D')}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: {
                    ...editingTrack.track,
                    isSpatialAudio: e.target.checked,
                  },
                })
              }
              className="w-3.5 h-3.5 accent-[#DE1B34]"
            />
          </label>
        </div>

        {/* Annonce Sponsorisée sur le Lecteur (Cover Flow) */}
        <div className="p-3 rounded-xl bg-[#DE1B34]/10 border border-[#DE1B34]/30 space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold text-rose-300 block">
                ✦ Annonce Sponsorisée Broadcast (Cover Flow)
              </span>
              <span className="text-[10px] text-[#A3A9BA]">
                Affiche une publicité au balayage sur le lecteur avec boutons masqués
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(editingTrack.track.isSponsoredAnnouncement)}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: {
                    ...editingTrack.track,
                    isSponsoredAnnouncement: e.target.checked,
                    sponsoredCampaign: e.target.checked
                      ? editingTrack.track.sponsoredCampaign || {
                          brandName: editingTrack.track.labelName || 'Airtel Gabon',
                          tagline: 'Offre Spéciale Broadcast • Écoute sans modération',
                          ctaText: 'Découvrir',
                          ctaUrl: 'https://drop.ga',
                        }
                      : undefined,
                  },
                })
              }
              className="w-4 h-4 accent-[#DE1B34]"
            />
          </label>

          {editingTrack.track.isSponsoredAnnouncement && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DE1B34]/20 text-[11px]">
              <div>
                <label className="block text-[10px] text-[#A3A9BA] mb-1">Nom de la marque / Annonceur</label>
                <input
                  type="text"
                  value={editingTrack.track.sponsoredCampaign?.brandName || ''}
                  onChange={(e) =>
                    setEditingTrack({
                      ...editingTrack,
                      track: {
                        ...editingTrack.track,
                        sponsoredCampaign: {
                          brandName: e.target.value,
                          tagline: editingTrack.track.sponsoredCampaign?.tagline || '',
                          ctaText: editingTrack.track.sponsoredCampaign?.ctaText || 'Découvrir',
                          ctaUrl: editingTrack.track.sponsoredCampaign?.ctaUrl || '',
                        },
                      },
                    })
                  }
                  placeholder="Ex: Airtel Gabon, Canal+, Gloss"
                  className="w-full bg-[#07080C] border border-white/10 rounded-xl px-2 py-1 text-xs text-[#F5F2EB]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#A3A9BA] mb-1">Texte du Bouton CTA</label>
                <input
                  type="text"
                  value={editingTrack.track.sponsoredCampaign?.ctaText || ''}
                  onChange={(e) =>
                    setEditingTrack({
                      ...editingTrack,
                      track: {
                        ...editingTrack.track,
                        sponsoredCampaign: {
                          brandName: editingTrack.track.sponsoredCampaign?.brandName || '',
                          tagline: editingTrack.track.sponsoredCampaign?.tagline || '',
                          ctaText: e.target.value,
                          ctaUrl: editingTrack.track.sponsoredCampaign?.ctaUrl || '',
                        },
                      },
                    })
                  }
                  placeholder="Ex: Activer le Pass, Découvrir"
                  className="w-full bg-[#07080C] border border-white/10 rounded-xl px-2 py-1 text-xs text-[#F5F2EB]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-[#A3A9BA] mb-1">Message / Accroche promotionnelle</label>
                <input
                  type="text"
                  value={editingTrack.track.sponsoredCampaign?.tagline || ''}
                  onChange={(e) =>
                    setEditingTrack({
                      ...editingTrack,
                      track: {
                        ...editingTrack.track,
                        sponsoredCampaign: {
                          brandName: editingTrack.track.sponsoredCampaign?.brandName || '',
                          tagline: e.target.value,
                          ctaText: editingTrack.track.sponsoredCampaign?.ctaText || 'Découvrir',
                          ctaUrl: editingTrack.track.sponsoredCampaign?.ctaUrl || '',
                        },
                      },
                    })
                  }
                  placeholder="Ex: Forfait Nuit Illimité 500F • Écoutez sans modération"
                  className="w-full bg-[#07080C] border border-white/10 rounded-xl px-2 py-1 text-xs text-[#F5F2EB]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-[#A3A9BA] mb-1">
              Titre
            </label>
            <input
              type="text"
              value={editingTrack.track.title}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: { ...editingTrack.track, title: e.target.value },
                })
              }
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#A3A9BA] mb-1">
              Artiste
            </label>
            <select
              value={
                entityDb.artists.includes(editingTrack.track.artist)
                  ? editingTrack.track.artist
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  setEditingTrack({
                    ...editingTrack,
                    track: { ...editingTrack.track, artist: e.target.value },
                  });
                }
              }}
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2 py-1 text-[11px] text-[#F5F2EB] mb-1"
            >
              <option value="">Sélectionner dans la BDD</option>
              {entityDb.artists.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={editingTrack.track.artist}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: { ...editingTrack.track, artist: e.target.value },
                })
              }
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-sky-300 mb-1">
              Artistes en Featuring
            </label>
            <input
              type="text"
              value={
                editingTrack.featuringInput !== undefined
                  ? editingTrack.featuringInput
                  : (editingTrack.track.featuringArtists || []).join(', ')
              }
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  featuringInput: e.target.value,
                })
              }
              placeholder="Ex: Eboloko, Ng Bling"
              className="w-full bg-[#07080C] border border-sky-500/30 rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-sky-300 mb-1">
              Partage Featuring
            </label>
            <select
              value={editingTrack.track.featuringSplitMode || '70_30'}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: {
                    ...editingTrack.track,
                    featuringSplitMode: e.target.value as FeaturingSplitMode,
                  },
                })
              }
              className="w-full bg-[#07080C] border border-sky-500/30 rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            >
              <option value="70_30">70% Lead / 30% Feat</option>
              <option value="50_50">50% / 50% Co-Lead</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#A3A9BA] mb-1">
              Catégorie
            </label>
            <select
              value={editingTrack.track.category}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: { ...editingTrack.track, category: e.target.value },
                })
              }
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#A3A9BA] mb-1">
              Durée (MM:SS)
            </label>
            <input
              type="text"
              value={editingTrack.durationFormatted}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  durationFormatted: e.target.value,
                })
              }
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#F59E0B]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[#A3A9BA] mb-1">
                Début Drop (sec)
              </label>
              <input
                type="number"
                min={0}
                value={editingTrack.track.dropStart || 0}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setEditingTrack({
                    ...editingTrack,
                    track: { ...editingTrack.track, dropStart: val },
                  });
                }}
                className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#F59E0B]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#A3A9BA] mb-1">
                Durée Drop (sec)
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={editingTrack.track.dropDuration || 30}
                onChange={(e) => {
                  const val = Math.min(30, Math.max(5, parseInt(e.target.value, 10) || 30));
                  setEditingTrack({
                    ...editingTrack,
                    track: { ...editingTrack.track, dropDuration: val },
                  });
                }}
                className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#F59E0B]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-[#A3A9BA] mb-1">
              Label
            </label>
            <select
              value={
                entityDb.labels.includes(editingTrack.track.labelName)
                  ? editingTrack.track.labelName
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  setEditingTrack({
                    ...editingTrack,
                    track: { ...editingTrack.track, labelName: e.target.value },
                  });
                }
              }}
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2 py-1 text-[11px] text-[#F5F2EB] mb-1"
            >
              <option value="">Sélectionner dans la BDD</option>
              {entityDb.labels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={editingTrack.track.labelName}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: { ...editingTrack.track, labelName: e.target.value },
                })
              }
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#A3A9BA] mb-1">
              Beatmaker
            </label>
            <select
              value={
                entityDb.beatmakers.includes(editingTrack.track.beatmakerName)
                  ? editingTrack.track.beatmakerName
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  setEditingTrack({
                    ...editingTrack,
                    track: {
                      ...editingTrack.track,
                      beatmakerName: e.target.value,
                    },
                  });
                }
              }}
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2 py-1 text-[11px] text-[#F5F2EB] mb-1"
            >
              <option value="">Sélectionner dans la BDD</option>
              {entityDb.beatmakers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={editingTrack.track.beatmakerName}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: {
                    ...editingTrack.track,
                    beatmakerName: e.target.value,
                  },
                })
              }
              className="w-full bg-[#07080C] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-amber-300 mb-1">
              Ingé Mixage
            </label>
            <select
              value={
                entityDb.engineers.includes(editingTrack.track.soundEngineerName)
                  ? editingTrack.track.soundEngineerName
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  setEditingTrack({
                    ...editingTrack,
                    track: {
                      ...editingTrack.track,
                      soundEngineerName: e.target.value,
                      mixingEngineerName: e.target.value,
                    },
                  });
                }
              }}
              className="w-full bg-[#07080C] border border-amber-500/30 rounded-xl px-2 py-1 text-[11px] text-[#F5F2EB] mb-1"
            >
              <option value="">Sélectionner dans la BDD</option>
              {entityDb.engineers.map((eng) => (
                <option key={eng} value={eng}>
                  {eng}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={editingTrack.track.soundEngineerName}
              onChange={(e) =>
                setEditingTrack({
                  ...editingTrack,
                  track: {
                    ...editingTrack.track,
                    soundEngineerName: e.target.value,
                    mixingEngineerName: e.target.value,
                  },
                })
              }
              className="w-full bg-[#07080C] border border-amber-500/30 rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
            />
          </div>
          {!editingTrack.track.isInstrumental && editingTrack.track.category !== 'Beats & Instrumentales' && (
            <div>
              <label className="block text-[11px] text-sky-300 mb-1">
                Parolier / Auteur
              </label>
              <select
                value={
                  entityDb.lyricists.includes(editingTrack.track.lyricistName)
                    ? editingTrack.track.lyricistName
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value) {
                    setEditingTrack({
                      ...editingTrack,
                      track: {
                        ...editingTrack.track,
                        lyricistName: e.target.value,
                      },
                    });
                  }
                }}
                className="w-full bg-[#07080C] border border-sky-500/30 rounded-xl px-2 py-1 text-[11px] text-[#F5F2EB] mb-1"
              >
                <option value="">Sélectionner dans la BDD</option>
                {entityDb.lyricists.map((lyr) => (
                  <option key={lyr} value={lyr}>
                    {lyr}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={editingTrack.track.lyricistName}
                onChange={(e) =>
                  setEditingTrack({
                    ...editingTrack,
                    track: {
                      ...editingTrack.track,
                      lyricistName: e.target.value,
                    },
                  })
                }
                className="w-full bg-[#07080C] border border-sky-500/30 rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EB]"
              />
            </div>
          )}
        </div>

        {/* Éditeur de Paroles du morceau publié (Synchronisées ou Texte Libre) */}
        {!editingTrack.track.isInstrumental && editingTrack.track.category !== 'Beats & Instrumentales' && (
          <div className="bg-[#07080C] border border-sky-500/30 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-300">
                Paroles du Morceau (Synchronisées [MM:SS] ou Texte Libre)
              </span>
              <button
                type="button"
                onClick={() => {
                  const template = generateStandardLyricsTemplate(editingTrack.track.title, editingTrack.track.artist);
                  const parsed = parseRawLyricsInput(template, editingTrack.track.duration);
                  setEditingTrack({
                    ...editingTrack,
                    track: {
                      ...editingTrack.track,
                      lyrics: parsed,
                      hasSynchronizedLyrics: true,
                    },
                  });
                }}
                className="text-[10px] font-bold text-sky-400 hover:underline cursor-pointer"
              >
                + Modèle structuré
              </button>
            </div>
            <textarea
              rows={4}
              value={formatLyricsToRawText(editingTrack.track.lyrics)}
              onChange={(e) => {
                const parsed = parseRawLyricsInput(e.target.value, editingTrack.track.duration);
                setEditingTrack({
                  ...editingTrack,
                  track: {
                    ...editingTrack.track,
                    lyrics: parsed,
                    hasSynchronizedLyrics: parsed.length > 0,
                  },
                });
              }}
              placeholder="[00:15] Premier couplet...\n[00:45] [DROP] Refrain...\nOu collez le texte brut des paroles..."
              className="w-full bg-[#0E1118] border border-white/[0.08] rounded-xl p-2.5 text-xs text-[#F8FAFC] font-mono placeholder-[#A3A9BA]/50 focus:outline-none focus:border-sky-400"
            />
            <div className="flex items-center justify-between text-[10px] text-[#A3A9BA]">
              <span>Modifiez ou ajoutez les vers. Prise en compte immédiate au lecteur.</span>
              <span className="text-emerald-400 font-mono">
                {(editingTrack.track.lyrics || []).length} vers enregistrés
              </span>
            </div>
          </div>
        )}

        <AnalysisReview
          analysis={
            editingTrack.track.trackAnalysis ||
            ensureTrackSurgicalAnalysis(editingTrack.track)
          }
          currentBpm={editingTrack.track.bpm}
          currentKey={editingTrack.track.musicalKey || 'A minor (8A)'}
          onConfirmBpm={(confirmedBpm) => {
            const baseAnalysis =
              editingTrack.track.trackAnalysis ||
              ensureTrackSurgicalAnalysis(editingTrack.track);
            setEditingTrack({
              ...editingTrack,
              track: {
                ...editingTrack.track,
                bpm: confirmedBpm,
                trackAnalysis: {
                  ...baseAnalysis,
                  confirmedBpm,
                  confirmedByHumanAt: new Date().toISOString(),
                  analysisStatus: 'completed',
                },
              },
            });
          }}
          onConfirmKey={(confirmedKey) => {
            const baseAnalysis =
              editingTrack.track.trackAnalysis ||
              ensureTrackSurgicalAnalysis(editingTrack.track);
            setEditingTrack({
              ...editingTrack,
              track: {
                ...editingTrack.track,
                musicalKey: confirmedKey,
                trackAnalysis: {
                  ...baseAnalysis,
                  confirmedKey,
                  confirmedByHumanAt: new Date().toISOString(),
                },
              },
            });
          }}
        />

        <div className="flex items-center justify-between gap-2 bg-[#07080C] p-2.5 rounded-xl border border-white/[0.07]">
          <label className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs font-medium text-[#F5F2EB] cursor-pointer">
            Changer le cover
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const uploaded = await uploadCoverFile(file, 900, 900);
                  setEditingTrack({
                    ...editingTrack,
                    track: {
                      ...editingTrack.track,
                      cover: uploaded.coverUrl,
                    },
                  });
                } catch {
                  const dataUrl = await fileToPersistentDataUrl(
                    file,
                    900,
                    900,
                    0.85
                  );
                  setEditingTrack({
                    ...editingTrack,
                    track: { ...editingTrack.track, cover: dataUrl },
                  });
                }
              }}
              className="hidden"
            />
          </label>
          {editingTrack.track.cover && (
            <button
              type="button"
              onClick={() =>
                setEditingTrack({
                  ...editingTrack,
                  track: { ...editingTrack.track, cover: '' },
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs"
            >
              Supprimer cover
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEditingTrack(null)}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] text-xs text-[#A3A9BA]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-[#DE1B34] text-white font-bold text-xs"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

