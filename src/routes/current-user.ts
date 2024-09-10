import { getCurrentUser, resendEmail } from '@auth/controllers/current-user';
import { token } from '@auth/controllers/refresh-token';
import express, { Router } from 'express';

const router: Router = express.Router();

export function currentUserRoutes(): Router {
  router.get('/refresh-token/:username', token);
  router.get('/currentuser', getCurrentUser);
  router.post('/resend-email', resendEmail);

  return router;
}
