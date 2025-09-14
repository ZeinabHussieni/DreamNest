import { Injectable } from '@nestjs/common';
import * as fs from 'fs';//is node.js file system module lets us read write move delete files check existence
import * as fsp from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  async moveTempToVoicesPublic(tempPath: string, filename?: string) {
    if (!fs.existsSync(tempPath)) throw new Error('Temp file missing');
    const dir = 'storage/private/voice';
    await fsp.mkdir(dir, { recursive: true });
    const base = filename || `voice-${Date.now()}-${randomUUID()}.webm`;
    const finalPath = path.join(dir, base);
    await fsp.rename(tempPath, finalPath);
    const url = `/static/voice/${base}`;
    return { filePath: finalPath, url };
  }

  async moveTempToVoicesQuarantine(tempPath: string, filename?: string) {
    if (!fs.existsSync(tempPath)) throw new Error('Temp file missing');
    const dir = 'storage/quarantine/voice';
    await fsp.mkdir(dir, { recursive: true });
    const base = filename || `qvoice-${Date.now()}-${randomUUID()}.webm`;
    const finalPath = path.join(dir, base);
    await fsp.rename(tempPath, finalPath);
    return { filePath: finalPath };
  }
  async moveTempToImagesPublic(tempPath: string, filename?: string) {
    if (!fs.existsSync(tempPath)) throw new Error('Temp file missing');
    const dir = 'storage/private/image';
    await fsp.mkdir(dir, { recursive: true });
    const base = filename || `img-${Date.now()}-${randomUUID()}.jpg`;
    const finalPath = path.join(dir, base);
    await fsp.rename(tempPath, finalPath);
    const url = `/static/img/${base}`;
    return { filePath: finalPath, url };
  }

  async moveTempToImagesQuarantine(tempPath: string, filename?: string) {
    if (!fs.existsSync(tempPath)) throw new Error('Temp file missing');
    const dir = 'storage/quarantine/image';
    await fsp.mkdir(dir, { recursive: true });
    const base = filename || `qimg-${Date.now()}-${randomUUID()}.bin`;
    const finalPath = path.join(dir, base);
    await fsp.rename(tempPath, finalPath);
    return { filePath: finalPath };
  }
}