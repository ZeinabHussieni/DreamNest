const ZERO_WIDTH_RX = /[\u200B-\u200F\u202A-\u202E]/g;
const AR_DIACRITICS_RX = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g;
const TATWEEL_RX = /\u0640/g;
const REPEAT_LATIN_RX = /(.)\1{2,}/g;
const LEET: Record<string, string> = { '0':'o','1':'i','2':'a','3':'e','4':'a','5':'s','6':'g','7':'t','8':'b','9':'g' };

export function normalizeForMatch(s: string) {
  const lower = s.toLowerCase().replace(ZERO_WIDTH_RX, '').trim();
  const deLeet = lower.replace(/[0-9]/g, d => LEET[d] ?? d);
  const ar = deLeet
    .normalize('NFKD')
    .replace(AR_DIACRITICS_RX, '')
    .replace(TATWEEL_RX, '')
    .replace(/([اأإآ])/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ+/g, '');
  return ar.replace(REPEAT_LATIN_RX, '$1$1');
}

export function buildWordRegex(badWords: string[]) {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const list = badWords.map(esc).join('|');
  if (!list) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}])(${list})(?![\\p{L}\\p{N}])`, 'giu');
}


export function censorText(original: string, rx: RegExp | null) {
  if (!rx) return { isBad: false, censored: original };
  const censored = original.replace(rx, '████');
  return { isBad: censored !== original, censored };
}
