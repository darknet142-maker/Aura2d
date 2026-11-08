import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  applyTokenTransaction,
  getOrCreateUserWallet,
  getOrCreateSponsorWallet,
  getLedgerHistory,
  getUserLedgerHistory,
  getSponsorLedgerHistory,
} from './src/features/tokens';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StreamEventPayload {
  eventId: string;
  action: 'play' | 'like' | 'unlike' | 'loop' | 'complete' | 'skip';
  trackId: string;
  userId?: string;
  timestamp: string;
  durationPlayedSeconds?: number;
  loopCount?: number;
  pointsDelta?: number;
  retentionPct?: number;
}

interface ProcessedEventRecord extends StreamEventPayload {
  processedAt: string;
}

interface ServerTrackMetrics {
  trackId: string;
  playCount: number;
  loopCount: number;
  likeCount: number;
  totalListenSeconds: number;
  pointsDelta: number;
}

// Registre d'idempotence (ProcessedEvents) et métriques agrégées côté serveur
const processedEvents = new Map<string, ProcessedEventRecord>();
const serverTrackMetrics = new Map<string, ServerTrackMetrics>();
const serverUserLikes = new Map<string, boolean>();
let totalSyncBatches = 0;
let lastSyncAt: string | null = null;

function getOrCreateTrackMetric(trackId: string): ServerTrackMetrics {
  const existing = serverTrackMetrics.get(trackId);
  if (existing) return existing;
  const fresh: ServerTrackMetrics = {
    trackId,
    playCount: 0,
    loopCount: 0,
    likeCount: 0,
    totalListenSeconds: 0,
    pointsDelta: 0,
  };
  serverTrackMetrics.set(trackId, fresh);
  return fresh;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Endpoint de synchronisation par lot Offline-First (Store-and-Forward)
  app.post('/api/sync-metrics', async (req, res) => {
    try {
      const rawEvents: StreamEventPayload[] = Array.isArray(req.body?.events) ? req.body.events : [];

      // Tri par ordre chronologique strict pour respecter la séquence des actions (ex: like puis unlike)
      const events = [...rawEvents].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const processedIds: string[] = [];
      let newlyProcessedCount = 0;
      let duplicateSkippedCount = 0;

      for (const event of events) {
        if (!event || !event.eventId || !event.trackId) continue;

        // 1. Vérifier si cet eventId a déjà été traité (Idempotence via UUID)
        if (processedEvents.has(event.eventId)) {
          processedIds.push(event.eventId);
          duplicateSkippedCount += 1;
          continue;
        }

        const metric = getOrCreateTrackMetric(event.trackId);
        const userLikeKey = `${event.userId || 'anon'}:${event.trackId}`;

        // 2. Appliquer la mise à jour selon le type d'action
        if (event.action === 'play') {
          metric.playCount += 1;
          if (typeof event.durationPlayedSeconds === 'number' && event.durationPlayedSeconds > 0) {
            metric.totalListenSeconds += event.durationPlayedSeconds;
          }
        } else if (event.action === 'complete' || event.action === 'skip') {
          if (typeof event.durationPlayedSeconds === 'number' && event.durationPlayedSeconds > 0) {
            metric.totalListenSeconds += event.durationPlayedSeconds;
          }
          if (typeof event.pointsDelta === 'number') {
            metric.pointsDelta = Math.round((metric.pointsDelta + event.pointsDelta) * 100) / 100;
          }
        } else if (event.action === 'loop') {
          metric.loopCount += event.loopCount || 1;
          if (typeof event.durationPlayedSeconds === 'number' && event.durationPlayedSeconds > 0) {
            metric.totalListenSeconds += event.durationPlayedSeconds;
          }
          if (typeof event.pointsDelta === 'number') {
            metric.pointsDelta = Math.round((metric.pointsDelta + event.pointsDelta) * 100) / 100;
          }
        } else if (event.action === 'like') {
          const prevLiked = serverUserLikes.get(userLikeKey) || false;
          if (!prevLiked) {
            serverUserLikes.set(userLikeKey, true);
            metric.likeCount += 1;
            metric.pointsDelta = Math.round((metric.pointsDelta + (event.pointsDelta ?? 0.25)) * 100) / 100;
          }
        } else if (event.action === 'unlike') {
          const prevLiked = serverUserLikes.get(userLikeKey) || false;
          if (prevLiked) {
            serverUserLikes.set(userLikeKey, false);
            metric.likeCount = Math.max(0, metric.likeCount - 1);
          }
        }

        // 3. Marquer l'événement comme traité dans ProcessedEvents
        processedEvents.set(event.eventId, {
          ...event,
          processedAt: new Date().toISOString(),
        });

        processedIds.push(event.eventId);
        newlyProcessedCount += 1;
      }

      totalSyncBatches += 1;
      lastSyncAt = new Date().toISOString();

      res.status(200).json({
        status: 'success',
        processedIds,
        newlyProcessedCount,
        duplicateSkippedCount,
        totalProcessedServerSide: processedEvents.size,
        totalSyncBatches,
        lastSyncAt,
      });
    } catch (err) {
      console.error('Sync metrics error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to process batch sync' });
    }
  });

  // Endpoint d'inspection de l'état de synchronisation serveur
  app.get('/api/sync-status', (_req, res) => {
    const recentEvents = Array.from(processedEvents.values())
      .slice(-25)
      .reverse();
    res.status(200).json({
      status: 'ok',
      totalProcessedServerSide: processedEvents.size,
      totalSyncBatches,
      lastSyncAt,
      recentEvents,
      tracks: Array.from(serverTrackMetrics.values()),
    });
  });

  // ============================================================================
  // ÉCONOMIE DES JETONS SPONSORISÉS — API REST & JOURNAL COMPTABLE SERVEUR
  // ============================================================================

  app.get('/api/tokens/wallet/:userId', (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ status: 'error', message: 'userId manquant' });
    const wallet = getOrCreateUserWallet(userId);
    const history = getUserLedgerHistory(userId);
    return res.status(200).json({ status: 'ok', wallet, history });
  });

  app.get('/api/tokens/sponsor-wallet/:sponsorId', (req, res) => {
    const { sponsorId } = req.params;
    if (!sponsorId) return res.status(400).json({ status: 'error', message: 'sponsorId manquant' });
    const wallet = getOrCreateSponsorWallet(sponsorId);
    const history = getSponsorLedgerHistory(sponsorId);
    return res.status(200).json({ status: 'ok', wallet, history });
  });

  app.get('/api/tokens/ledger', (req, res) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    return res.status(200).json({
      status: 'ok',
      count: getLedgerHistory(limit).length,
      ledger: getLedgerHistory(limit),
    });
  });

  app.post('/api/tokens/transaction', (req, res) => {
    try {
      const result = applyTokenTransaction(req.body);
      if (!result.success) {
        return res.status(400).json({ status: 'error', message: result.error });
      }
      return res.status(200).json({
        status: 'ok',
        isDuplicate: Boolean(result.isDuplicate),
        entry: result.entry,
        userWallet: result.userWallet,
        sponsorWallet: result.sponsorWallet,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur interne de transaction';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
