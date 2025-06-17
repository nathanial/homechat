import type { Message } from './message';
import type { Room } from './room';
import type { User } from './user';

export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'message:updated': (update: { id: string; roomId: string; status: Message['status'] }) => void;
  'message:deleted': (messageId: string) => void;
  'message:sent': (data: { tempId: string; message: Message }) => void;
  'room:joined': (data: { roomId: string }) => void;
  'room:left': (data: { roomId: string }) => void;
  'room:updated': (room: Room) => void;
  'user:status': (data: { userId: string; status: User['status'] }) => void;
  'typing:start': (data: { roomId: string; userId: string }) => void;
  'typing:stop': (data: { roomId: string; userId: string }) => void;
  'error': (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  'message:send': (data: { roomId: string; content: string; tempId: string; replyTo?: string }) => void;
  'message:update': (data: { messageId: string; content: string }) => void;
  'message:delete': (data: { messageId: string }) => void;
  'message:read': (data: { roomId: string; messageId: string }) => void;
  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'typing:start': (data: { roomId: string }) => void;
  'typing:stop': (data: { roomId: string }) => void;
  'user:status': (data: { status: User['status'] }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  isTyping: boolean;
}