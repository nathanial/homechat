import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const messagesRouter = Router();

messagesRouter.post('/', authenticateToken, async (_req, res) => {
  res.json({ message: 'Send message endpoint - to be implemented' });
});