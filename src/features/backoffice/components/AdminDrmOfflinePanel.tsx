import React from 'react';
import { Shield, Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import {
  streamTracker,
  type SyncStatusSnapshot,
  type OfflineStreamEvent,
} from '../../../services/offlineStreamTracker';
import { bytesToHex } from '../../../shared/utils/mediaFormatters';
import type {
  Track,
  AdminDrmVaultRecord,
} from '../../../shared/types/domain.types';

export interface AdminDrmOfflinePanelProps {
  allTracksFlat: Track[];
  currentTrack: Track;
  adminDrmTargetTrackId: string;
  setAdminDrmTargetTrackId: React.Dispatch<React.SetStateAction<string>>;
  adminDrmVault: Record<string, AdminDrmVaultRecord>;
  isEncryptingAdminDrm: boolean;
  adminDrmStatusMsg: string | null;
  onEncryptTrackToSandbox: (track: Track) => void;
  onTestRamDecrypt: (trackId: string) => void;
  onSimulateExfiltrationSelfDestruct?: (trackId: string) => void;
  syncSnapshot: SyncStatusSnapshot;
}

export const AdminDrmOfflinePanel: React.FC<AdminDrmOfflinePanelProps> = ({
  allTracksFlat,
  currentTrack,
  adminDrmTargetTrackId,
  setAdminDrmTargetTrackId,
  adminDrmVault,
  isEncryptingAdminDrm,
  adminDrmStatusMsg,
  onEncryptTrackToSandbox,
  onTestRamDecrypt,
  onSimulateExfiltrationSelfDestruct,
  syncSnapshot,
}) => {
  const targetTrack =
    allTracksFlat.find((t) => t.id === adminDrmTargetTrackId) || currentTrack;
  const drmRec = adminDrmVault[targetTrack.id];

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col gap-3 pr-0.5">
      <div className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-3.5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-[#F5F2EB] truncate">
                Coffre-fort DRM Sandbox (Exclusif Admin)
              </h3>
              <p className="text-[11px] text-[#A3A9BA] truncate">
                Web Crypto API • AES-256-GCM (extractable: false) &amp;
                Auto-destruction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={targetTrack.id}
              onChange={(e) => setAdminDrmTargetTrackId(e.target.value)}
              className="bg-[#07080C] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F2EB] focus:outline-none"
            >
              {allTracksFlat.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} — {t.artist}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onEncryptTrackToSandbox(targetTrack)}
              disabled={isEncryptingAdminDrm}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-[#07080C] text-xs font-bold hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {drmRec ? 'Re-chiffrer AES-256' : 'Chiffrer en Sandbox'}
            </button>
          </div>
        </div>

        {adminDrmStatusMsg && (
          <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-amber-300">
            {adminDrmStatusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-xl bg-[#07080C] border border-white/[0.06]">
            <span className="text-[#A3A9BA] block">Statut Clé CryptoKey</span>
            <span
              className={
                !drmRec
                  ? 'font-semibold text-[#A3A9BA]'
                  : drmRec.corrupted
                    ? 'font-bold text-rose-500'
                    : 'font-semibold text-emerald-400'
              }
            >
              {!drmRec
                ? 'Non initialisée (Cliquer sur Chiffrer)'
                : drmRec.corrupted
                  ? 'RÉVOQUÉE & DÉTRUITE'
                  : 'Verrouillée RAM (extractable: false)'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#07080C] border border-white/[0.06]">
            <span className="text-[#A3A9BA] block">Conteneur Audio Local</span>
            <span
              className={
                !drmRec
                  ? 'font-semibold text-[#A3A9BA]'
                  : drmRec.corrupted
                    ? 'font-bold text-rose-500'
                    : 'font-semibold text-amber-300'
              }
            >
              {!drmRec
                ? 'En attente de chiffrement'
                : drmRec.corrupted
                  ? 'CORROMPU (0x00 WIPED)'
                  : `Fragments .drm (${drmRec.timestamp})`}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#07080C] border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#A3A9BA] uppercase tracking-wider font-semibold">
              Inspecteur Binaire Stocké (Illisible par VLC / Fichiers)
            </span>
            <span className="text-emerald-400 font-mono">IV: 96-bit GCM</span>
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-amber-300/90 break-all select-all bg-[#07090E]/50 p-2 rounded-lg border border-white/5">
            {!drmRec
              ? 'Aucun flux binaire chiffré pour ce titre. Cliquez sur "Chiffrer en Sandbox" pour générer les chunks AES-256-GCM.'
              : drmRec.corrupted
                ? '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 [CONTENEUR AUDIO AUTODÉTRUIT SUITE À UNE TENTATIVE D’EXFILTRATION]'
                : bytesToHex(drmRec.cipherBytes)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!drmRec}
            onClick={() => onTestRamDecrypt(targetTrack.id)}
            className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold transition disabled:opacity-40"
          >
            Tester le déchiffrement en RAM
          </button>
        </div>
      </div>

      <div className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl p-3.5 flex flex-col gap-3">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[#F5F2EB] truncate">
              Synchronisation Offline-First (/api/sync-metrics)
            </h3>
            <p className="text-[11px] text-[#A3A9BA] truncate">
              Comptage silencieux en tâche de fond + Idempotence UUID
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                syncSnapshot.isOnline
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              }`}
            >
              {syncSnapshot.isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Connecté (Réseau Réel)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Hors ligne</span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={() => streamTracker.sync()}
              disabled={!syncSnapshot.isOnline || syncSnapshot.queue.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-[#DE1B34] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  syncSnapshot.isSyncing ? 'animate-spin' : ''
                }`}
              />
              <span>Sync ({syncSnapshot.queue.length})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-[#07080C] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2">
            <span className="font-mono text-xs text-amber-300 font-semibold">
              En attente ({syncSnapshot.queue.length})
            </span>
            {syncSnapshot.queue.length === 0 ? (
              <div className="py-4 text-center text-[11px] font-mono text-[#A3A9BA]">
                File locale vide.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
                {syncSnapshot.queue.map((evt: OfflineStreamEvent) => (
                  <div
                    key={evt.eventId}
                    className="flex items-center justify-between px-2 py-1.5 rounded bg-[#0D1017] border border-amber-500/25 font-mono text-[11px]"
                  >
                    <span className="text-amber-300 uppercase">{evt.action}</span>
                    <span className="text-[#F5F2EB] truncate mx-2">
                      {evt.trackId}
                    </span>
                    <span className="text-[#A3A9BA] text-[10px] shrink-0">
                      {evt.eventId.slice(0, 6)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#07080C] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2">
            <span className="font-mono text-xs text-emerald-400 font-semibold">
              Synchronisés ({syncSnapshot.totalSyncedCount})
            </span>
            {syncSnapshot.syncedHistory.length === 0 ? (
              <div className="py-4 text-center text-[11px] font-mono text-[#A3A9BA]">
                Aucun lot envoyé.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5">
                {syncSnapshot.syncedHistory.slice(0, 10).map((evt) => (
                  <div
                    key={evt.eventId}
                    className="flex items-center justify-between px-2 py-1.5 rounded bg-[#0D1017] border border-emerald-500/20 font-mono text-[11px]"
                  >
                    <span className="text-emerald-300 uppercase">{evt.action}</span>
                    <span className="text-[#F5F2EB] truncate mx-2">
                      {evt.trackId}
                    </span>
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
