import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';  
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule} from '@nestjs/config';
import { GoalsModule } from './goals/goals.module';


@Module({
  imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  AuthModule, UserModule, PrismaModule, GoalsModule

],
  controllers: [],
})
export class AppModule {}
