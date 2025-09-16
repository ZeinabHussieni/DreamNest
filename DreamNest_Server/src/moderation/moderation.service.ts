import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  buildWordRegex,
  buildWordRegexLoose,
  buildArabicRegex,
  buildArabicRegexLoose,
  censorText,
} from './censor.util';
import * as leo from 'leo-profanity';
import * as fsp from 'fs/promises';
import * as path from 'path';

const naughtyWords = require('naughty-words');

export type ModerationVerdict =
  | { ok: true }
  | { ok: false; reason: 'blocklist' };

type ReadyState = { ready: boolean; error?: unknown };

const ZERO_WIDTH_RX = /[\u200B-\u200F\u202A-\u202E]/g;
const TATWEEL_RX = /\u0640/g;
const SUPERSCRIPT_ALEF_RX = /\u0670/g;

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '2': 'a',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '6': 'g',
  '7': 't',
  '8': 'b',
  '9': 'g',
};

function normalizeLeet(s: string) {
  return s.replace(/[0-9]/g, (d) => LEET_MAP[d] ?? d);
}

function collapseLatinRepeatsTo1(s: string) {
  return s.replace(/([a-z])\1+/gi, '$1');
}

function normalizeArabic(s: string) {
  return s
    .normalize('NFKD')
    .replace(ZERO_WIDTH_RX, '')
    .replace(TATWEEL_RX, '')
    .replace(SUPERSCRIPT_ALEF_RX, '')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/([اأإآ])/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ+/g, '')
    .replace(/(.)\1{2,}/g, '$1$1');
}

function prep(text: string) {
  const t = text.toLowerCase().trim();
  const noLeet = normalizeLeet(t);
  const ar = normalizeArabic(noLeet);
  return collapseLatinRepeatsTo1(ar);
}

function englishRepeatVariants(text: string) {
  const v0 = text;
  const v1 = collapseLatinRepeatsTo1(text);
  return [v0, v1];
}

function buildLatinBoundaryRegex(terms: string[]) {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const body = terms.map(esc).join('|');
  if (!body) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])`, 'iu');
}

@Injectable()
export class ModerationService implements OnModuleInit {
  private customWords = new Set<string>();
  private customPhrasesRaw: string[] = [];
  private customPhrasesPrepared: string[] = [];
  private customPatterns: RegExp[] = [];
  private ready: ReadyState = { ready: false };
  private readonly logger = new Logger(ModerationService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY!;
  private readonly visionModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-4o-mini';
  private readonly baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  private strictRx: RegExp | null = null;
  private looseRx: RegExp | null = null;
  private arStrictRx: RegExp | null = null;
  private arLooseRx: RegExp | null = null;
  private latinWordRegex: RegExp | null = null;

  async onModuleInit() {
    leo.clearList();
    leo.loadDictionary('en');
    try {
      await this.loadBlocklists();
      this.ready.ready = true;
    } catch (e) {
      this.ready = { ready: false, error: e };
    }
  }

  private resolveRulesDir() {
    const candidates = [
      path.join(process.cwd(), 'dist', 'rules'),
      path.join(process.cwd(), 'dist', 'src', 'rules'),
      path.join(process.cwd(), 'src', 'rules'),
    ];
    for (const dir of candidates) {
      try {
        require('fs').accessSync(dir);
        return dir;
      } catch {}
    }
    this.logger.warn(`Rules dir not found. Tried: ${candidates.join(' , ')}`);
    return candidates[0];
  }

  private async readLines(filePath: string) {
    const raw = await fsp.readFile(filePath, 'utf8');
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  }

  private rebuildLatinWordRegex() {
    const all = Array.from(this.customWords);
    const latinOnly = all.filter((w) => /^[a-z]+$/i.test(w));
    const arabicOnly = all.filter((w) => /[\u0600-\u06FF]/.test(w));
    this.strictRx = buildWordRegex(latinOnly);
    this.looseRx = buildWordRegexLoose(latinOnly);
    this.arStrictRx = buildArabicRegex(arabicOnly);
    this.arLooseRx = buildArabicRegexLoose(arabicOnly);
  }

  getArabicRegex() {
    return this.arStrictRx;
  }

  getArabicRegexLoose() {
    return this.arLooseRx;
  }

  private async loadBlocklists() {
    this.customWords.clear();
    this.customPhrasesRaw = [];
    this.customPhrasesPrepared = [];
    this.customPatterns = [];
    try {
      const arList: string[] = Array.isArray(naughtyWords?.ar) ? naughtyWords.ar : [];
      for (const w of arList) this.customWords.add(prep(w));
    } catch {}
    const baseDir = this.resolveRulesDir();
    try {
      const enList: string[] = Array.isArray(naughtyWords?.en) ? naughtyWords.en : [];
      for (const w of enList) this.customWords.add(prep(w));
    } catch {}
    try {
      const lines = await this.readLines(path.join(baseDir, 'arabizi.txt'));
      for (const w of lines) this.customWords.add(prep(w));
    } catch {}
    this.rebuildLatinWordRegex();
  }

  async reloadBlocklists() {
    await this.loadBlocklists();
    this.ready.ready = true;
  }

  private ensureReady() {
    if (!this.ready.ready) {
      return false;
    }
    return true;
  }

  getWordRegex(): RegExp | null {
    return this.strictRx;
  }

  getWordRegexLoose(): RegExp | null {
    return this.looseRx;
  }

  censor(content: string) {
    let masked = content;
    let isBad = false;
    const passes = [
      this.getWordRegex(),
      this.getWordRegexLoose(),
      this.getArabicRegex(),
      this.getArabicRegexLoose(),
    ].filter(Boolean) as RegExp[];
    for (const rx of passes) {
      const res = censorText(masked, rx);
      if (res.isBad) {
        masked = res.censored;
        isBad = true;
      }
    }
    const raw = content.replace(ZERO_WIDTH_RX, '').trim();
    if (leo.check(raw) || leo.check(masked)) {
      const leoC = leo.clean(masked);
      masked = leoC.replace(/\*+/g, '████');
      isBad = true;
    }
    return { isBad, censored: masked };
  }

  async isBlocked(text: string): Promise<ModerationVerdict> {
    if (!this.ensureReady()) {
      return { ok: true };
    }
    const raw = text.replace(ZERO_WIDTH_RX, '').trim();
    const prepared = prep(raw);
    const variants = englishRepeatVariants(raw).concat(englishRepeatVariants(prepared));
    for (const v of variants) {
      if (leo.check(v)) {
        return { ok: false, reason: 'blocklist' };
      }
    }
    if (this.latinWordRegex && this.latinWordRegex.test(prepared)) {
      return { ok: false, reason: 'blocklist' };
    }
    for (const w of this.customWords) {
      if (prepared.includes(w)) {
        return { ok: false, reason: 'blocklist' };
      }
    }
    for (let i = 0; i < this.customPhrasesRaw.length; i++) {
      const rawPhrase = this.customPhrasesRaw[i];
      const prepPhrase = this.customPhrasesPrepared[i];
      if (raw.toLowerCase().includes(rawPhrase.toLowerCase())) {
        return { ok: false, reason: 'blocklist' };
      }
      if (prepared.includes(prepPhrase)) {
        return { ok: false, reason: 'blocklist' };
      }
    }
    for (const r of this.customPatterns) {
      if (r.test(raw) || r.test(prepared)) {
        return { ok: false, reason: 'blocklist' };
      }
    }
    return { ok: true };
  }

  async isImageBlocked(buf: Buffer, mime: string): Promise<{ ok: boolean; raw?: any }> {
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
    const res = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.visionModel,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  'Classify this image for safety only. Reply with compact JSON:\n' +
                  '{"sexual":bool,"sexual_explicit":bool,"sexual_minors":bool,' +
                  '"violence":bool,"violence_graphic":bool,"self_harm":bool,"flagged":bool}.\n' +
                  'Set "flagged": true if ANY unsafe category is true. No extra text.',
              },
              { type: 'input_image', image_url: dataUrl },
            ],
          },
        ],
        temperature: 0,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.warn(`Image moderation error ${res.status}: ${text}`);
      return { ok: true };
    }
    const json: any = await res.json();
    const outText =
      json?.output_text ??
      json?.output?.[0]?.content?.[0]?.text ??
      json?.choices?.[0]?.message?.content ??
      '';
    let flags: any = {};
    try {
      const m = outText.match(/\{[\s\S]*\}/);
      flags = m ? JSON.parse(m[0]) : JSON.parse(outText);
    } catch {
      this.logger.warn(`Image moderation parse failed. Raw: ${outText?.slice(0, 200)}`);
      return { ok: true };
    }
    const blockAnyViolence = (process.env.BLOCK_ANY_VIOLENCE || 'false').toLowerCase() === 'true';
    const block =
      !!flags.flagged ||
      !!flags.sexual ||
      !!flags.sexual_explicit ||
      !!flags.sexual_minors ||
      !!flags.violence_graphic ||
      !!flags.self_harm ||
      (blockAnyViolence && !!flags.violence);
    return { ok: !block, raw: flags };
  }
}
