import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  loadToken: () => Promise<void>;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userRaw = await SecureStore.getItemAsync('auth_user');
      const user: User | null = userRaw ? JSON.parse(userRaw) : null;
      set({ token, user, isAuthenticated: !!token, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
