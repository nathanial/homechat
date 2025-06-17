import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.get('/me', authenticateToken, async (_req, res) => {
  res.json({ message: 'User profile endpoint - to be implemented' });
});