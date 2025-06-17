import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, User } from '@homechat/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  token: string | null; // Getter for backward compatibility
  login: (authUser: AuthUser) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      get token() {
        return get().accessToken;
      },
      login: (authUser) => {
        const { accessToken, refreshToken, ...user } = authUser;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true
        });
      },
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));
      }
    }),
    {
      name: 'homechat-auth'
    }
  )
);