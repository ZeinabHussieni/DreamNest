import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import OpenAI from 'openai';

@Injectable()
export class TranscribeService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY missing for TranscribeService');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async transcribeWebm(tempPath: string): Promise<{ text: string }> {
    if (!fs.existsSync(tempPath)) {
      throw new BadRequestException('Audio file not found');
    }

    const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';

    try {
      const file = fs.createReadStream(tempPath);
      const result = await this.client.audio.transcriptions.create({
        file,
        model,
      });

      const text = (result as any).text?.trim?.() || '';
      if (!text) throw new BadRequestException('Empty transcription');
      return { text };
    } catch (e) {
      throw new BadRequestException('Transcription failed');
    }
  }
}
