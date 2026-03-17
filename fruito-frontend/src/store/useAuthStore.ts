import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCartStore } from './useCartStore';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user });
        // Load this user's specific cart from localStorage
        useCartStore.getState().loadCart(user.id);
      },
      logout: () => {
        // Clear in-memory cart before clearing auth
        useCartStore.getState().clearCart();
        set({ token: null, user: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
