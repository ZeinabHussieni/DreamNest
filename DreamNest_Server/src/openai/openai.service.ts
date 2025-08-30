import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      timeout: 60000, 
    });
  }


  async generatePlan(goalTitle: string, goalDescription: string) {
const todayISO = new Date().toISOString().slice(0,10);

const prompt = `
You are an expert productivity and goal-planning assistant.

Today's date: ${todayISO}

A user wants to achieve this goal:
Title: "${goalTitle}"
Description: "${goalDescription}"

Instructions:
- Return 3–5 actionable steps tailored to the goal.
- Each step MUST include only these fields:
  - "title": short, specific, and imperative.
  - "description": 2–5 sentences with clear, motivational guidance (what to do, how to do it, and a tiny success tip).
  - "due_date": an ISO 8601 date (YYYY-MM-DD). If the exact date isn’t obvious, choose a realistic plan with steps spaced ~7–14 days apart from TODAY, gradually increasing difficulty.

Style:
- Be concise, friendly, and practical.
- Make each step self-contained and measurable.

STRICT OUTPUT:
- Output ONLY a valid JSON array. No markdown, no extra text, no trailing commas.

Example format (illustrative):
[
  { "title": "Step 1: …", "description": "…", "due_date": "${todayISO}" },
  { "title": "Step 2: …", "description": "…", "due_date": "2025-09-15" }
]
`;


    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const text = completion.choices[0].message?.content ?? '[]';

      return JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse AI plan JSON:', err);
      return [];
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
  const response = await this.openai.embeddings.create({
    model: 'text-embedding-3-small', 
    input: text,
  });
  return response.data[0].embedding;
}

}
