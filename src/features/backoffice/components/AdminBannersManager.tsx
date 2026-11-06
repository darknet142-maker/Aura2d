import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Upload,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import {
  uploadCoverFile,
  fileToPersistentDataUrl,
  type AdBannerSlide,
  type AdBannerSettings,
  type AdBannerPlacement,
  type AdBannerRedirectType,
} from '../../../services/musicService';
import type { AlbumNode, Track, AppNotification } from '../../../shared/types/domain.types';

export interface AdminBannersManagerProps {
  adBanners: AdBannerSlide[];
  setAdBanners: React.Dispatch<React.SetStateAction<AdBannerSlide[]>>;
  adBannerSettings: AdBannerSettings;
  setAdBannerSettings: React.Dispatch<React.SetStateAction<AdBannerSettings>>;
  allTracksFlat: Track[];
  catalogue: AlbumNode[];
  onSaveAndSyncAll: (sectionLabel?: string) => void;
  pushNotification: (
    title: string,
    message: string,
    type?: AppNotification['type']
  ) => void;
}

export const AdminBannersManager: React.FC<AdminBannersManagerProps> = ({
  adBanners,
  setAdBanners,
  adBannerSettings,
  setAdBannerSettings,
  allTracksFlat,
  catalogue,
  onSaveAndSyncAll,
  pushNotification,
}) => {
  const [newBannerImageUrl, setNewBannerImageUrl] = useState<string>('');
  const [newBannerFileName, setNewBannerFileName] = useState<string>('');
  const [newBannerPlacement, setNewBannerPlacement] =
    useState<AdBannerPlacement>('BOTH');
  const [newBannerRedirectType, setNewBannerRedirectType] =
    useState<AdBannerRedirectType>('NONE');
  const [newBannerTargetTrackId, setNewBannerTargetTrackId] =
    useState<string>('t-main-1');
  const [newBannerTargetAlbumId, setNewBannerTargetAlbumId] =
    useState<string>('alb-2');
  const [newBannerExternalUrl, setNewBannerExternalUrl] = useState<string>('');

  return (
    <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-y-auto flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#F5F2EB] flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>
              Gestionnaire des Bannières Slideshow « Central » (Haut &amp; Bas)
            </span>
          </h3>
          <p className="text-xs text-[#A3A9BA]">
            Importez vos visuels manuellement depuis votre appareil (sans texte superposé), réglez la vitesse de défilement et choisissez la redirection au clic.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onSaveAndSyncAll('Bannières Publicitaires & Timing Slideshow')
          }
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Sauvegarder &amp; Synchroniser Bannières</span>
        </button>
      </div>

      {/* 1. RÉGLAGES GLOBAUX DE TIMING, VITESSE DE TRANSITION ET ACTIVATION */}
      <div className="p-3.5 rounded-2xl bg-[#07080C] border border-amber-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
          <span className="text-xs font-bold text-[#F5F2EB]">Bannière Haut</span>
          <input
            type="checkbox"
            checked={adBannerSettings.enableTopBanner}
            onChange={(e) =>
              setAdBannerSettings((prev) => ({
                ...prev,
                enableTopBanner: e.target.checked,
              }))
            }
            className="w-4 h-4 accent-emerald-400"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
          <span className="text-xs font-bold text-[#F5F2EB]">Bannière Bas</span>
          <input
            type="checkbox"
            checked={adBannerSettings.enableBottomBanner}
            onChange={(e) =>
              setAdBannerSettings((prev) => ({
                ...prev,
                enableBottomBanner: e.target.checked,
              }))
            }
            className="w-4 h-4 accent-emerald-400"
          />
        </label>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#A3A9BA]">Timing par slide</span>
            <span className="font-mono font-bold text-amber-300">
              {adBannerSettings.slideIntervalSec}s
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={15}
            step={1}
            value={adBannerSettings.slideIntervalSec}
            onChange={(e) =>
              setAdBannerSettings((prev) => ({
                ...prev,
                slideIntervalSec: Number(e.target.value),
              }))
            }
            className="w-full accent-amber-400"
          />
        </div>

        <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#A3A9BA]">Vitesse défilement</span>
            <span className="font-mono font-bold text-emerald-400">
              {adBannerSettings.transitionDurationMs} ms
            </span>
          </div>
          <input
            type="range"
            min={200}
            max={1500}
            step={50}
            value={adBannerSettings.transitionDurationMs}
            onChange={(e) =>
              setAdBannerSettings((prev) => ({
                ...prev,
                transitionDurationMs: Number(e.target.value),
              }))
            }
            className="w-full accent-emerald-400"
          />
        </div>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.07] cursor-pointer">
          <span className="text-xs font-bold text-[#F5F2EB]">Pause au toucher</span>
          <input
            type="checkbox"
            checked={adBannerSettings.pauseOnTouch}
            onChange={(e) =>
              setAdBannerSettings((prev) => ({
                ...prev,
                pauseOnTouch: e.target.checked,
              }))
            }
            className="w-4 h-4 accent-amber-400"
          />
        </label>
      </div>

      {/* 2. FORMULAIRE D'AJOUT D'UNE NOUVELLE SLIDE */}
      <div className="p-4 rounded-2xl bg-[#07080C] border border-white/[0.08] flex flex-col gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
          + Ajouter une nouvelle slide publicitaire (Upload d'image depuis l'appareil)
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="flex flex-col gap-2">
            <label className="w-full aspect-video rounded-xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-[#0D1017] flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden relative transition">
              {newBannerImageUrl ? (
                <img
                  src={newBannerImageUrl}
                  alt="Aperçu bannière Full HD"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-[#F5F2EB] text-center px-2">
                    Choisir une image Full HD (1920×1080)
                  </span>
                  <span className="text-[10px] text-[#A3A9BA]">
                    Format 16:9 Full HD • JPG, PNG, WebP (Sans texte)
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setNewBannerFileName(file.name);
                  try {
                    const uploaded = await uploadCoverFile(file, 1920, 1080, 0.92);
                    setNewBannerImageUrl(uploaded.coverUrl);
                  } catch {
                    const dataUrl = await fileToPersistentDataUrl(
                      file,
                      1920,
                      1080,
                      0.92
                    );
                    setNewBannerImageUrl(dataUrl);
                  }
                }}
                className="hidden"
              />
            </label>
            {newBannerFileName && (
              <span className="text-[11px] font-mono text-emerald-400 truncate">
                Fichier : {newBannerFileName}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <div>
              <label className="block text-[11px] text-[#A3A9BA] mb-1">
                Emplacement dans « Central »
              </label>
              <select
                value={newBannerPlacement}
                onChange={(e) =>
                  setNewBannerPlacement(e.target.value as AdBannerPlacement)
                }
                className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-semibold text-[#F5F2EB]"
              >
                <option value="BOTH">Haut &amp; Bas de Central</option>
                <option value="TOP">Bannière Haut uniquement</option>
                <option value="BOTTOM">Bannière Bas uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#A3A9BA] mb-1">
                Action au clic sur l'image
              </label>
              <select
                value={newBannerRedirectType}
                onChange={(e) =>
                  setNewBannerRedirectType(e.target.value as AdBannerRedirectType)
                }
                className="w-full bg-[#0D1017] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-semibold text-[#F5F2EB]"
              >
                <option value="NONE">Aucune redirection (Image seule)</option>
                <option value="TRACK">Rediriger vers une Chanson de l'app</option>
                <option value="ALBUM">Rediriger vers un Projet / Album de l'app</option>
                <option value="EXTERNAL">Rediriger vers un Lien externe</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2.5 h-full">
            {newBannerRedirectType === 'TRACK' && (
              <div>
                <label className="block text-[11px] text-amber-300 mb-1">
                  Chanson cible au clic
                </label>
                <select
                  value={newBannerTargetTrackId}
                  onChange={(e) => setNewBannerTargetTrackId(e.target.value)}
                  className="w-full bg-[#0D1017] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                >
                  {allTracksFlat.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — {t.artist}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newBannerRedirectType === 'ALBUM' && (
              <div>
                <label className="block text-[11px] text-emerald-300 mb-1">
                  Projet / Album cible au clic
                </label>
                <select
                  value={newBannerTargetAlbumId}
                  onChange={(e) => setNewBannerTargetAlbumId(e.target.value)}
                  className="w-full bg-[#0D1017] border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                >
                  {catalogue.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.albumTitle} — {alb.artist}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newBannerRedirectType === 'EXTERNAL' && (
              <div>
                <label className="block text-[11px] text-sky-300 mb-1">
                  Lien externe de destination au clic
                </label>
                <input
                  type="text"
                  value={newBannerExternalUrl}
                  onChange={(e) => setNewBannerExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0D1017] border border-sky-500/30 rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>
            )}

            {newBannerRedirectType === 'NONE' && (
              <div className="p-2.5 rounded-xl bg-[#0D1017] border border-white/[0.06] text-[11px] text-[#A3A9BA]">
                L'image défilera dans la bannière sans action au clic.
              </div>
            )}

            <button
              type="button"
              disabled={!newBannerImageUrl}
              onClick={() => {
                if (!newBannerImageUrl) return;
                const createdSlide: AdBannerSlide = {
                  id: `ad-slide-${Date.now()}`,
                  imageUrl: newBannerImageUrl,
                  fileName: newBannerFileName || 'banniere-pub.jpg',
                  placement: newBannerPlacement,
                  redirectType: newBannerRedirectType,
                  targetTrackId:
                    newBannerRedirectType === 'TRACK'
                      ? newBannerTargetTrackId
                      : undefined,
                  targetAlbumId:
                    newBannerRedirectType === 'ALBUM'
                      ? newBannerTargetAlbumId
                      : undefined,
                  externalUrl:
                    newBannerRedirectType === 'EXTERNAL'
                      ? newBannerExternalUrl.trim()
                      : undefined,
                  active: true,
                  orderIndex: adBanners.length,
                  createdAt: new Date().toISOString(),
                };
                setAdBanners((prev) => [...prev, createdSlide]);
                setNewBannerImageUrl('');
                setNewBannerFileName('');
                setNewBannerExternalUrl('');
                pushNotification(
                  'Bannière ajoutée et sauvegardée',
                  'La nouvelle slide est immédiatement active sur Central.',
                  'PUBLISH'
                );
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 disabled:opacity-35 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Enregistrer la slide dans le Slideshow</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. LISTE DES SLIDES ENREGISTRÉES */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-[#F5F2EB]">
          Slides actives dans le Slideshow ({adBanners.length})
        </span>

        {adBanners.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#07080C] border border-white/[0.06] text-xs text-[#A3A9BA]">
            Aucune bannière enregistrée. Importez une image ci-dessus pour démarrer le slideshow.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adBanners.map((slide, sIdx) => (
              <div
                key={slide.id}
                className={`p-3 rounded-2xl bg-[#07080C] border flex flex-col gap-2.5 ${
                  slide.active
                    ? 'border-white/[0.12]'
                    : 'border-white/[0.05] opacity-60'
                }`}
              >
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#07090E] border border-white/10">
                  <img
                    src={slide.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[#07090E]/75 hover:bg-[#07090E] text-[10px] font-bold text-amber-300 border border-white/15 cursor-pointer backdrop-blur-sm">
                    Remplacer l'image (1920×1080)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const uploaded = await uploadCoverFile(
                          file,
                          1920,
                          1080,
                          0.92
                        );
                        setAdBanners((prev) =>
                          prev.map((item) =>
                            item.id === slide.id
                              ? {
                                  ...item,
                                  imageUrl: uploaded.coverUrl,
                                  fileName: file.name,
                                }
                              : item
                          )
                        );
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={slide.placement}
                    onChange={(e) =>
                      setAdBanners((prev) =>
                        prev.map((item) =>
                          item.id === slide.id
                            ? {
                                ...item,
                                placement: e.target.value as AdBannerPlacement,
                              }
                            : item
                        )
                      )
                    }
                    className="bg-[#0D1017] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[11px] text-[#F5F2EB]"
                  >
                    <option value="BOTH">Haut &amp; Bas</option>
                    <option value="TOP">Haut seul</option>
                    <option value="BOTTOM">Bas seul</option>
                  </select>

                  <select
                    value={slide.redirectType}
                    onChange={(e) =>
                      setAdBanners((prev) =>
                        prev.map((item) =>
                          item.id === slide.id
                            ? {
                                ...item,
                                redirectType: e.target.value as AdBannerRedirectType,
                              }
                            : item
                        )
                      )
                    }
                    className="bg-[#0D1017] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[11px] text-[#F5F2EB]"
                  >
                    <option value="NONE">Sans lien</option>
                    <option value="TRACK">Lien Chanson</option>
                    <option value="ALBUM">Lien Projet</option>
                    <option value="EXTERNAL">Lien Externe</option>
                  </select>
                </div>

                {slide.redirectType === 'TRACK' && (
                  <select
                    value={slide.targetTrackId || ''}
                    onChange={(e) =>
                      setAdBanners((prev) =>
                        prev.map((item) =>
                          item.id === slide.id
                            ? { ...item, targetTrackId: e.target.value }
                            : item
                        )
                      )
                    }
                    className="w-full bg-[#0D1017] border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-300"
                  >
                    <option value="">Choisir une chanson...</option>
                    {allTracksFlat.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} — {t.artist}
                      </option>
                    ))}
                  </select>
                )}

                {slide.redirectType === 'ALBUM' && (
                  <select
                    value={slide.targetAlbumId || ''}
                    onChange={(e) =>
                      setAdBanners((prev) =>
                        prev.map((item) =>
                          item.id === slide.id
                            ? { ...item, targetAlbumId: e.target.value }
                            : item
                        )
                      )
                    }
                    className="w-full bg-[#0D1017] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-300"
                  >
                    <option value="">Choisir un projet...</option>
                    {catalogue.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        {alb.albumTitle} — {alb.artist}
                      </option>
                    ))}
                  </select>
                )}

                {slide.redirectType === 'EXTERNAL' && (
                  <input
                    type="text"
                    value={slide.externalUrl || ''}
                    onChange={(e) =>
                      setAdBanners((prev) =>
                        prev.map((item) =>
                          item.id === slide.id
                            ? { ...item, externalUrl: e.target.value }
                            : item
                        )
                      )
                    }
                    placeholder="https://..."
                    className="w-full bg-[#0D1017] border border-sky-500/30 rounded-lg px-2.5 py-1.5 text-[11px] text-sky-300"
                  />
                )}

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                  <label className="flex items-center gap-1.5 text-[11px] text-[#F5F2EB] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slide.active}
                      onChange={(e) =>
                        setAdBanners((prev) =>
                          prev.map((item) =>
                            item.id === slide.id
                              ? { ...item, active: e.target.checked }
                              : item
                          )
                        )
                      }
                      className="accent-emerald-400"
                    />
                    <span>Slide active</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={sIdx === 0}
                      onClick={() =>
                        setAdBanners((prev) => {
                          if (sIdx === 0) return prev;
                          const copy = [...prev];
                          const [moved] = copy.splice(sIdx, 1);
                          copy.splice(sIdx - 1, 0, moved);
                          return copy.map((it, i) => ({
                            ...it,
                            orderIndex: i,
                          }));
                        })
                      }
                      className="p-1 rounded bg-white/[0.05] text-[#A3A9BA] disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={sIdx === adBanners.length - 1}
                      onClick={() =>
                        setAdBanners((prev) => {
                          if (sIdx >= prev.length - 1) return prev;
                          const copy = [...prev];
                          const [moved] = copy.splice(sIdx, 1);
                          copy.splice(sIdx + 1, 0, moved);
                          return copy.map((it, i) => ({
                            ...it,
                            orderIndex: i,
                          }));
                        })
                      }
                      className="p-1 rounded bg-white/[0.05] text-[#A3A9BA] disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdBanners((prev) =>
                          prev.filter((item) => item.id !== slide.id)
                        )
                      }
                      className="p-1 rounded bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                      title="Supprimer cette bannière"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

