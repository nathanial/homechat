import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const roomsRouter = Router();

roomsRouter.get('/', authenticateToken, async (_req, res) => {
  res.json({ message: 'Rooms list endpoint - to be implemented' });
});