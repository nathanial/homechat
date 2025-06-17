import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbGet } from '../database/init.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
      username: string;
    };

    const user = await dbGet<{ id: string; username: string }>(
      'SELECT id, username FROM users WHERE id = ?',
      [payload.userId]
    );

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username
    };

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
}