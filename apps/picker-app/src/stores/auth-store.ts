import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { apiClient } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/constants';

interface User {
  id: string;
  phone: string;
  fullName: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  refreshToken: null,

  initialize: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
      ]);

      if (accessToken && userJson) {
        const user = JSON.parse(userJson);

        // Check if user is a PICKER
        if (user.role !== 'PICKER') {
          // Logout non-picker users
          await get().logout();
          return;
        }

        apiClient.setToken(accessToken);

        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          user,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },

  login: async (accessToken, refreshToken, user) => {
    // Verify user is a PICKER
    if (user.role !== 'PICKER') {
      throw new Error('هذا التطبيق مخصص لموظفي التجهيز فقط');
    }

    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
    ]);

    apiClient.setToken(accessToken);

    set({
      isAuthenticated: true,
      accessToken,
      refreshToken,
      user,
    });
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
    ]);

    apiClient.setToken(null);

    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  },

  updateUser: (user) => {
    set({ user });
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  },
}));
