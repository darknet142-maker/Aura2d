import React, { useState } from 'react';
import { Database, CheckCircle2, Plus, X } from 'lucide-react';
import {
  isSupabaseConfigured,
  SUPABASE_SQL_SETUP_SCRIPT,
} from '../../../services/musicService';
import type { EntityDatabase, AppNotification } from '../../../shared/types/domain.types';

export interface AdminDatabaseManagerProps {
  supabaseHealthMsg: string;
  entityDb: EntityDatabase;
  onRegisterEntity: (role: keyof EntityDatabase, rawName: string) => void;
  onDeleteEntity: (role: keyof EntityDatabase, nameToRemove: string) => void;
  onSaveAndSyncAll: (sectionLabel?: string) => void;
  pushNotification: (
    title: string,
    message: string,
    type?: AppNotification['type']
  ) => void;
}

export const AdminDatabaseManager: React.FC<AdminDatabaseManagerProps> = ({
  supabaseHealthMsg,
  entityDb,
  onRegisterEntity,
  onDeleteEntity,
  onSaveAndSyncAll,
  pushNotification,
}) => {
  const [showSqlEditorModal, setShowSqlEditorModal] = useState<boolean>(false);
  const [sqlCopiedBanner, setSqlCopiedBanner] = useState<boolean>(false);
  const [dbNewItemRole, setDbNewItemRole] =
    useState<keyof EntityDatabase>('artists');
  const [dbNewItemValue, setDbNewItemValue] = useState<string>('');

  return (
    <div className="flex-1 w-full bg-[#0D1017] border border-white/[0.08] rounded-2xl p-4 overflow-y-auto flex flex-col gap-4">
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#07080C] to-amber-500/10 border border-emerald-500/30 flex flex-col gap-3">
        {supabaseHealthMsg && (
          <div className="px-3 py-2 rounded-xl bg-black/50 border border-emerald-500/25 text-[11px] text-emerald-300 font-medium">
            {supabaseHealthMsg}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#F5F2EB]">
                  Architecture Supabase — Pistes Opus (-14 LUFS) &amp; Storage
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isSupabaseConfigured()
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isSupabaseConfigured()
                    ? 'Cloud Supabase Connecté'
                    : 'Mode Hybride Local Actif'}
                </span>
              </div>
              <p className="text-[11px] text-[#8E93A4]">
                4 Tables (`tracks`, `studio_entities`, `user_playlists`, `user_library_state`) + 2 Buckets (`audio_files` Opus &amp; `cover_files` Pochettes)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSqlEditorModal((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-[#F5F2EB] transition"
            >
              {showSqlEditorModal ? 'Masquer le SQL' : 'Afficher le Script SQL'}
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
                setSqlCopiedBanner(true);
                pushNotification(
                  'Script SQL Supabase copié !',
                  'Collez-le directement dans le SQL Editor de votre projet Supabase.',
                  'DATABASE'
                );
                window.setTimeout(() => setSqlCopiedBanner(false), 3500);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {sqlCopiedBanner
                  ? 'Script SQL Copié !'
                  : 'Copier le Script SQL Supabase'}
              </span>
            </button>
          </div>
        </div>

        {showSqlEditorModal && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-[11px] text-emerald-300 font-mono">
              <span>
                Prêt à coller dans Supabase Dashboard → SQL Editor → New Query
              </span>
              <span>Idempotent (exécutable plusieurs fois sans erreur)</span>
            </div>
            <pre className="w-full max-h-64 overflow-y-auto p-3 rounded-xl bg-black/80 border border-white/10 text-[11px] font-mono text-emerald-300/95 select-all whitespace-pre-wrap">
              {SUPABASE_SQL_SETUP_SCRIPT}
            </pre>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#F5F2EB] flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Base de Données Réutilisable (Listes Déroulantes)</span>
          </h3>
          <p className="text-xs text-[#8E93A4]">
            Enregistrez les noms d'artistes, labels, beatmakers, ingénieurs et auteurs une seule fois pour les sélectionner partout.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onSaveAndSyncAll(
              'Base de Données Entités (Artistes, Labels, Équipe)'
            )
          }
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07080C] font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Sauvegarder &amp; Synchroniser BDD</span>
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-[#07080C] border border-emerald-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <select
          value={dbNewItemRole}
          onChange={(e) =>
            setDbNewItemRole(e.target.value as keyof EntityDatabase)
          }
          className="bg-[#0D1017] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-semibold text-[#F5F2EB]"
        >
          <option value="artists">Artiste / Interprète</option>
          <option value="labels">Label Producteur</option>
          <option value="beatmakers">Beatmaker / Compositeur</option>
          <option value="engineers">Ingénieur du Son</option>
          <option value="lyricists">Auteur / Parolier</option>
        </select>
        <input
          type="text"
          value={dbNewItemValue}
          onChange={(e) => setDbNewItemValue(e.target.value)}
          placeholder="Saisir un ou plusieurs noms (séparés par une virgule)..."
          className="flex-1 bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#F5F2EB]"
        />
        <button
          type="button"
          onClick={() => {
            if (dbNewItemValue.trim()) {
              onRegisterEntity(dbNewItemRole, dbNewItemValue);
              setDbNewItemValue('');
            }
          }}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-[#07080C] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer dans la BDD</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(
          [
            {
              key: 'artists',
              title: 'Artistes & Featurings',
              color: 'text-[#DE1B34]',
            },
            {
              key: 'labels',
              title: 'Labels Producteurs',
              color: 'text-amber-300',
            },
            {
              key: 'beatmakers',
              title: 'Beatmakers',
              color: 'text-emerald-400',
            },
            {
              key: 'engineers',
              title: 'Ingénieurs du Son',
              color: 'text-violet-300',
            },
            {
              key: 'lyricists',
              title: 'Auteurs & Paroliers',
              color: 'text-sky-300',
            },
          ] as const
        ).map((group) => (
          <div
            key={group.key}
            className="bg-[#07080C] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
              <span className={`text-xs font-bold ${group.color}`}>
                {group.title}
              </span>
              <span className="text-[10px] font-mono text-[#8E93A4]">
                {entityDb[group.key].length} enregistré(s)
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5 pt-1">
              {entityDb[group.key].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D1017] border border-white/[0.08] text-xs text-[#F5F2EB]"
                >
                  <span className="truncate max-w-[150px]">{item}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteEntity(group.key, item)}
                    className="text-[#8E93A4] hover:text-rose-400"
                    title="Supprimer de la liste"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
