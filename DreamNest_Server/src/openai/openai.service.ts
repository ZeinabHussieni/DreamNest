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

  async generateEmbedding(text: string): Promise<number[]> {
  const response = await this.openai.embeddings.create({
    model: 'text-embedding-3-small', 
    input: text,
  });
  return response.data[0].embedding;
}

}
