import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/app-config.types';
import { APP_CONFIG } from '../config/app-config.types';
import { entities } from './entities';
import { InitialSchema1739535000000 } from './migrations/1739535000000-initial-schema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        type: 'sqlite',
        database: config.sqlitePath,
        entities,
        migrations: [InitialSchema1739535000000],
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
