export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  createdAt: Date;
}

export type UserStatus = User['status'];

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}