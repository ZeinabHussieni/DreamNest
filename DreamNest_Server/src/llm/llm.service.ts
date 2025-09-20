import { Injectable } from '@nestjs/common';


type Msg = { role: 'system' | 'user' | 'assistant'; content: string };


@Injectable()
export class LlmService {
  private readonly apiKey = process.env.OPENAI_API_KEY!;
  private readonly baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  private readonly model = process.env.LLM_MODEL || 'gpt-4o-mini';
  private readonly maxTok = num(process.env.LLM_MAX_TOKENS, 1400);
  private readonly temp   = num(process.env.LLM_TEMPERATURE, 0.7);

  async chatText(system: string, user: string): Promise<string> {
    return this.send([
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ]);
  }

  async chatJson<T extends object = Record<string, unknown>>(system: string, user: string): Promise<T> {
    const s = `${system}\n\nReply ONLY with a single minified JSON object. No extra text.`;
    const first = await this.send(
      [{ role: 'system', content: s }, { role: 'user', content: user }],
      /*jsonMode*/ true
    );
    const parsed1 = safeJson<T>(first);
    if (Object.keys(parsed1).length) return parsed1;

    const repaired = await this.send(
      [
        { role: 'system', content: 'You are a strict JSON repairer. Return ONLY valid minified JSON that matches the user’s intent. No prose.' },
        { role: 'user',   content: `Repair to valid JSON (no comments, no markdown):\n${first}` },
      ],
      /*jsonMode*/ true
    );
    return safeJson<T>(repaired);
  }



  private async send(messages: Msg[], jsonMode = false, attempts = 2): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20_000); 

    try {
      const res = await fetch(`${this.baseURL.replace(/\/+$/,'')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: this.temp,
          max_tokens: this.maxTok,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      clearTimeout(t);

      if (!res.ok) {
     
        const text = await res.text().catch(() => '');
        const err = new Error(`OpenAI ${res.status}: ${text}`);
        if (res.status === 429 || res.status >= 500) throw err;
        throw err; 
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (typeof content !== 'string') throw new Error('No content in OpenAI response');
      return content;

    } catch (e) {
      lastErr = e;
  
      if (i < attempts - 1) {
        const base = 400 * 2 ** i;
        await wait(base + Math.floor(Math.random() * 200));
      }
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const num  = (v: string | undefined, d: number) => (Number.isFinite(+v!) && +v! > 0 ? +v! : d);
function safeJson<T extends object = Record<string, unknown>>(raw: string): T {
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as T) : ({} as T);
  } catch { return {} as T; }
}
