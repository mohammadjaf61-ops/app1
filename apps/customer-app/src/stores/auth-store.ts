import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { apiClient } from '@/services/api-client';
import { STORAGE_KEYS } from '@/lib/constants';

interface User {
  id: string;
  phone: string;
  fullName: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = await apiClient.getToken();
      if (token) {
        const user = await apiClient.get<User>('/auth/me');
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await apiClient.setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  sendOtp: async (phone: string) => {
    await apiClient.post('/auth/send-otp', { phone });
  },

  verifyOtp: async (phone: string, otp: string) => {
    const response = await apiClient.post<{ accessToken: string; user: User }>(
      '/auth/verify-otp',
      { phone, otp }
    );
    await apiClient.setToken(response.accessToken);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: async () => {
    await apiClient.setToken(null);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (data: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = await apiClient.patch<User>('/users/me', data);
    set({ user: updatedUser });
  },
}));
