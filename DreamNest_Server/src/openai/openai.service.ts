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
    const prompt = `
You are an expert productivity and goal-planning assistant. 
A user wants to achieve the following goal:

Title: "${goalTitle}"
Description: "${goalDescription}"

Your task:
- Break this goal into 3-5 actionable, specific, and realistic steps.
- Each step should have a short, clear title and a detailed description explaining what to do.
- Make the steps motivational and easy to follow.
- Output ONLY valid JSON, no extra text.

JSON format:
[
  {
    "title": "Step 1: ...",
    "description": "Detailed instruction for this step..."
  },
  {
    "title": "Step 2: ...",
    "description": "Detailed instruction for this step..."
  }
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
}
