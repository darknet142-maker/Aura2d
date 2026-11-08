import React, { useState, useMemo } from 'react';
import { Search, User, Building2, Disc, Filter } from 'lucide-react';
import { EntityPayoutCard } from './EntityPayoutCard';
import { EntityTracksRevenueTable } from './EntityTracksRevenueTable';
import type { Track } from '../../../../../shared/types/domain.types';

export interface EntityFinancialExplorerProps {
  tracks: Track[];
  onSelectTrack: (trackId: string) => void;
  onToast: (msg: string) => void;
}

export const EntityFinancialExplorer: React.FC<EntityFinancialExplorerProps> = ({
  tracks, onSelectTrack, onToast,
}) => {
  const [scope, setScope] = useState<'ARTIST' | 'LABEL' | 'ALBUM'>('ARTIST');
  const [search, setSearch] = useState('');

  const entities = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const key = scope === 'ARTIST' ? t.artist : scope === 'LABEL' ? (t.labelName || 'Indépendant') : (t.album || 'Single');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([name, tList]) => ({ name, tracks: tList }));
  }, [tracks, scope]);

  const filteredEntities = useMemo(() => {
    if (!search.trim()) return entities;
    const q = search.toLowerCase();
    return entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, search]);

  const [selectedEntityName, setSelectedEntityName] = useState<string>(() => filteredEntities[0]?.name || '');
  const activeEntity = filteredEntities.find((e) => e.name === selectedEntityName) || filteredEntities[0];

  const totalPlays = (activeEntity?.tracks || []).reduce((acc, t) => acc + (t.duration ? Math.round(t.duration * 1.8) : 210), 0);
  const grossRevenue = Math.round(totalPlays * 1.5);
  const masterShare = Math.round(grossRevenue * 0.48);
  const bugadaShare = Math.round(grossRevenue * 0.12);
  const taxDgi = Math.round(masterShare * 0.095);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Barres de Sélection et Recherche */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.08] shadow-[0_14px_34px_-12px_rgba(6,8,14,0.88)]">
        <div className="flex items-center gap-1.5 bg-[#07090E] p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => { setScope('ARTIST'); setSelectedEntityName(''); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
              scope === 'ARTIST' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Par Artiste</span>
          </button>
          <button
            type="button"
            onClick={() => { setScope('LABEL'); setSelectedEntityName(''); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
              scope === 'LABEL' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Par Maison de Prod / Label</span>
          </button>
          <button
            type="button"
            onClick={() => { setScope('ALBUM'); setSelectedEntityName(''); }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition ${
              scope === 'ALBUM' ? 'bg-[#DE1B34] text-white shadow-sm' : 'text-[#A3A9BA] hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Par Album / Projet</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs bg-[#07090E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#F8FAFC]">
          <Search className="w-3.5 h-3.5 text-[#A3A9BA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher un ${scope === 'ARTIST' ? 'artiste' : scope === 'LABEL' ? 'label' : 'album'}...`}
            className="bg-transparent outline-none text-xs text-[#F8FAFC] placeholder:text-[#A3A9BA]/60 w-full"
          />
        </div>
      </div>

      {/* 2. Liste Déroulante / Chips des Entités Disponibles */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filteredEntities.slice(0, 15).map((e) => (
          <button
            key={e.name}
            type="button"
            onClick={() => setSelectedEntityName(e.name)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 cursor-pointer transition ${
              (activeEntity?.name === e.name)
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-[#0D1017] text-[#A3A9BA] hover:text-white border border-white/[0.06]'
            }`}
          >
            {e.name} ({e.tracks.length})
          </button>
        ))}
      </div>

      {/* 3. Fiche Financière & Tableau des Redevances */}
      {activeEntity && (
        <div className="space-y-4">
          <EntityPayoutCard
            entityName={activeEntity.name}
            entityType={scope}
            totalPlays={totalPlays}
            grossRevenue={grossRevenue}
            masterShare={masterShare}
            bugadaShare={bugadaShare}
            taxDgi={taxDgi}
            onEmitStatement={() => onToast(`Relevé certifié officiel émis pour ${activeEntity.name} (Modèle 60/40).`)}
            onOrderPayout={() => onToast(`Ordre de virement direct ordonnancé (${masterShare.toLocaleString('fr-FR')} FCFA).`)}
          />

          <EntityTracksRevenueTable
            tracks={activeEntity.tracks}
            onSelectTrack={onSelectTrack}
          />
        </div>
      )}
    </div>
  );
};

