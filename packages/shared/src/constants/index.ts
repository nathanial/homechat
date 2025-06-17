export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_MARK_READ: 'message:markRead',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE: 'room:updated',
  USER_TYPING: 'user:typing',
  USER_STATUS: 'user:status'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout'
  },
  USERS: {
    ME: '/api/users/me',
    UPDATE: '/api/users/me',
    AVATAR: '/api/users/me/avatar'
  },
  ROOMS: {
    LIST: '/api/rooms',
    CREATE: '/api/rooms',
    GET: (id: string) => `/api/rooms/${id}`,
    MESSAGES: (id: string) => `/api/rooms/${id}/messages`,
    MEMBERS: (id: string) => `/api/rooms/${id}/members`
  },
  MESSAGES: {
    SEND: '/api/messages',
    UPDATE: (id: string) => `/api/messages/${id}`,
    DELETE: (id: string) => `/api/messages/${id}`
  }
} as const;

export const TOKEN_EXPIRES_IN = {
  ACCESS: '15m',
  REFRESH: '7d'
} as const;

export const MESSAGE_LIMITS = {
  MAX_LENGTH: 5000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
} as const;