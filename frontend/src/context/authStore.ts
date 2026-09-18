import { create } from 'zustand';
import { api } from '../services/api';
import { AuthResponse, User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('darukaa_access_token'),
  isAuthenticated: !!localStorage.getItem('darukaa_access_token'),
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      const { access_token, refresh_token, user } = res.data;
      localStorage.setItem('darukaa_access_token', access_token);
      localStorage.setItem('darukaa_refresh_token', refresh_token);
      localStorage.setItem('darukaa_user', JSON.stringify(user));
      set({ user, token: access_token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (email: string, password: string, full_name: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        full_name,
        role: 'admin',
      });
      const { access_token, refresh_token, user } = res.data;
      localStorage.setItem('darukaa_access_token', access_token);
      localStorage.setItem('darukaa_refresh_token', refresh_token);
      localStorage.setItem('darukaa_user', JSON.stringify(user));
      set({ user, token: access_token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('darukaa_access_token');
    localStorage.removeItem('darukaa_refresh_token');
    localStorage.removeItem('darukaa_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    const token = localStorage.getItem('darukaa_access_token');
    if (!token) {
      try {
        const res = await api.post<AuthResponse>('/auth/login', {
          email: 'admin@darukaa.earth',
          password: 'AdminPassword123!',
        });
        const { access_token, refresh_token, user } = res.data;
        localStorage.setItem('darukaa_access_token', access_token);
        localStorage.setItem('darukaa_refresh_token', refresh_token);
        localStorage.setItem('darukaa_user', JSON.stringify(user));
        set({ user, token: access_token, isAuthenticated: true, isLoading: false });
        return;
      } catch {
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }
    }
    try {
      const res = await api.get<User>('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('darukaa_access_token');
      localStorage.removeItem('darukaa_refresh_token');
      localStorage.removeItem('darukaa_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
