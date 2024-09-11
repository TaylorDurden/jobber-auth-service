import { Application } from 'express';
import { healthRoutes } from '@auth/routes/health';
import { authRoutes } from '@auth/routes/auth';
import { verifyGatewayRequest } from '@taylordurden/jobber-shared';
import { currentUserRoutes } from '@auth/routes/current-user';
import { searchRoutes } from '@auth/routes/search';

const BASE_PATH = '/api/v1/auth';

export function appRoutes(app: Application): void {
  // http://localhost:4002/auth-health
  app.use('', healthRoutes());
  app.use(BASE_PATH, searchRoutes());
  app.use(BASE_PATH, verifyGatewayRequest, authRoutes());
  app.use(BASE_PATH, verifyGatewayRequest, currentUserRoutes());
  // app.use(BASE_PATH, (req: Request) => {
  //   console.log(req.headers);
  // });
}
