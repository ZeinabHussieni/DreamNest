import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';//run code when app starts or stops
import { PrismaClient } from '@prisma/client'; //to interact with db

@Injectable()//allow us to inject it in other services
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  //db connecting
  async onModuleInit() {
    await this.$connect();
  }

  //closes app before the process exit to prevent crashes 
  async enableShutdownHooks(app: INestApplication) {
    (this.$on as any)('beforeExit', async () => {
     await app.close();
    });  
  }

  //run when module is destroyed to discconect db
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
