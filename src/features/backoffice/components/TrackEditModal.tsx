import React from 'react';
import { X } from 'lucide-react';
import {
  uploadCoverFile,
  fileToPersistentDataUrl,
} from '../../../services/musicService';
import type { FeaturingSplitMode } from '../../../utils/rankingEngine';
import type { EntityDatabase } from '../../../shared/types/domain.types';
import type { EditingTrackState } from '../backoffice.types';

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
          {!editingTrack.track.isInstrumental && (
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

