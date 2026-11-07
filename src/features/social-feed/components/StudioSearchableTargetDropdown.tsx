import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X, Music2, Disc3, UserRound, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CoverArtwork } from '../../../components/CoverArtwork';
import { SPRING_SNAPPY } from '../../../shared/ui/springMotion';
import type { SocialTargetSubject } from '../types/social-feed.types';
import { useTargetDropAudioPreview } from '../hooks/useTargetDropAudioPreview';

function norm(s?: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filterTargetsInstant(targets: SocialTargetSubject[], rawQuery: string): SocialTargetSubject[] {
  const q = norm(rawQuery);
  if (!q) return targets;
  const scoreField = (val?: string): number => {
    const t = norm(val);
    if (!t) return 0;
    if (t === q) return 100;
    if (t.startsWith(q)) return 90;
    if (t.split(/[\s\-_.,/()•]+/).some((w) => w.startsWith(q))) return 78;
    return t.includes(q) ? 60 : 0;
  };
  return targets
    .map((item) => ({ item, score: Math.max(scoreField(item.title), scoreField(item.entityName) * 0.95, scoreField(item.subtitle) * 0.9, scoreField(item.genre) * 0.8) }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.item);
}

export interface StudioSearchableTargetDropdownProps {
  selectedTarget: SocialTargetSubject; options: SocialTargetSubject[]; onSelectTarget: (target: SocialTargetSubject) => void;
  onPreviewTargetDrop?: (target: SocialTargetSubject) => void; previewingKey?: string | null; variant?: 'studio-glass' | 'modal-surface'; ariaLabel?: string;
}

export const StudioSearchableTargetDropdown: React.FC<StudioSearchableTargetDropdownProps> = ({
  selectedTarget, options, onSelectTarget, onPreviewTargetDrop, previewingKey, variant = 'modal-surface', ariaLabel = 'Sélectionner une chanson ou un artiste',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const fallbackPreview = useTargetDropAudioPreview();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const filtered = useMemo(() => filterTargetsInstant(options, query), [options, query]);
  const targetKey = (t: SocialTargetSubject) => `${t.kind}:${t.trackId || t.albumId || t.entityName}:${t.title}`;
  const selectedKey = targetKey(selectedTarget);
  const activePlayKey = previewingKey !== undefined ? previewingKey : fallbackPreview.previewingKey;

  useEffect(() => {
    if (isOpen) {
      setHighlightIdx(0);
      setTimeout(() => searchInputRef.current?.focus(), 40);
    } else if (!onPreviewTargetDrop) {
      fallbackPreview.stopPreview();
    }
  }, [isOpen, onPreviewTargetDrop, fallbackPreview]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [isOpen]);

  const kindLabel = (k: SocialTargetSubject['kind']) => (k === 'ARTIST' ? 'Artiste' : k === 'ALBUM' ? 'Projet' : 'Chanson');
  const KindIcon = selectedTarget.kind === 'ARTIST' ? UserRound : selectedTarget.kind === 'ALBUM' ? Disc3 : Music2;

  const toggleDropPlay = (e: React.MouseEvent, item: SocialTargetSubject) => {
    e.stopPropagation();
    if (onPreviewTargetDrop) {
      onPreviewTargetDrop(item);
    } else {
      void fallbackPreview.togglePreview(item);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${variant === 'studio-glass' ? 'w-full max-w-[330px]' : 'w-full'}`}>
      <button
        type="button" role="combobox" aria-expanded={isOpen} aria-label={ariaLabel}
        onClick={() => { setIsOpen((v) => !v); setHighlightIdx(0); }}
        className={`w-full flex items-center justify-between gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition cursor-pointer ${
          variant === 'studio-glass' ? 'bg-[#080A0F]/88 backdrop-blur-xl border-white/20 shadow-[0_12px_30px_rgba(6,8,14,0.85)]' : 'bg-[#131722] border-white/15 hover:border-amber-400/45'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/15 shrink-0">
            <CoverArtwork artworkType={selectedTarget.artworkType} coverUrl={selectedTarget.cover} title={selectedTarget.title} artist={selectedTarget.entityName} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-extrabold text-[#F8FAFC] truncate">{selectedTarget.title}</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-[9.5px] font-bold text-amber-300 shrink-0">
                <KindIcon className="w-2.5 h-2.5 shrink-0" />{kindLabel(selectedTarget.kind)}
              </span>
            </div>
            <p className="text-[11px] text-[#A3A9BA] truncate">{selectedTarget.subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#A3A9BA] shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-amber-300' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -3 }}
            transition={SPRING_SNAPPY} style={{ transformOrigin: 'top center' }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[95] rounded-2xl bg-[#0D1017] border border-white/20 shadow-[0_22px_60px_rgba(6,8,14,0.96)] overflow-hidden flex flex-col"
          >
            <div role="listbox" aria-label="Liste des chansons" className="max-h-52 overflow-y-auto p-1.5 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-5 px-3 text-center space-y-2">
                  <p className="text-xs text-[#A3A9BA]">Aucun résultat pour « {query} »</p>
                  <button type="button" onClick={() => { setQuery(''); searchInputRef.current?.focus(); }} className="px-3 py-1 rounded-lg bg-amber-400/15 border border-amber-400/35 text-[11px] font-bold text-amber-300 cursor-pointer">Réinitialiser la recherche</button>
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const key = targetKey(item);
                  const isSelected = key === selectedKey;
                  const isPlayingThis = activePlayKey === key;
                  return (
                    <div key={key} onMouseEnter={() => setHighlightIdx(idx)} onClick={() => { fallbackPreview.stopPreview(); onSelectTarget(item); setIsOpen(false); setQuery(''); }} className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${isSelected ? 'bg-[#DE1B34]/18 border border-[#DE1B34]/45' : idx === highlightIdx ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'}`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0"><CoverArtwork artworkType={item.artworkType} coverUrl={item.cover} title={item.title} artist={item.entityName} /></div>
                        <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#F8FAFC] truncate">{item.title}</p><p className="text-[10.5px] text-[#A3A9BA] truncate">{item.subtitle} • {item.genre}</p></div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onPreviewTargetDrop && (
                          <button type="button" onClick={(e) => toggleDropPlay(e, item)} aria-label={isPlayingThis ? 'Pause' : 'Écouter le Drop'} title="Écouter le drop (30s)" className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${isPlayingThis ? 'bg-[#DE1B34] text-white' : 'bg-white/10 hover:bg-white/20 text-[#F8FAFC]'}`}>
                            {isPlayingThis ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                          </button>
                        )}
                        {isSelected ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="text-[9.5px] font-semibold text-[#A3A9BA]">{kindLabel(item.kind)}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t border-white/12 bg-[#080A0F] p-2.5 flex items-center gap-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-0.5" />
              <input ref={searchInputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setHighlightIdx(0); }} placeholder="Recherche instantanée (titre, artiste, genre)..." aria-label="Recherche instantanée dans la liste" className="flex-1 min-w-0 bg-transparent text-xs text-[#F8FAFC] placeholder-[#A3A9BA]/70 focus:outline-none" />
              {query && <button type="button" onClick={() => { setQuery(''); searchInputRef.current?.focus(); }} aria-label="Effacer la recherche" className="w-5 h-5 rounded-full bg-white/10 text-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer"><X className="w-3 h-3" /></button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
