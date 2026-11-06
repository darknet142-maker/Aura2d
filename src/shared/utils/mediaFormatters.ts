// Formatage en MM:SS (02:42) pour les formulaires et fiches Admin
export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
}

export function formatLongDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) {
    return `${h}h${m.toString().padStart(2, '0')}`;
  }
  return `${m}m`;
}

export function formatCompactCount(n: number, custom?: string): string {
  if (custom) return custom;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2).replace('.00', '')}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${Math.round(n)}`;
}

export function parseDurationInput(str: string): number {
  const clean = str.trim();
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return Math.max(30, mins * 60 + secs);
  }
  const num = parseInt(clean, 10);
  return Number.isNaN(num) ? 180 : Math.max(30, num);
}

export function extractExternalStreamId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return match[2];
  if (url.trim().length === 11 && !url.includes('/')) return url.trim();
  return null;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes.slice(0, 48))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

