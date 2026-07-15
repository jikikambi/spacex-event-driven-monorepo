import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {

    constructor(private readonly obSvc: MetricsService) { console.log('🔥 INTERCEPTOR HIT in Constructor'); }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {        

        const req = context.switchToHttp().getRequest();        

        const method = req.method ?? 'UNKNOWN';
        const route = req.route?.path ?? req.baseUrl ?? req.url ?? 'unknown';

        console.log('🔥 INTERCEPTOR HIT: intercept', route); 

        const end = this.obSvc.startHttpRequestTimer();

        if (route.includes('/observability/metrics')) {
            return next.handle();
        }

        return next.handle().pipe(
            tap({
                next: () => {
                    const res = context.switchToHttp().getResponse();
                    this.obSvc.incHttp(method, route, res.statusCode);

                    end({ method, route, status: res.statusCode });
                },
                error: () => {
                    this.obSvc.incHttp(method, route, 500);
                    end({ method, route, status: 500 });
                },
            }),
        );
    }
}