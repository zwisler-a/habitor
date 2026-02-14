export interface AppIdentity {
  name: string;
  version: string;
}

export interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
}
