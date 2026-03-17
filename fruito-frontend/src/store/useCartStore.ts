import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartState {
  items: CartItem[];
  currentUserId: number | null;
  // Actions
  loadCart: (userId: number) => void;
  clearCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  total: () => number;
}

/** Returns the localStorage key for a given user's cart */
const cartKey = (userId: number) => `cart-storage-${userId}`;

/** Persist current items to localStorage under the user-scoped key */
const persistCart = (userId: number | null, items: CartItem[]) => {
  if (!userId) return;
  try {
    localStorage.setItem(cartKey(userId), JSON.stringify(items));
  } catch (_) {}
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  currentUserId: null,

  /** Call this after login to load the correct user's cart */
  loadCart: (userId: number) => {
    let items: CartItem[] = [];
    try {
      const raw = localStorage.getItem(cartKey(userId));
      if (raw) items = JSON.parse(raw) as CartItem[];
    } catch (_) {}
    set({ items, currentUserId: userId });
  },

  /** Call this on logout — clears in-memory cart but keeps localStorage for next login */
  clearCart: () => {
    set({ items: [], currentUserId: null });
  },

  addItem: (item) => {
    const { items, currentUserId } = get();
    const existing = items.find((i) => i.id === item.id);
    let newItems: CartItem[];
    if (existing) {
      newItems = items.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      newItems = [...items, item];
    }
    persistCart(currentUserId, newItems);
    set({ items: newItems });
  },

  removeItem: (id) => {
    const { items, currentUserId } = get();
    const newItems = items.filter((i) => i.id !== id);
    persistCart(currentUserId, newItems);
    set({ items: newItems });
  },

  updateQuantity: (id, quantity) => {
    const { items, currentUserId } = get();
    const newItems = items.map((i) =>
      i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
    );
    persistCart(currentUserId, newItems);
    set({ items: newItems });
  },

  total: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
