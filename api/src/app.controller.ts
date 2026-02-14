import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@habitor/shared-types';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
