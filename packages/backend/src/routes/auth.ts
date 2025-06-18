import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { loginSchema, registerSchema, refreshTokenSchema } from '@homechat/shared';
import { register, login, refreshToken, logout } from '../controllers/auth.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

export const authRouter: ExpressRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await register(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const data = refreshTokenSchema.parse(req.body);
    const result = await refreshToken(data.refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      await logout(token);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Validate token endpoint
authRouter.get('/validate', authenticateToken, async (_req: AuthRequest, res) => {
  // If we reach here, the token is valid (authenticateToken middleware passed)
  res.json({ valid: true });
});