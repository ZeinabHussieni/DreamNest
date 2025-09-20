import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],//define inside
  exports: [PrismaService],//share outside
})
export class PrismaModule {}