import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { LoginInput, RegisterInput, AuthUser } from '@homechat/shared';
import { dbRun, dbGet } from '../database/init.js';

const uuidv4 = () => crypto.randomUUID();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export async function register(data: RegisterInput): Promise<AuthUser> {
  // Check if user already exists
  const existingUser = await dbGet<{ id: string }>(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [data.username, data.email]
  );

  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const userId = uuidv4();
  await dbRun(
    `INSERT INTO users (id, username, email, password_hash, display_name) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, data.username, data.email, passwordHash, data.displayName]
  );

  // Generate tokens
  const accessToken = generateAccessToken(userId, data.username);
  const refreshToken = await generateRefreshToken(userId);

  // Create family room if it doesn't exist
  const familyRoom = await dbGet<{ id: string }>('SELECT id FROM rooms WHERE type = ?', ['group']);
  if (!familyRoom) {
    const roomId = uuidv4();
    await dbRun(
      'INSERT INTO rooms (id, name, type) VALUES (?, ?, ?)',
      [roomId, 'Family Chat', 'group']
    );
    await dbRun(
      'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
      [roomId, userId]
    );
  } else {
    await dbRun(
      'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
      [familyRoom.id, userId]
    );
  }

  return {
    id: userId,
    username: data.username,
    email: data.email,
    displayName: data.displayName,
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date(),
    accessToken,
    refreshToken
  };
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar: string | null;
  status: string;
  last_seen: string;
  created_at: string;
}

export async function login(data: LoginInput): Promise<AuthUser> {
  const user = await dbGet<UserRecord>(
    `SELECT id, username, email, password_hash, display_name, avatar, status, last_seen, created_at 
     FROM users WHERE username = ?`,
    [data.username]
  );

  if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
    throw new Error('Invalid username or password');
  }

  // Update user status
  await dbRun(
    'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
    ['online', user.id]
  );

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.username);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatar: user.avatar || undefined,
    status: 'online',
    lastSeen: new Date(user.last_seen),
    createdAt: new Date(user.created_at),
    accessToken,
    refreshToken
  };
}

export async function refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenData = await dbGet<{ user_id: string; expires_at: string }>(
    'SELECT user_id, expires_at FROM refresh_tokens WHERE token = ?',
    [token]
  );

  if (!tokenData || new Date(tokenData.expires_at) < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await dbGet<{ id: string; username: string }>(
    'SELECT id, username FROM users WHERE id = ?',
    [tokenData.user_id]
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Delete old refresh token
  await dbRun('DELETE FROM refresh_tokens WHERE token = ?', [token]);

  // Generate new tokens
  const accessToken = generateAccessToken(user.id, user.username);
  const newRefreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(_token: string): Promise<void> {
  // In a production app, you might want to blacklist the access token
  // For now, we'll just rely on the short expiration time
}

function generateAccessToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES);

  await dbRun(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
    [token, userId, expiresAt.toISOString()]
  );

  return token;
}