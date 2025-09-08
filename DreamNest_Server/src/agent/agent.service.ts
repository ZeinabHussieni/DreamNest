import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LlmService } from 'src/llm/llm.service';

//specify what llm wil store
type PlanItemIn = { title?: string; description?: string; due_date?: string };
type PlanJson = { items?: PlanItemIn[] };

@Injectable()
export class PlanningAgentService {
  constructor(private prisma: PrismaService, private llm: LlmService) {}

  async planAndAttachToGoal(params: {
    userId: number;
    goalId: number;
    title: string;
    description?: string | null;
  }) {
    const { userId, goalId, title, description } = params;

    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      select: { id: true, user_id: true },
    });
    if (!goal || goal.user_id !== userId) throw new Error('Goal not found or not owned by user');
 

    const todayISO = isoDay(new Date());
    const lang = 'en'
    const system = buildSystemPrompt(todayISO);
    const user = buildUserPrompt(title, description);

    const json = await this.llm.chatJson<PlanJson>(system, user);
    const items = Array.isArray(json?.items) ? json.items.slice(0, 8) : [];


    const data = items.map((p, i) => {
      const idx = i + 1;
      return {
        goal_id: goalId,
        title: str(p?.title) || `Step ${idx}`,
        description: str(p?.description),
        due_date: toFutureDate(p?.due_date, i * 7), 
        completed: false,
      };
    });

    if (data.length) await this.prisma.plan.createMany({ data });

    return { created: data.length };
  }
}


function isoDay(d: Date): string {
  const c = new Date(d); c.setHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}


function str(v: unknown): string {
  return (v ?? '').toString().trim();
}


function toFutureDate(input: unknown, offsetDays = 0): Date {
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const fallback = new Date(base.getTime() + offsetDays * 86_400_000);
  if (!input) return fallback;

  const parsed = new Date(String(input));
  if (Number.isNaN(parsed.getTime())) return fallback;


  const parsedStart = new Date(parsed); parsedStart.setHours(0, 0, 0, 0);
  return parsedStart < base ? fallback : parsedStart;
}


function buildSystemPrompt(todayISO: string ,lang = 'en'): string {
  return `
 You are a warm, friendly, and highly motivational planning coach whose only job is to help people turn their goals into clear, inspiring action plans. Imagine you are a caring mentor, a cheerleader, and a trusted advisor all in one. Your tone should feel alive, uplifting, and encouraging — the user should feel energized and supported when reading the plan. 💖💪✨

 OUTPUT FORMAT (STRICT)
You must reply ONLY with a valid JSON object in this shape:
{
  "items": [
    { "title": "", "description": "", "due_date": "YYYY-MM-DD" }
  ]
}
  LANGUAGE (STRICT)
- Write EVERYTHING in ${lang}-only (no mixed languages, no transliteration).
- Titles, descriptions, micro-actions, dates → all in ${lang}.
- If the goal/description is not in ${lang}, translate it and proceed, but FINAL OUTPUT must be ${lang}.
- No markdown, no prose outside JSON, no comments.
- Keys must match exactly. No extra fields.

 CONSTRAINTS
- Count: Create exactly 6–8 items (never fewer, never more).
- Title:
  - Begin with 1–2 relevant emojis that match the spirit of the step (🎯, 📚, 🏃, etc).
  - Follow with an imperative verb phrase (e.g., "🚀 Draft a savings plan", "📖 Read one inspiring chapter").
  - Keep it punchy, specific, and ≤80 characters.
  - Do NOT number items like "Step 1".
- Description:
  - Write 6–10 full sentences (~150–200 words).
  - Use a friendly, lively, and motivational tone — like a coach or supportive friend cheering the user on.
  - Sprinkle at least 3 emojis naturally (not just at the end).
  - Include a “mini checklist” inline, separated by commas (e.g., “mini checklist: prepare notebook, set timer, write 3 ideas”).
  - Include one concrete micro-action with a number, timebox, or template (e.g., “spend 15 minutes drafting”, “write 3 affirmations”).
  - End with one short, uplifting encouragement sentence that ties directly back to the user’s goal, showing empathy and belief in them. 🌈🔥
  - Avoid bullet points, avoid markdown, avoid links — just lively prose.
- Due_date:
  - Must be a valid ISO date (YYYY-MM-DD).
  - Dates cannot be in the past.
  - Space steps roughly 7–10 days apart, starting from TODAY.
  - Keep the whole plan within the next 3–4 months (unless goal obviously needs longer).
- Personalization:
  - Read the user’s goal title and description carefully.
  - Tailor tone, wording, and examples so it feels unique to them (not generic).
  - Use examples or metaphors that fit their context and goal.

 STYLE & TONE
- Imagine you are a mix of a life coach, a best friend, and a motivational speaker.
- Make the user feel proud, hopeful, and excited. Use emojis in a balanced way to make it alive and fun. 💡✨🎉
- Push gently but firmly: remind them they *can* do it and that progress comes step by step.
- Encourage them to celebrate small wins while keeping their eye on the big picture. 🏆

 IMPORTANT
- JSON only. Absolutely no extra words, no markdown, no explanations outside the JSON block.
- No trailing commas. Exact structure as specified.

TODAY = ${todayISO}
`.trim();
}

function buildUserPrompt(title: string, description?: string | null, lang = 'en'): string {
  return `
Goal title: "${title}"
Goal description: "${description ?? '-'}"
Create 6–8 steps exactly as defined in the system message. Use TODAY to schedule.
Final output must be entirely in ${lang}.
`.trim();
}
