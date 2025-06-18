import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { dbGet, dbAll } from '../database/init.js';

export const usersRouter: ExpressRouter = Router();

// Get current user profile
usersRouter.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const rawUser = await dbGet<any>(
      'SELECT id, username, email, display_name, avatar, status, last_seen FROM users WHERE id = ?',
      [userId]
    );
    
    if (!rawUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Convert snake_case to camelCase for frontend compatibility
    const user = {
      id: rawUser.id,
      username: rawUser.username,
      email: rawUser.email,
      displayName: rawUser.display_name,
      avatar: rawUser.avatar,
      status: rawUser.status,
      lastSeen: rawUser.last_seen,
      createdAt: rawUser.created_at
    };
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users
usersRouter.get('/', authenticateToken, async (_req: AuthRequest, res) => {
  try {
    const rawUsers = await dbAll<any>(`
      SELECT id, username, email, display_name, avatar, status, last_seen
      FROM users
      ORDER BY display_name ASC
    `);
    
    // Convert snake_case to camelCase for frontend compatibility
    const users = rawUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar,
      status: user.status,
      lastSeen: user.last_seen,
      createdAt: user.created_at
    }));
    
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
    
    const rawUsers = await dbAll<any>(`
      SELECT id, username, email, display_name, avatar, status, last_seen
      FROM users
      WHERE username LIKE ? OR display_name LIKE ? OR email LIKE ?
      LIMIT 10
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    
    // Convert snake_case to camelCase for frontend compatibility
    const users = rawUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar,
      status: user.status,
      lastSeen: user.last_seen,
      createdAt: user.created_at
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});