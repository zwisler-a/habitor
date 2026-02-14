import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { UserContextGuard } from './user-context/user-context.guard';
import { UserContextModule } from './user-context/user-context.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, UserContextModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: UserContextGuard,
    },
  ],
})
export class AppModule {}
