import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import axios from 'axios';

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

const completion = await this.openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [{ role: 'user', content: prompt }],

});

const text = completion.choices[0].message?.content ?? '[]';

try {
  return JSON.parse(text);
} catch (err) {
  console.error('Failed to parse AI plan JSON:', text);
  return [];
}
}
async generateVisionBoardImages(goalTitle: string, goalDescription: string): Promise<string> {
  const prompt = `
  You are an expert designer and motivational assistant. 
  Create a single, high-quality, visually appealing vision board image for this goal:

  Goal: "${goalTitle}"
  Description: "${goalDescription}"

  Requirements:
  - The image should be a single cohesive collage representing the goal.
  - Include 3-4 small "moments" or "scenes" inside the collage that illustrate key aspects or steps of this goal.
  - Make it inspirational, clear, and aesthetically pleasing.
  - Use vibrant but professional colors, and ensure the text (if any) is minimal and readable.
  - Style: modern, clean, and motivating.

  Return only the image, no extra text.
  `;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict',
      {
        instances: [{ prompt }],
        parameters: { sampleCount: 1 }, 
      },
      {
        headers: {
          'Authorization': `Bearer ${this.configService.get<string>('GEMINI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.predictions[0].imageUri;
  } catch (err) {
    console.error('Failed to generate image:', err);
    return '';
  }
}
}