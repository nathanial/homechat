import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const messagesRouter: ExpressRouter = Router();

messagesRouter.post('/', authenticateToken, async (_req, res) => {
  res.json({ message: 'Send message endpoint - to be implemented' });
});