import { Injectable } from '@nestjs/common';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

@Injectable()
export class LlmService {
  private readonly baseURL = process.env.LLM_BASE_URL || 'http://localhost:11434/v1';
  private readonly model   = process.env.LLM_MODEL || process.env.OLLAMA_MODEL || 'llama3.1';
  private readonly maxTok  = num(process.env.LLM_MAX_TOKENS, 1400);
  private readonly temp    = num(process.env.LLM_TEMPERATURE, 0.7);//how much the model creative
  private readonly auth    = process.env.OLLAMA_API_KEY ? `Bearer ${process.env.OLLAMA_API_KEY}` : undefined;//if we send ollama api key
 
  //this for emails for text
  async chatText(system: string, user: string): Promise<string> {
    return this.send([
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ]);
  }
 
  //this to give a json output it parsed object
  async chatJson<T extends object = Record<string, unknown>>(system: string, user: string): Promise<T> {
    const s = `${system}\n\nReturn ONLY a single minified JSON object. No extra text.`;
    const txt = await this.send([
      { role: 'system', content: s },
      { role: 'user',   content: user },
    ]);
    return safeJson<T>(txt);
  }

 //here what we need to send to ollama our request
  private async send(messages: Msg[], attempts = 2): Promise<string> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(this.auth ? { Authorization: this.auth } : {}) },
          body: JSON.stringify({ model: this.model, messages, temperature: this.temp, max_tokens: this.maxTok }),
        });
        if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text().catch(()=>'')}`);
        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() ?? '';
      } catch (e) {
        lastErr = e; if (i < attempts - 1) await wait(300 * 2 ** i);
      }
    }
    throw lastErr;
  }
}

//just pause executions for ms
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
//to convert enviroment to strg
const num  = (v: string | undefined, d: number) => (Number.isFinite(+v!) && +v! > 0 ? +v! : d);
//if file return {}
function safeJson<T extends object = Record<string, unknown>>(t: string): T {
  try { const o = JSON.parse(t); return (o && typeof o === 'object' && !Array.isArray(o)) ? o as T : {} as T; }
  catch { return {} as T; }
}
