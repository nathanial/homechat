import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { dbAll, dbGet, dbRun } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@homechat/shared';

export const roomsRouter: ExpressRouter = Router();

// Get user's rooms
roomsRouter.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const rooms = dbAll<{
      id: string;
      name: string;
      type: string;
      created_at: string;
      last_activity_at: string;
      unread_count: number;
    }>(`
      SELECT 
        r.id,
        r.name,
        r.type,
        r.created_at,
        r.last_activity_at,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.room_id = r.id
            AND m.created_at > COALESCE(rm.last_read_message_id, '0')
            AND m.user_id != ?
        ) as unread_count
      FROM rooms r
      JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = ?
      ORDER BY r.last_activity_at DESC
    `, [userId, userId]);
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new room
roomsRouter.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, type, memberIds } = req.body;
    
    if (!name || !type || !memberIds || !Array.isArray(memberIds)) {
      res.status(400).json({ error: 'Name, type, and memberIds are required' });
      return;
    }
    
    if (!['group', 'direct'].includes(type)) {
      res.status(400).json({ error: 'Invalid room type' });
      return;
    }
    
    // For direct messages, ensure only 2 members
    if (type === 'direct' && memberIds.length !== 1) {
      res.status(400).json({ error: 'Direct messages must have exactly 2 members' });
      return;
    }
    
    const roomId = uuidv4();
    const allMemberIds = [...new Set([userId, ...memberIds])]; // Include creator and dedupe
    
    // Create room
    dbRun(
      'INSERT INTO rooms (id, name, type) VALUES (?, ?, ?)',
      [roomId, name, type]
    );
    
    // Add members
    for (const memberId of allMemberIds) {
      dbRun(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, memberId]
      );
    }
    
    res.status(201).json({ id: roomId, name, type });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room details
roomsRouter.get('/:roomId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    
    // Check if user is member of room
    const membership = dbGet(
      'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );
    
    if (!membership) {
      res.status(403).json({ error: 'Not authorized to view this room' });
      return;
    }
    
    const room = dbGet<{
      id: string;
      name: string;
      type: string;
      created_at: string;
      last_activity_at: string;
    }>(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );
    
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    
    // Get room members
    const members = dbAll<User>(`
      SELECT u.id, u.username, u.email, u.display_name, u.avatar, u.status, u.last_seen
      FROM users u
      JOIN room_members rm ON u.id = rm.user_id
      WHERE rm.room_id = ?
    `, [roomId]);
    
    res.json({ ...room, members });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get room messages
roomsRouter.get('/:roomId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    
    // Check if user is member of room
    const membership = dbGet(
      'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );
    
    if (!membership) {
      res.status(403).json({ error: 'Not authorized to view this room' });
      return;
    }
    
    let query = `
      SELECT 
        m.id,
        m.room_id as roomId,
        m.user_id as userId,
        m.content,
        m.type,
        m.status,
        m.reply_to as replyTo,
        m.created_at as createdAt,
        m.updated_at as updatedAt,
        u.username,
        u.display_name as displayName,
        u.avatar
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
    `;
    
    const params: any[] = [roomId];
    
    if (before) {
      query += ' AND m.created_at < ?';
      params.push(before);
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(Number(limit));
    
    const messages = dbAll<any>(query, params);
    
    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});