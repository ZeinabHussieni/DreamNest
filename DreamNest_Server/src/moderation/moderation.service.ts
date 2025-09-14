import { Injectable, OnModuleInit,Logger  } from '@nestjs/common';
import { buildWordRegex, censorText, normalizeForMatch } from './censor.util';
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
 private readonly visionModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-4o-mini'; // <-- for images
  private readonly baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com').replace(/\/+$/, '');

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
    return path.join(process.cwd(), 'src', 'rules');
  }

  private async readLines(filePath: string) {
    const raw = await fsp.readFile(filePath, 'utf8');
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  }

  private rebuildLatinWordRegex() {
    const latinOnly = Array.from(this.customWords).filter((w) => /^[a-z]+$/i.test(w));
    this.latinWordRegex = buildLatinBoundaryRegex(latinOnly);
  }

  private async loadBlocklists() {
    this.customWords.clear();
    this.customPhrasesRaw = [];
    this.customPhrasesPrepared = [];
    this.customPatterns = [];


    try {
      const arList: string[] = Array.isArray(naughtyWords?.ar) ? naughtyWords.ar : [];
      for (const w of arList) this.customWords.add(prep(w));
    } catch {

    }

    const baseDir = this.resolveRulesDir();


    try {
      const lines = await this.readLines(path.join(baseDir, 'arabizi.txt'));
      for (const w of lines) this.customWords.add(prep(w));
    } catch {

    }

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
    const latin = Array.from(this.customWords); 
    return buildWordRegex(latin);
  }

 censor(content: string) {
  const rx = this.getWordRegex();
  const { censored: rxCensored, isBad: rxHit } = censorText(content, rx);
  const raw = content.replace(ZERO_WIDTH_RX, '').trim();
  const prepared = prep(raw);
  const variants = englishRepeatVariants(raw).concat(englishRepeatVariants(prepared));
  const leoHit = variants.some(v => leo.check(v));
  let censored = rxCensored;
  if (leoHit) {
    const leoC = leo.clean(content);
    censored = leoC.replace(/\*+/g, '████');
  }

  return { isBad: rxHit || leoHit, censored };
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

    const res = await fetch(`${this.baseUrl}/v1/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.visionModel,
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Classify this image for safety only. Reply with compact JSON:\n' +
                '{"sexual":bool,"sexual_explicit":bool,"sexual_minors":bool,' +
                '"violence":bool,"violence_graphic":bool,"self_harm":bool,"flagged":bool}.\n' +
                'Set "flagged": true if ANY unsafe category is true. No extra text.'
            },
            { type: 'input_image', image_url: dataUrl },
          ],
        }],
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



