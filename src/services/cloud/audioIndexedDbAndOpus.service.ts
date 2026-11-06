import { sanitizeStorageFileName } from './supabaseCoreAndTypes';

const AUDIO_IDB_NAME = 'drop_audio_files_idb';
const AUDIO_IDB_STORE = 'audio_blobs';

function openAudioIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB non disponible'));
      return;
    }
    const request = window.indexedDB.open(AUDIO_IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_IDB_STORE)) {
        db.createObjectStore(AUDIO_IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Erreur ouverture IndexedDB'));
  });
}

/**
 * Sauvegarde un fichier/Blob audio dans IndexedDB sous l'identifiant de la piste
 * et retourne une URL blob: immédiatement lisible par le lecteur <audio>.
 */
export async function saveAudioBlobToIndexedDb(
  trackId: string,
  audioBlob: Blob
): Promise<string> {
  const safeMime =
    audioBlob.type && !audioBlob.type.includes('codecs=opus')
      ? audioBlob.type
      : 'audio/mpeg';
  const playableBlob =
    audioBlob.type === safeMime
      ? audioBlob
      : new Blob([audioBlob], { type: safeMime });
  try {
    const db = await openAudioIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(AUDIO_IDB_STORE, 'readwrite');
      const store = tx.objectStore(AUDIO_IDB_STORE);
      store.put(playableBlob, trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore IndexedDB quota errors, still return object URL for current session
  }
  return URL.createObjectURL(playableBlob);
}

/**
 * Récupère un Blob audio stocké dans IndexedDB et recrée une URL blob: fraîche et valide
 * après chaque rafraîchissement de l'application.
 */
export async function getPersistentAudioBlobUrl(
  trackId: string
): Promise<string | null> {
  try {
    const db = await openAudioIndexedDb();
    const blob = await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(AUDIO_IDB_STORE, 'readonly');
      const store = tx.objectStore(AUDIO_IDB_STORE);
      const req = store.get(trackId);
      req.onsuccess = () =>
        resolve(req.result instanceof Blob ? req.result : null);
      req.onerror = () => resolve(null);
    });
    db.close();
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function deleteAudioBlobFromIndexedDb(
  trackId: string
): Promise<void> {
  try {
    const db = await openAudioIndexedDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(AUDIO_IDB_STORE, 'readwrite');
      tx.objectStore(AUDIO_IDB_STORE).delete(trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore
  }
}

/**
 * Analyse la durée réelle et le niveau RMS/LUFS du fichier audio tout en conservant
 * ses octets et son type MIME natif décodable par tous les navigateurs (MP3, WAV, M4A, AAC, OGG, OPUS).
 */
export async function convertAudioFileToOpus(audioFile: File): Promise<{
  opusFile: File;
  durationSec: number;
  lufsMasterLevel: number;
}> {
  const cleanName = sanitizeStorageFileName(audioFile.name);
  const nativeMimeType = audioFile.type || 'audio/mpeg';

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const arrayBuffer = await audioFile.arrayBuffer();
    const decodedBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const durationSec = Math.max(15, Math.round(decodedBuffer.duration));

    const channelData = decodedBuffer.getChannelData(0);
    let sumSq = 0;
    const step = Math.max(1, Math.floor(channelData.length / 25000));
    let count = 0;
    for (let i = 0; i < channelData.length; i += step) {
      sumSq += channelData[i] * channelData[i];
      count++;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, count));
    const estimatedLufs =
      rms > 0.0001
        ? Number(
            Math.max(-24, Math.min(-7, 20 * Math.log10(rms) - 0.691)).toFixed(1)
          )
        : -14.0;

    await ctx.close();

    // Conserver le flux binaire et le MIME natif exact pour que <audio> le décode sans erreur
    const playableFile = new File([audioFile], cleanName, {
      type: nativeMimeType,
    });

    return {
      opusFile: playableFile,
      durationSec,
      lufsMasterLevel: estimatedLufs,
    };
  } catch {
    const playableFile = new File([audioFile], cleanName, {
      type: nativeMimeType,
    });
    return {
      opusFile: playableFile,
      durationSec: 180,
      lufsMasterLevel: -14.0,
    };
  }
}

// ============================================================================
// 1. CHARGER ET SAUVEGARDER LE CATALOGUE COMPLET (PERSISTANCE GARANTIE)
// ============================================================================

