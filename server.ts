import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  applyTokenTransaction,
  getOrCreateUserWallet,
  getOrCreateSponsorWallet,
  getLedgerHistory,
  getUserLedgerHistory,
  getSponsorLedgerHistory,
  validateAndRewardMission,
  getUserCompletedMissions,
  getSponsorCampaigns,
  createAndFundCampaign,
  getCampaignById,
} from './src/features/tokens';
import {
  createDownloadTicket,
  getTicketStatus,
  resolveDownloadTicket,
  confirmDownloadTicket,
} from './src/features/downloads/services/qr-download.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.join(__dirname, 'server_storage');
const MEDIA_DIR = path.join(STORAGE_DIR, 'media');
const POSTS_FILE = path.join(STORAGE_DIR, 'feed_posts.json');
const STATUSES_FILE = path.join(STORAGE_DIR, 'user_statuses.json');
const CATALOGUE_FILE = path.join(STORAGE_DIR, 'catalogue.json');

try {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
} catch (err) {
  console.warn('Storage directory init warning:', err);
}

// Store centralisé des publications et statuts partagés
let serverFeedPosts: any[] = [];
let serverUserStatuses: any[] = [];
let serverCatalogue: any[] | null = null;

try {
  if (fs.existsSync(POSTS_FILE)) {
    const raw = fs.readFileSync(POSTS_FILE, 'utf-8');
    serverFeedPosts = JSON.parse(raw);
  }
} catch {
  serverFeedPosts = [];
}

try {
  if (fs.existsSync(STATUSES_FILE)) {
    const raw = fs.readFileSync(STATUSES_FILE, 'utf-8');
    serverUserStatuses = JSON.parse(raw);
  }
} catch {
  serverUserStatuses = [];
}

try {
  if (fs.existsSync(CATALOGUE_FILE)) {
    const raw = fs.readFileSync(CATALOGUE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      serverCatalogue = parsed;
    }
  }
} catch {
  serverCatalogue = null;
}

function persistPosts() {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(serverFeedPosts.slice(0, 200), null, 2));
  } catch (err) {
    console.warn('Persist posts error:', err);
  }
}

function persistStatuses() {
  try {
    fs.writeFileSync(STATUSES_FILE, JSON.stringify(serverUserStatuses.slice(0, 100), null, 2));
  } catch (err) {
    console.warn('Persist statuses error:', err);
  }
}

function persistCatalogue() {
  if (!serverCatalogue) return;
  try {
    fs.writeFileSync(CATALOGUE_FILE, JSON.stringify(serverCatalogue, null, 2));
  } catch (err) {
    console.warn('Persist catalogue error:', err);
  }
}

// Clients connectés au flux d'événements temps réel SSE (Server-Sent Events)
const sseClients = new Set<express.Response>();

function broadcastSse(event: { type: string; payload: unknown }) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

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
  streamCategory?: 'ORGANIC_STREAM' | 'SPONSORED_STREAM';
  campaignId?: string;
}

interface ProcessedEventRecord extends StreamEventPayload {
  processedAt: string;
}

interface ServerTrackMetrics {
  trackId: string;
  playCount: number;
  organicPlays: number;
  sponsoredPlays: number;
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
    organicPlays: 0,
    sponsoredPlays: 0,
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

  app.use(express.json({ limit: '50mb' }));

  // Middleware Anti-Cache Strict sur toutes les routes API et pages HTML
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  app.use((req, res, next) => {
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    next();
  });

  // ============================================================================
  // BUS DE SYNCHRONISATION UNIVERSEL TEMPS RÉEL (SERVER-SENT EVENTS - SSE)
  // ============================================================================

  app.get('/api/live-events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clients: sseClients.size })}\n\n`);

    const interval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'PING', timestamp: Date.now() })}\n\n`);
      } catch {
        clearInterval(interval);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(interval);
      sseClients.delete(res);
    });
  });

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
          if (event.streamCategory === 'SPONSORED_STREAM') {
            metric.sponsoredPlays += 1;
          } else {
            metric.organicPlays += 1;
          }
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

  app.get('/api/tokens/missions/:userId', (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ status: 'error', message: 'userId manquant' });
    const missions = getUserCompletedMissions(userId);
    return res.status(200).json({ status: 'ok', count: missions.length, missions });
  });

  app.post('/api/tokens/validate-mission', (req, res) => {
    try {
      const result = validateAndRewardMission(req.body);
      if (!result.success) {
        return res.status(400).json({
          status: 'error',
          alreadyRewarded: Boolean(result.alreadyRewarded),
          message: result.error,
        });
      }
      return res.status(200).json({
        status: 'ok',
        rewardTokens: result.rewardTokens,
        completion: result.completion,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur interne de validation de mission';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  // ============================================================================
  // TÉLÉCHARGEMENT QR SÉCURISÉ EXCLUSIVEMENT MOBILE (PHASE 6 & 7)
  // ============================================================================

  app.post('/api/download-requests', (req, res) => {
    try {
      const { trackId, trackTitle, trackArtist, coverUrl, userId } = req.body;
      if (!trackId || !userId) {
        return res.status(400).json({ status: 'error', message: 'trackId et userId requis' });
      }
      const ticket = createDownloadTicket({ trackId, trackTitle, trackArtist, coverUrl, userId });
      return res.status(200).json({ status: 'ok', ticket });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création ticket';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  app.get('/api/download-requests/:ticketId/status', (req, res) => {
    const { ticketId } = req.params;
    const result = getTicketStatus(ticketId);
    if (!result.found || !result.ticket) {
      return res.status(404).json({ status: 'error', message: result.error || 'Ticket non trouvé' });
    }
    return res.status(200).json({ status: 'ok', ticket: result.ticket });
  });

  app.post('/api/qr/resolve', (req, res) => {
    const { ticketId, mobileUserId } = req.body;
    if (!ticketId || !mobileUserId) {
      return res.status(400).json({ status: 'error', message: 'ticketId et mobileUserId requis' });
    }
    const result = resolveDownloadTicket({ ticketId, mobileUserId });
    if (!result.success) {
      return res.status(403).json({ status: 'error', message: result.error });
    }
    return res.status(200).json({ status: 'ok', ticket: result.ticket });
  });

  app.post('/api/qr/confirm', (req, res) => {
    const { ticketId, mobileUserId, quality } = req.body;
    if (!ticketId || !mobileUserId || !quality) {
      return res.status(400).json({ status: 'error', message: 'ticketId, mobileUserId et quality requis' });
    }
    const result = confirmDownloadTicket({ ticketId, mobileUserId, quality });
    if (!result.success) {
      return res.status(403).json({ status: 'error', message: result.error });
    }
    return res.status(200).json({
      status: 'ok',
      downloadAuthToken: result.downloadAuthToken,
      ticket: result.ticket,
    });
  });

  // ============================================================================
  // FLUX SOCIAL PARTAGÉ MULTI-APPAREILS & MÉDIAS EN LIGNE
  // ============================================================================

  app.get('/api/feed/posts', (_req, res) => {
    return res.status(200).json({
      status: 'ok',
      count: serverFeedPosts.length,
      posts: serverFeedPosts,
    });
  });

  app.post('/api/feed/posts', (req, res) => {
    try {
      const post = req.body?.post;
      if (!post || !post.id) {
        return res.status(400).json({ status: 'error', message: 'Post invalide' });
      }
      serverFeedPosts = [post, ...serverFeedPosts.filter((p) => p.id !== post.id)];
      persistPosts();
      broadcastSse({ type: 'POST_CREATED', payload: post });
      return res.status(200).json({ status: 'ok', post });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur sauvegarde post';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  app.get('/api/feed/statuses', (_req, res) => {
    const now = Date.now();
    const active = serverUserStatuses.filter((s) => {
      const exp = Date.parse(s.expiresAtIso);
      return Number.isFinite(exp) && exp > now;
    });
    return res.status(200).json({ status: 'ok', count: active.length, statuses: active });
  });

  app.post('/api/feed/statuses', (req, res) => {
    try {
      const status = req.body?.status;
      if (!status || !status.id) {
        return res.status(400).json({ status: 'error', message: 'Statut invalide' });
      }
      serverUserStatuses = [status, ...serverUserStatuses.filter((s) => s.id !== status.id)];
      persistStatuses();
      broadcastSse({ type: 'STATUS_CREATED', payload: status });
      return res.status(200).json({ status: 'ok', userStatus: status });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur sauvegarde statut';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  app.post('/api/feed/media-upload', (req, res) => {
    try {
      const { mediaId, base64Data } = req.body || {};
      if (!mediaId || !base64Data) {
        return res.status(400).json({ status: 'error', message: 'mediaId et base64Data requis' });
      }
      const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const filePath = path.join(MEDIA_DIR, mediaId);
      fs.writeFileSync(filePath, buffer);
      const mediaUrl = `/api/media/${mediaId}`;
      return res.status(200).json({ status: 'ok', mediaId, url: mediaUrl });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur téléversement média';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  app.get('/api/media/:mediaId', (req, res) => {
    const { mediaId } = req.params;
    const filePath = path.join(MEDIA_DIR, mediaId);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: 'error', message: 'Média non trouvé' });
    }
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const mimeType = mediaId.endsWith('.mp4')
      ? 'video/mp4'
      : mediaId.endsWith('.mp3')
      ? 'audio/mpeg'
      : mediaId.endsWith('.wav')
      ? 'audio/wav'
      : 'video/webm';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // ============================================================================
  // CAMPAGNES SPONSORISÉES CENTRALES & SYNCHRONISÉES
  // ============================================================================

  app.get('/api/campaigns', (req, res) => {
    const status = req.query.status as any;
    const campaigns = getSponsorCampaigns(status);
    return res.status(200).json({ status: 'ok', count: campaigns.length, campaigns });
  });

  app.post('/api/campaigns', (req, res) => {
    try {
      const result = createAndFundCampaign(req.body);
      if (!result.success || !result.campaign) {
        return res.status(400).json({ status: 'error', message: result.error });
      }
      broadcastSse({ type: 'CAMPAIGN_CREATED', payload: result.campaign });
      return res.status(200).json({ status: 'ok', campaign: result.campaign });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création campagne';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  // ============================================================================
  // CATALOGUE MUSICAL CENTRALISÉ & RÉHYDRATATION MULTI-APPAREILS
  // ============================================================================

  app.get('/api/catalogue', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).json({
      status: 'ok',
      hasData: Boolean(serverCatalogue && serverCatalogue.length > 0),
      catalogue: serverCatalogue || [],
      updatedAt: new Date().toISOString(),
    });
  });

  app.post('/api/catalogue', (req, res) => {
    try {
      const { catalogue } = req.body;
      if (!Array.isArray(catalogue)) {
        return res.status(400).json({ status: 'error', message: 'Format catalogue invalide (tableau attendu)' });
      }
      serverCatalogue = catalogue;
      persistCatalogue();
      broadcastSse({
        type: 'CATALOGUE_UPDATED',
        payload: {
          albumsCount: catalogue.length,
          tracksCount: catalogue.reduce((acc: number, a: any) => acc + (a.tracks?.length || 0), 0),
          timestamp: new Date().toISOString(),
        },
      });
      return res.status(200).json({ status: 'ok', count: catalogue.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur sauvegarde catalogue';
      return res.status(500).json({ status: 'error', message: msg });
    }
  });

  app.post('/api/catalogue/track', (req, res) => {
    try {
      const { track } = req.body;
      if (!track || !track.id || !track.title) {
        return res.status(400).json({ status: 'error', message: 'Titre ou identifiant de piste manquant' });
      }
      if (!serverCatalogue) {
        serverCatalogue = [];
      }

      const albumIdx = serverCatalogue.findIndex(
        (a: any) => a.artist?.toLowerCase() === track.artist?.toLowerCase() &&
               a.albumTitle?.toLowerCase() === (track.album || 'Single')?.toLowerCase()
      );

      if (albumIdx >= 0) {
        const trkIdx = serverCatalogue[albumIdx].tracks.findIndex((t: any) => t.id === track.id);
        if (trkIdx >= 0) {
          serverCatalogue[albumIdx].tracks[trkIdx] = { ...serverCatalogue[albumIdx].tracks[trkIdx], ...track };
        } else {
          serverCatalogue[albumIdx].tracks.unshift(track);
        }
      } else {
        serverCatalogue.unshift({
          id: `alb-${Date.now()}-${track.id}`,
          artist: track.artist,
          albumTitle: track.album || 'Single',
          category: track.category || 'Ntcham',
          year: '2026',
          tracks: [track],
        });
      }

      persistCatalogue();
      broadcastSse({
        type: 'TRACK_SAVED',
        payload: {
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          timestamp: new Date().toISOString(),
        },
      });
      broadcastSse({
        type: 'CATALOGUE_UPDATED',
        payload: {
          albumsCount: serverCatalogue.length,
          timestamp: new Date().toISOString(),
        },
      });

      return res.status(200).json({ status: 'ok', track });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur sauvegarde piste';
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
