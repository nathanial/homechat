import type { Message } from './message';
import type { Room } from './room';
import type { User } from './user';

export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: string) => void;
  'room:updated': (room: Room) => void;
  'user:status': (userId: string, status: User['status']) => void;
  'user:typing': (roomId: string, userId: string, isTyping: boolean) => void;
  'error': (error: { message: string; code: string }) => void;
}

export interface ClientToServerEvents {
  'message:send': (roomId: string, content: string, type: Message['type']) => void;
  'message:update': (messageId: string, content: string) => void;
  'message:delete': (messageId: string) => void;
  'message:markRead': (messageId: string) => void;
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
  'user:typing': (roomId: string, isTyping: boolean) => void;
  'user:status': (status: User['status']) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}