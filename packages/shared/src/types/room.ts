import type { Message } from './message';
import type { User } from './user';

export interface Room {
  id: string;
  name: string;
  type: 'group' | 'direct';
  members: string[];
  createdAt: Date;
  lastMessage?: Message;
  lastActivityAt: Date;
  unreadCount?: number;
}

export interface RoomWithMembers extends Room {
  memberDetails: User[];
}

export type RoomType = Room['type'];