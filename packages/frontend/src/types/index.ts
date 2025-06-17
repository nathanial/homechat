import type { Room as BaseRoom } from '@homechat/shared';

export interface Room extends BaseRoom {
  unreadCount?: number;
}