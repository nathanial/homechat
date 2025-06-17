import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const usersRouter: ExpressRouter = Router();

usersRouter.get('/me', authenticateToken, async (_req, res) => {
  res.json({ message: 'User profile endpoint - to be implemented' });
});