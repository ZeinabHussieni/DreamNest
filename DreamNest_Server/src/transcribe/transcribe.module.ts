import { Module } from '@nestjs/common';
import { TranscribeService } from './transcribe.service';

@Module({
  providers: [TranscribeService],
  exports: [TranscribeService],
})
export class TranscribeModule {}
