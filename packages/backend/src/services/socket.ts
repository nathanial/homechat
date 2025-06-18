import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@homechat/shared';
import { dbRun, dbGet, dbAll } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';
import * as documentsController from '../controllers/documents.js';

// Map to track user socket connections
const userSockets = new Map<string, Set<string>>();

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
  io.use(async (socket, next) => {
    const userId = socket.data.userId;
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    
    // Track user's socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);
    
    // Update user status to online
    dbRun('UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?', ['online', userId]);
    
    // Notify others that user is online
    socket.broadcast.emit('user:status', { userId, status: 'online' });
    
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log('User connected:', userId, socket.id);

    // Join user's rooms
    const userRooms = dbAll<{ room_id: string }>(
      'SELECT room_id FROM room_members WHERE user_id = ?',
      [userId]
    );
    
    userRooms.forEach(({ room_id }) => {
      socket.join(room_id);
    });

    // Room management
    socket.on('room:join', ({ roomId }) => {
      // Verify user is member of room
      const membership = dbGet(
        'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (membership) {
        socket.join(roomId);
        socket.emit('room:joined', { roomId });
      } else {
        socket.emit('error', { message: 'Not authorized to join this room' });
      }
    });

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(roomId);
      socket.emit('room:left', { roomId });
    });

    // Message handling
    socket.on('message:send', async ({ roomId, content, tempId, replyTo }) => {
      try {
        // Verify user is member of room
        const membership = dbGet(
          'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
          [roomId, userId]
        );
        
        if (!membership) {
          socket.emit('error', { message: 'Not authorized to send messages to this room' });
          return;
        }

        const messageId = uuidv4();
        const createdAt = new Date().toISOString();
        
        // Insert message into database
        dbRun(
          `INSERT INTO messages (id, room_id, user_id, content, type, status, reply_to, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [messageId, roomId, userId, content, 'text', 'sent', replyTo || null, createdAt]
        );
        
        // Update room's last activity
        dbRun(
          'UPDATE rooms SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?',
          [roomId]
        );
        
        const message = {
          id: messageId,
          roomId,
          userId,
          content,
          type: 'text' as const,
          createdAt: new Date(createdAt),
          status: 'sent' as const,
          replyTo
        };
        
        // Send to all room members (including sender)
        io.to(roomId).emit('message:new', message);
        
        // Send confirmation to sender with tempId mapping
        socket.emit('message:sent', { tempId, message });
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:read', ({ roomId, messageId }) => {
      try {
        // Update message status
        dbRun(
          'UPDATE messages SET status = ? WHERE id = ? AND room_id = ?',
          ['read', messageId, roomId]
        );
        
        // Update last read message for user
        dbRun(
          'UPDATE room_members SET last_read_message_id = ? WHERE room_id = ? AND user_id = ?',
          [messageId, roomId, userId]
        );
        
        // Notify message sender
        const message = dbGet<{ user_id: string }>(
          'SELECT user_id FROM messages WHERE id = ?',
          [messageId]
        );
        
        if (message) {
          // Send to all sockets of the message sender
          const senderSockets = userSockets.get(message.user_id);
          if (senderSockets) {
            senderSockets.forEach(socketId => {
              io.to(socketId).emit('message:updated', {
                id: messageId,
                roomId,
                status: 'read'
              });
            });
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ roomId }) => {
      socket.to(roomId).emit('typing:start', { roomId, userId });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:stop', { roomId, userId });
    });

    // Document handlers
    socket.on('document:list', async () => {
      try {
        const documents = await documentsController.getUserDocuments(userId);
        socket.emit('document:list', documents as any);
      } catch (error) {
        console.error('Error listing documents:', error);
        socket.emit('error', { message: 'Failed to list documents' });
      }
    });

    socket.on('document:create', async ({ title, isPublic }) => {
      try {
        const document = await documentsController.createDocument(userId, title, isPublic);
        socket.emit('document:created', document);
        
        // Notify collaborators if needed
        if (document.collaborators.length > 0) {
          document.collaborators.forEach(collaboratorId => {
            const collaboratorSockets = userSockets.get(collaboratorId);
            if (collaboratorSockets) {
              collaboratorSockets.forEach(socketId => {
                io.to(socketId).emit('document:shared', document);
              });
            }
          });
        }
      } catch (error) {
        console.error('Error creating document:', error);
        socket.emit('error', { message: 'Failed to create document' });
      }
    });

    socket.on('document:join', async ({ documentId }) => {
      try {
        const document = await documentsController.getDocument(documentId, userId);
        if (!document) {
          socket.emit('error', { message: 'Document not found or access denied' });
          return;
        }
        
        // Join document room for real-time updates
        socket.join(`document:${documentId}`);
        socket.emit('document:joined', { documentId, document });
        
        // Notify other collaborators
        socket.to(`document:${documentId}`).emit('document:collaborator:joined', {
          documentId,
          userId,
          username: socket.data.username || 'User'
        });
      } catch (error) {
        console.error('Error joining document:', error);
        socket.emit('error', { message: 'Failed to join document' });
      }
    });

    socket.on('document:leave', ({ documentId }) => {
      socket.leave(`document:${documentId}`);
      
      // Notify other collaborators
      socket.to(`document:${documentId}`).emit('document:collaborator:left', {
        documentId,
        userId
      });
    });

    socket.on('document:update', async (update) => {
      try {
        // The update from client contains documentId, update (Uint8Array), and userId
        // We don't process Y.js updates in the backend, just broadcast them
        io.to(`document:${update.documentId}`).emit('document:update', update);
      } catch (error) {
        console.error('Error broadcasting document update:', error);
        socket.emit('error', { message: 'Failed to broadcast document update' });
      }
    });

    socket.on('document:delete', async ({ documentId }) => {
      try {
        const success = await documentsController.deleteDocument(documentId, userId);
        if (!success) {
          socket.emit('error', { message: 'Failed to delete document' });
          return;
        }
        
        // Notify all collaborators about deletion
        io.to(`document:${documentId}`).emit('document:deleted', { documentId });
        
        // Remove all sockets from the document room
        const socketsInRoom = await io.in(`document:${documentId}`).fetchSockets();
        for (const socket of socketsInRoom) {
          socket.leave(`document:${documentId}`);
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        socket.emit('error', { message: 'Failed to delete document' });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('User disconnected:', userId, socket.id);
      
      // Remove socket from user's socket set
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        
        // If user has no more connections, set them offline
        if (sockets.size === 0) {
          userSockets.delete(userId);
          
          // Update user status to offline
          dbRun('UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?', ['offline', userId]);
          
          // Notify others that user is offline
          socket.broadcast.emit('user:status', { userId, status: 'offline' });
        }
      }
    });
  });
}