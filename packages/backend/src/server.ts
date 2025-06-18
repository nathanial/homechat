import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@homechat/shared';

import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { roomsRouter } from './routes/rooms.js';
import { messagesRouter } from './routes/messages.js';
import documentsRouter from './routes/documents.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketHandlers } from './services/socket.js';
import { setupYjsServer } from './services/yjs-server.js';
import { dbGet } from './database/init.js';

export async function createServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true
    }
  });

  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: string;
        username: string;
      };

      const user = await dbGet<{ id: string; username: string }>(
        'SELECT id, username FROM users WHERE id = ?',
        [payload.userId]
      );

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = user.id;
      socket.data.username = user.username;

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }));
  app.use(express.json());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api', limiter);

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/rooms', roomsRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/documents', documentsRouter);

  // Health check
  app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use(errorHandler);

  // Socket.io handlers
  setupSocketHandlers(io);

  // Y.js WebSocket server for collaborative editing
  setupYjsServer();

  return httpServer;
}