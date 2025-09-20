import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LlmService } from 'src/llm/llm.service';

type PlanItemIn = Partial<{
  title: string;
  description: string;
  due_date: string; 
}>;

type PlanJson = { items?: PlanItemIn[] | null };

type SolidPlanItem = { title: string; description: string; due_date: string };
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


    const today = isoDay(new Date());
    const system = buildSystemPrompt(today);
    const user   = buildUserPrompt(title, description || undefined);
    let draft = await this.draftPlan(system, user);


    draft = await this.refinePlan(today, title, description ?? undefined, draft);


    const solid = this.validateAndRepair(draft, /*min*/6, /*max*/8, today);

    if (solid.length) {
      await this.prisma.plan.createMany({
        data: solid.map((p) => ({
          goal_id: goalId,
          title: p.title,
          description: p.description,
          due_date: new Date(p.due_date), 
          completed: false,
        })),
      });
    }

    return { created: solid.length };
  }



  private async draftPlan(system: string, user: string): Promise<PlanJson> {
    const json = await this.llm.chatJson<PlanJson>(system, user);
    return json ?? {};
  }

  private async refinePlan(todayISO: string, title: string, desc: string | undefined, first: PlanJson): Promise<PlanJson> {
    const criticSystem = [
      'You are a rigorous planning critic and repairer.',
      'Input: a JSON plan with items[{title,description,due_date}].',
      'Rules to enforce strictly:',
      '- 6 to 8 items total.',
      '- Non-empty title & description.',
      '- due_date must be ISO (YYYY-MM-DD), NOT in the past (>= TODAY).',
      `- TODAY = ${todayISO}.`,
      'Return ONLY minified JSON with the same shape. No prose.'
    ].join('\n');

    const criticUser = [
      `Goal title: ${JSON.stringify(title)}`,
      `Goal description: ${JSON.stringify(desc ?? '')}`,
      'Plan to critique (JSON):',
      JSON.stringify(first),
      'Fix any problems. Preserve user intent.'
    ].join('\n');

    const repaired = await this.llm.chatJson<PlanJson>(criticSystem, criticUser);
    return repaired ?? first;
  }

private validateAndRepair(json: PlanJson, min: number, max: number, todayISO: string): SolidPlanItem[] {
  const items: PlanItemIn[] = Array.isArray(json?.items) ? json.items!.slice(0, max) : [];
  const out: SolidPlanItem[] = [];
  const today = new Date(todayISO);

  const need = Math.max(min, Math.min(max, items.length || min));

  const base: PlanItemIn[] = items.length
    ? items
    : Array.from({ length: need }, () => ({} as PlanItemIn));

  for (let i = 0; i < need; i++) {
    const raw: PlanItemIn = base[i] ?? {};
    const idx = i + 1;

    const title = str(raw.title) || `Step ${idx}`;
    const description =
      str(raw.description) ||
      `Do a focused action toward "${title}". Aim for 20–30 minutes. You’ve got this!`;

    const due = coerceFutureISO(raw.due_date, today, /*offsetDays*/ 7 * i);

    out.push({ title, description, due_date: due });
  }

  return out;
}
}

function isoDay(d: Date): string {
  const c = new Date(d); c.setHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}
function str(v: unknown): string {
  return (v ?? '').toString().trim();
}

function coerceFutureISO(input: unknown, today: Date, offsetDays: number): string {
  const fallback = new Date(today.getTime() + offsetDays * 86_400_000);
  fallback.setHours(0, 0, 0, 0);

  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const parsed = new Date(input + 'T00:00:00Z');
    if (!Number.isNaN(parsed.getTime()) && parsed >= today) {
      return input;
    }
  }

  const yyyy = fallback.getUTCFullYear();
  const mm = String(fallback.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(fallback.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}


function buildSystemPrompt(todayISO: string, lang = 'en'): string {
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
Create 6–8 steps exactly as defined. Use TODAY to schedule.
Final output must be entirely in ${lang}.
`.trim();
}
