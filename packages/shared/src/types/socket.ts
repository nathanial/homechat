import type { Message } from './message';
import type { Room } from './room';
import type { User } from './user';
import type { Document, DocumentUpdate, DocumentAwareness, DocumentListItem } from './document';

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
  'document:update': (update: DocumentUpdate) => void;
  'document:awareness': (awareness: DocumentAwareness) => void;
  'document:joined': (data: { documentId: string; document: Document }) => void;
  'document:left': (data: { documentId: string }) => void;
  'document:list': (documents: DocumentListItem[]) => void;
  'document:created': (document: Document) => void;
  'document:shared': (document: Document) => void;
  'document:deleted': (data: { documentId: string }) => void;
  'document:collaborator:joined': (data: { documentId: string; userId: string; username: string }) => void;
  'document:collaborator:left': (data: { documentId: string; userId: string }) => void;
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
  'document:join': (data: { documentId: string }) => void;
  'document:leave': (data: { documentId: string }) => void;
  'document:update': (update: DocumentUpdate) => void;
  'document:awareness': (awareness: DocumentAwareness) => void;
  'document:create': (data: { title: string; isPublic: boolean }) => void;
  'document:delete': (data: { documentId: string }) => void;
  'document:list': () => void;
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