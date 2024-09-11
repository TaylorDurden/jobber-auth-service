import { gigs, singleGigById } from '@auth/controllers/search';
import express, { Router } from 'express';

const router: Router = express.Router();

export function searchRoutes(): Router {
  router.get('/search/gigs/search', gigs);
  router.get('/search/gigs/:gigId', singleGigById);

  return router;
}
