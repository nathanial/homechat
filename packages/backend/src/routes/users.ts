import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { dbGet, dbAll } from '../database/init.js';
import type { User } from '@homechat/shared';

export const usersRouter: ExpressRouter = Router();

// Get current user profile
usersRouter.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const user = dbGet<User>(
      'SELECT id, username, email, display_name, avatar, status, last_seen FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users
usersRouter.get('/', authenticateToken, async (_req: AuthRequest, res) => {
  try {
    const users = dbAll<User>(`
      SELECT id, username, email, display_name, avatar, status, last_seen
      FROM users
      ORDER BY display_name ASC
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Search users
usersRouter.get('/search', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    
    const users = dbAll<User>(`
      SELECT id, username, email, display_name, avatar, status, last_seen
      FROM users
      WHERE username LIKE ? OR display_name LIKE ? OR email LIKE ?
      LIMIT 10
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});