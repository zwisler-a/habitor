import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '@habitor/shared-types';

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'habitor-api',
      timestamp: new Date().toISOString(),
    };
  }
}
