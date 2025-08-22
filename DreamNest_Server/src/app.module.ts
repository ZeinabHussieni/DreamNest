import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule} from '@nestjs/config';
import { GoalsModule } from './goals/goals.module';
import { PlanModule } from './plan/plan.module';
import { PostModule } from './post/post.module';


@Module({
  imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  AuthModule, UserModule, PrismaModule, GoalsModule,PlanModule, PostModule

],
  controllers: [],
})
export class AppModule {}
