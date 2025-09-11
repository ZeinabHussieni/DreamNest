import { Injectable } from '@nestjs/common';
import * as fs from 'fs';//is node.js file system module lets us read write move delete files check existence
import * as fsp from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  async moveTempToVoices(tempPath: string, filename?: string): Promise<{ filePath: string; url: string }> {
    if (!fs.existsSync(tempPath)) {
      throw new Error('Temp file missing');
    }

    const dir ='storage/private/voice';
    await fsp.mkdir(dir, { recursive: true });

    const base = filename || `voice-${Date.now()}-${randomUUID()}.webm`;
    const finalPath = path.join(dir, base);

    await fsp.rename(tempPath, finalPath);

    const url = `/static/voice/${base}`;
    return { filePath: finalPath, url };
  }
}
