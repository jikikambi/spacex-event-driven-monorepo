import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {

  constructor() {
    client.collectDefaultMetrics();
  }

  private readonly httpCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],

    // Recommended buckets for APIs
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  });

  incHttp(method: string, route: string, status: number) {
    this.httpCounter.inc({ method, route, status });
  }

  startHttpRequestTimer() {
    return this.httpDuration.startTimer();
  }

  getMetrics() {
    return client.register.metrics();
  }

  getContentType(): string {
    return client.register.contentType;
  }
}