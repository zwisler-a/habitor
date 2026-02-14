import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@habitor/shared-types';
import { AppService } from './app.service';
import { SkipUserContext } from './user-context/skip-user-context.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipUserContext()
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
