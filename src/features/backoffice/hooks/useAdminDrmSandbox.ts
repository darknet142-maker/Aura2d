import { useState, useCallback } from 'react';
import type { AdminDrmVaultRecord, Track } from '../../../shared/types/domain.types';

export function useAdminDrmSandbox() {
  // --- Admin Exclusive DRM Sandbox State (Web Crypto API AES-256-GCM) ---
  const [adminDrmVault, setAdminDrmVault] = useState<Record<string, AdminDrmVaultRecord>>({});
  const [adminDrmTargetTrackId, setAdminDrmTargetTrackId] = useState<string>('t-main-1');
  const [adminDrmStatusMsg, setAdminDrmStatusMsg] = useState<string | null>(null);
  const [isEncryptingAdminDrm, setIsEncryptingAdminDrm] = useState<boolean>(false);


  // --- Admin Exclusive DRM Sandbox Functions (AES-256-GCM + Self-Destruct) ---
  const encryptTrackToAdminSandbox = useCallback(
    async (track: Track) => {
      if (isEncryptingAdminDrm) return;
      setIsEncryptingAdminDrm(true);
      setAdminDrmStatusMsg('Découpage en chunks & Chiffrement AES-256-GCM en cours...');

      try {
        const key = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false, // Non-extractible (extractable: false)
          ['encrypt', 'decrypt']
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const rawAudioPayload = encoder.encode(
          `DROP_AUDIO_PCM_FRAME::${track.id}::${track.title}::${Date.now()}::PROTECTED_MASTER`
        );

        const cipherBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          rawAudioPayload
        );

        setAdminDrmVault((prev) => ({
          ...prev,
          [track.id]: {
            key,
            iv,
            cipherBytes: new Uint8Array(cipherBuffer),
            corrupted: false,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));

        setAdminDrmStatusMsg(
          `Conteneur "${track.title}" chiffré en AES-256-GCM (Clé CryptoKey non-extractible).`
        );
      } catch {
        setAdminDrmStatusMsg('Erreur lors du chiffrement Web Crypto API.');
      } finally {
        setIsEncryptingAdminDrm(false);
      }
    },
    [isEncryptingAdminDrm]
  );

  const handleAdminTestRamDecrypt = async (trackId: string) => {
    const rec = adminDrmVault[trackId];
    if (!rec || rec.corrupted || !rec.key) {
      setAdminDrmStatusMsg(
        'Échec du déchiffrement RAM : Clé révoquée et conteneur binaire autodétruit !'
      );
      return;
    }
    try {
      const ivBuffer = new Uint8Array(rec.iv).buffer;
      const cipherArrayBuffer = new Uint8Array(rec.cipherBytes).buffer;
      const plainBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
        rec.key,
        cipherArrayBuffer
      );
      const text = new TextDecoder().decode(plainBuffer);
      setAdminDrmStatusMsg(`Déchiffré en mémoire vive (RAM) : ${text.slice(0, 44)}...`);
    } catch {
      setAdminDrmStatusMsg('Erreur cryptographique fatale lors du test RAM.');
    }
  };

  const handleAdminSimulateExfiltrationSelfDestruct = (trackId: string) => {
    const rec = adminDrmVault[trackId];
    if (!rec) return;

    const wipedIv = new Uint8Array(rec.iv.length);
    wipedIv.fill(0);
    const wipedCipher = new Uint8Array(rec.cipherBytes.length);
    wipedCipher.fill(0);

    setAdminDrmVault((prev) => ({
      ...prev,
      [trackId]: {
        key: null,
        iv: wipedIv,
        cipherBytes: wipedCipher,
        corrupted: true,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));

    setAdminDrmStatusMsg(
      'VIOLATION SANDBOX DÉTECTÉE : Clé AES-256 révoquée et octets écrasés par 0x00 (Autodestruction).'
    );
  };


  return {
    adminDrmVault,
    adminDrmTargetTrackId,
    setAdminDrmTargetTrackId,
    adminDrmStatusMsg,
    isEncryptingAdminDrm,
    encryptTrackToAdminSandbox,
    handleAdminTestRamDecrypt,
    handleAdminSimulateExfiltrationSelfDestruct,
  };
}
