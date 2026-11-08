import type {
  QrDownloadTicket,
  CreateTicketParams,
  ResolveTicketParams,
  ConfirmTicketParams,
} from '../types/qr-download.types';

const ticketsRegistry = new Map<string, QrDownloadTicket>();

export function createDownloadTicket(params: CreateTicketParams): QrDownloadTicket {
  const ticketId = `dl-tk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  const ticket: QrDownloadTicket = {
    ticketId,
    qrPayload: `drop-dl://ticket/${ticketId}`,
    trackId: params.trackId,
    trackTitle: params.trackTitle,
    trackArtist: params.trackArtist,
    coverUrl: params.coverUrl,
    userId: params.userId,
    createdAtIso: new Date(now).toISOString(),
    expiresAtIso: new Date(now + 120_000).toISOString(),
    status: 'PENDING',
  };
  ticketsRegistry.set(ticketId, ticket);
  return ticket;
}

export function getTicketStatus(ticketId: string): { found: boolean; ticket?: QrDownloadTicket; error?: string } {
  const ticket = ticketsRegistry.get(ticketId);
  if (!ticket) return { found: false, error: 'Ticket introuvable' };

  if (ticket.status === 'PENDING' && Date.now() > new Date(ticket.expiresAtIso).getTime()) {
    ticket.status = 'EXPIRED';
    ticket.rejectionReason = 'Durée de validité de 2 minutes expirée';
  }
  return { found: true, ticket };
}

export function resolveDownloadTicket(params: ResolveTicketParams): {
  success: boolean;
  ticket?: QrDownloadTicket;
  error?: string;
} {
  const { ticketId, mobileUserId } = params;
  const { found, ticket, error } = getTicketStatus(ticketId);
  if (!found || !ticket) return { success: false, error: error || 'Ticket introuvable' };

  if (ticket.status === 'EXPIRED') {
    return { success: false, error: 'Ce QR code a expiré (2 minutes max)' };
  }
  if (ticket.status === 'CONFIRMED') {
    return { success: false, error: 'Ce QR code a déjà été utilisé (sécurité usage unique)' };
  }
  if (ticket.userId !== mobileUserId) {
    ticket.status = 'REJECTED';
    ticket.rejectionReason = 'Le compte mobile ne correspond pas au compte web demandeur';
    return { success: false, error: 'Accès refusé : Le compte connecté sur mobile ne correspond pas au compte web' };
  }

  ticket.status = 'SCANNED';
  return { success: true, ticket };
}

export function confirmDownloadTicket(params: ConfirmTicketParams): {
  success: boolean;
  downloadAuthToken?: string;
  ticket?: QrDownloadTicket;
  error?: string;
} {
  const { ticketId, mobileUserId, quality } = params;
  const res = resolveDownloadTicket({ ticketId, mobileUserId });
  if (!res.success || !res.ticket) return res;

  const ticket = res.ticket;
  const authToken = `ga-sec-token-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  ticket.status = 'CONFIRMED';
  ticket.selectedQuality = quality;
  ticket.downloadAuthToken = authToken;

  return { success: true, downloadAuthToken: authToken, ticket };
}
