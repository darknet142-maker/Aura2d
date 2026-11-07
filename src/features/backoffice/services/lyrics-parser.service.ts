export interface ParsedLyricLine {
  time: number;
  text: string;
}

const TIMESTAMP_REGEX = /^(?:\[?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]?)\s*(.*)$/;

export function parseRawLyricsInput(
  rawText: string,
  totalDurationSec = 180
): ParsedLyricLine[] {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const parsedWithTimestamp: ParsedLyricLine[] = [];
  let allHaveTimestamp = true;

  for (const line of lines) {
    const match = line.match(TIMESTAMP_REGEX);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const text = match[4].trim();
      parsedWithTimestamp.push({ time: minutes * 60 + seconds, text: text || '(Instrumental)' });
    } else {
      allHaveTimestamp = false;
    }
  }

  if (allHaveTimestamp && parsedWithTimestamp.length > 0) {
    return parsedWithTimestamp.sort((a, b) => a.time - b.time);
  }

  const safeDuration = Math.max(30, totalDurationSec - 10);
  const step = lines.length > 1 ? safeDuration / (lines.length - 1) : 0;

  return lines.map((text, idx) => ({
    time: Math.round(idx * step),
    text: text.replace(/^\[?\d{1,2}:\d{2}\]?\s*/, ''),
  }));
}

export function formatLyricsToRawText(lyrics?: ParsedLyricLine[]): string {
  if (!lyrics || lyrics.length === 0) return '';
  return lyrics
    .map((l) => {
      const mm = String(Math.floor(l.time / 60)).padStart(2, '0');
      const ss = String(Math.floor(l.time % 60)).padStart(2, '0');
      return `[${mm}:${ss}] ${l.text}`;
    })
    .join('\n');
}

export function generateStandardLyricsTemplate(title?: string, artist?: string): string {
  const t = title || 'Titre';
  const a = artist || 'Artiste';
  return [
    `[00:00] (Introduction musicale — ${t} par ${a})`,
    '[00:15] Premier couplet : Dans les rues de la ville, le rythme s\'élève...',
    '[00:32] Le tempo accélère, les basses résonnent sous le ciel étoilé',
    '[00:48] [DROP] Refrain : Écoute l\'appel, le son nous rassemble !',
    '[01:05] Deuxième couplet : Chaque parole trace notre histoire et nos pas',
    '[01:25] La mélodie prend le dessus, l\'énergie ne redescend plus',
    '[01:45] [DROP] Refrain final : La cadence est gravée, le morceau est éternel',
    '[02:10] (Outro : Fading vocal et résonance finale)',
  ].join('\n');
}

