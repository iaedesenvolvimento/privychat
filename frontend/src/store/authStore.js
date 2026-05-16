import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      booted: false,
      remember: true,
      setAccessToken: (accessToken) => set({ accessToken }),
      bootstrap: async () => {
        if (!get().accessToken) {
          set({ user: null, booted: true });
          return;
        }
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user });
        } catch {
          set({ user: null, accessToken: null });
        } finally {
          set({ booted: true });
        }
      },
      login: async (payload) => {
        const { data } = await api.post('/auth/login', payload);
        set({ user: data.user, accessToken: data.accessToken, remember: payload.remember });
        return data.user;
      },
      googleLogin: async (credential) => {
        const { data } = await api.post('/auth/google-login', { credential });
        set({ user: data.user, accessToken: data.accessToken });
      },
      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        set({ user: data.user, accessToken: data.accessToken });
      },
      updateUser: (user) => set({ user }),
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          get().logoutLocal();
        }
      },
      logoutLocal: () => {
        disconnectSocket();
        set({ user: null, accessToken: null });
      }
    }),
    {
      name: 'privychat.auth',
      partialize: (state) => ({
        accessToken: state.remember ? state.accessToken : null,
        remember: state.remember
      })
    }
  )
);
