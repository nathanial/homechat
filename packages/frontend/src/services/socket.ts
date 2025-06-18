import { io, Socket } from 'socket.io-client';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents,
  Message,
  User
} from '@homechat/shared';
import type { TypingEvent } from '@homechat/shared/types/socket';
import { useAuthStore } from '../stores/authStore';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private typingHandlers: ((event: TypingEvent) => void)[] = [];
  private statusHandlers: ((userId: string, status: User['status']) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  connect() {
    const token = useAuthStore.getState().accessToken;
    if (!token || this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL || '', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connectionHandlers.forEach(handler => handler(true));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connectionHandlers.forEach(handler => handler(false));
    });

    this.socket.on('message:new', (message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('message:updated', (update) => {
      // For now, we don't have a full message update handler
      console.log('Message updated:', update);
    });

    this.socket.on('message:sent', ({ message }) => {
      // Handle message confirmation - replace temp message with real one
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('typing:start', (event) => {
      const typingEvent: TypingEvent = { ...event, isTyping: true };
      this.typingHandlers.forEach(handler => handler(typingEvent));
    });

    this.socket.on('typing:stop', (event) => {
      const typingEvent: TypingEvent = { ...event, isTyping: false };
      this.typingHandlers.forEach(handler => handler(typingEvent));
    });

    this.socket.on('user:status', ({ userId, status }) => {
      this.statusHandlers.forEach(handler => handler(userId, status));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Room management
  joinRoom(roomId: string) {
    this.socket?.emit('room:join', { roomId });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('room:leave', { roomId });
  }

  // Message operations
  sendMessage(roomId: string, content: string, replyTo?: string) {
    const tempId = `temp-${Date.now()}`;
    this.socket?.emit('message:send', {
      roomId,
      content,
      tempId,
      replyTo
    });
    return tempId;
  }

  markAsRead(roomId: string, messageId: string) {
    this.socket?.emit('message:read', { roomId, messageId });
  }

  // Typing indicators
  startTyping(roomId: string) {
    this.socket?.emit('typing:start', { roomId });
  }

  stopTyping(roomId: string) {
    this.socket?.emit('typing:stop', { roomId });
  }

  // Document operations
  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ): void {
    (this.socket as any)?.emit(event, ...args);
  }

  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ): void {
    (this.socket as any)?.on(event, handler);
  }

  off<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ): void {
    (this.socket as any)?.off(event, handler);
  }

  // Event handlers
  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: (event: TypingEvent) => void) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onUserStatus(handler: (userId: string, status: User['status']) => void) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  onConnectionChange(handler: (connected: boolean) => void) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();