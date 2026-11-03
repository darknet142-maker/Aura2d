import React, { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { UserPlaylist } from '../../ReusableAnalyticsSheets';
import { DropOfficialLogo } from '../../CoverArtwork';

export interface PlaylistModalProps {
  isOpen: boolean;
  currentTrackId: string;
  playlists: UserPlaylist[];
  onClose: () => void;
  onToggleTrackInPlaylist: (playlistId: string, trackId: string) => void;
  onCreatePlaylist: (name: string, colorTheme: string, initialTrackId?: string) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  currentTrackId,
  playlists,
  onClose,
  onToggleTrackInPlaylist,
  onCreatePlaylist,
}) => {
  const [newPlaylistInput, setNewPlaylistInput] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    const val = newPlaylistInput.trim();
    if (!val) return;
    onCreatePlaylist(val, '#e11d38', currentTrackId);
    setNewPlaylistInput('');
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col justify-end p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900/95 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <DropOfficialLogo className="h-4 w-auto max-w-[80px]" />
              <h2 className="text-base font-bold text-white">Ajouter à mes playlists</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Retrouvez et gérez toutes vos playlists dans Mon Profil
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {playlists.map((pl) => {
            const isAdded = pl.trackIds.includes(currentTrackId);
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => onToggleTrackInPlaylist(pl.id, currentTrackId)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl border border-white/15 flex items-center justify-center shrink-0 text-white font-bold text-xs"
                    style={{
                      backgroundColor: pl.colorTheme || '#e11d38',
                    }}
                  >
                    {pl.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                    <p className="text-xs text-zinc-400">
                      {pl.trackIds.length} titre{pl.trackIds.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    isAdded
                      ? 'bg-amber-400 text-black'
                      : 'border border-white/30 text-white'
                  }`}
                >
                  {isAdded ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-1 flex gap-2">
          <input
            type="text"
            value={newPlaylistInput}
            onChange={(e) => setNewPlaylistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
            placeholder="Créer une nouvelle playlist..."
            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition shrink-0"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
};

