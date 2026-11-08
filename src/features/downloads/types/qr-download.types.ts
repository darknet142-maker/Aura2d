export type QrTicketStatus = 'PENDING' | 'SCANNED' | 'CONFIRMED' | 'EXPIRED' | 'REJECTED';
export type AudioDownloadQuality = 'STANDARD' | 'HIGH';

export interface QrDownloadTicket {
  ticketId: string;
  qrPayload: string; // opaque URI e.g. `drop-dl://ticket/${ticketId}` — JAMAIS d'URL audio !
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  coverUrl?: string;
  userId: string;
  createdAtIso: string;
  expiresAtIso: string;
  status: QrTicketStatus;
  selectedQuality?: AudioDownloadQuality;
  downloadAuthToken?: string;
  rejectionReason?: string;
}

export interface CreateTicketParams {
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  coverUrl?: string;
  userId: string;
}

export interface ResolveTicketParams {
  ticketId: string;
  mobileUserId: string;
}

export interface ConfirmTicketParams {
  ticketId: string;
  mobileUserId: string;
  quality: AudioDownloadQuality;
}

