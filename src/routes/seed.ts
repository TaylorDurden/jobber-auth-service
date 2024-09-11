import { createAuthUsers } from '@auth/controllers/seeds';
import express, { Router } from 'express';

const router: Router = express.Router();

export function seedRoutes(): Router {
  router.post('/seed/:count', createAuthUsers);

  return router;
}
