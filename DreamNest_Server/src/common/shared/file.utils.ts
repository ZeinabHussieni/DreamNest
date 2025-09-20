import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';

export function saveBase64Image(base64String: string, folderPath: string): string {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new BadRequestException('Invalid base64 image');
  }

  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
  }

  const ext = matches[1].split('/')[1];
  const data = matches[2];
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filePath = join(folderPath, filename);

  writeFileSync(filePath, Buffer.from(data, 'base64'), { mode: 0o600 });
  console.log('Saved profile picture to:', filePath);
  return filename;
}
