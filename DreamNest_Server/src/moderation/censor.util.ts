const ZERO_WIDTH_RX = /[\u200B-\u200F\u202A-\u202E]/g;
const AR_DIACRITICS_RX = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g;
const TATWEEL_RX = /\u0640/g;

const LEET_INV: Record<string, string> = {
  a: 'a4@', b: 'b8', e: 'e3', g: 'g69', i: 'i1!', l: 'l1',
  o: 'o0', s: 's5$', t: 't7', z: 'z2', c: 'c(', k: 'k',
  u: 'u', f: 'f', h: 'h', r: 'r', n: 'n', m: 'm',
  d: 'd', p: 'p', q: 'q', v: 'v', w: 'w', y: 'y', x: 'x', j: 'j'
};

function uniqChars(s: string) {
  return Array.from(new Set(s.split(''))).join('');
}

function escClassChar(ch: string) {
  return ch.replace(/[[\]\\^-]/g, '\\$&');
}

function letterClass(ch: string) {
  const base = ch.toLowerCase();
  const group = LEET_INV[base] || base;
  const unique = uniqChars(group).split('').map(escClassChar).join('');
  return `[${unique}]`;
}

function fuzzifyWord(w: string) {
  return w
    .toLowerCase()
    .split('')
    .map(letterClass)
    .map(cls => `${cls}+`)
    .join(`(?:[\\s._-]{0,3})`);
}

export function buildWordRegex(badWords: string[]) {
  const latin = badWords.filter(w => /^[a-z]+$/i.test(w.trim()));
  if (!latin.length) return null;
  const parts = latin.map(fuzzifyWord).join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts})(?![\\p{L}\\p{N}])`, 'giu');
}

export function buildWordRegexLoose(badWords: string[]) {
  const latin = badWords.filter(w => /^[a-z]+$/i.test(w.trim()));
  if (!latin.length) return null;
  const parts = latin.map(fuzzifyWord).join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts})`, 'giu');
}

export function normalizeForMatch(s: string) {
  const lower = s.toLowerCase().replace(ZERO_WIDTH_RX, '').trim();
  return lower.normalize('NFKD').replace(AR_DIACRITICS_RX, '').replace(TATWEEL_RX, '');
}

export function censorText(original: string, rx: RegExp | null) {
  if (!rx) return { isBad: false, censored: original };
  let isBad = false;
  const censored = original.replace(rx, () => {
    isBad = true;
    return '████';
  });
  return { isBad, censored };
}

const AR_EQUIV: Record<string, string> = {
  'ا': 'ااأإآ',
  'ه': 'ههة',
  'ي': 'ييىی'
};

const AR_DIAC = String.raw`[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]*`;
const AR_SEP = String.raw`(?:${AR_DIAC}|[\s\._\-\u200B-\u200F\u202A-\u202E\u0640]){0,3}`;

function arLetterClass(ch: string) {
  const base = AR_EQUIV[ch] || ch;
  const unique = Array.from(new Set(base.split(''))).map(escClassChar).join('');
  return `[${unique}]+`;
}

export function buildArabicRegex(words: string[]) {
  const arabic = words.map(w => w.trim()).filter(w => /[\u0600-\u06FF]/.test(w));
  if (!arabic.length) return null;
  const parts = arabic
    .map(w => w.split('').map(arLetterClass).join(`(?:${AR_SEP})`))
    .join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts})(?![\\p{L}\\p{N}])`, 'gu');
}

export function buildArabicRegexLoose(words: string[]) {
  const arabic = words.map(w => w.trim()).filter(w => /[\u0600-\u06FF]/.test(w));
  if (!arabic.length) return null;
  const parts = arabic
    .map(w => w.split('').map(arLetterClass).join(`(?:${AR_SEP})`))
    .join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts})`, 'gu');
}
