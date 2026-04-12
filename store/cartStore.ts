import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  userId: string | null;
  userCarts: Record<string, CartItem[]>; // her kullanıcının sepeti
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  /** Session değişince çağır */
  syncUser: (id: string | null) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      userId: null,
      userCarts: {},

      syncUser: (id) => {
        const { userId, items, userCarts } = get();
        if (id === userId) return; // değişiklik yok

        // Mevcut kullanıcının sepetini kaydet
        const updatedCarts = userId
          ? { ...userCarts, [userId]: items }
          : userCarts;

        if (id === null) {
          // Çıkış yapıldı → sepeti temizle
          set({ items: [], userId: null, isOpen: false, userCarts: updatedCarts });
        } else {
          // Giriş yapıldı → bu kullanıcının önceki sepetini yükle
          set({
            items: updatedCarts[id] ?? [],
            userId: id,
            isOpen: false,
            userCarts: updatedCarts,
          });
        }
      },

      addItem: (item) => {
        const { items, userId, userCarts } = get();
        const existing = items.find((i) => i.id === item.id);
        const newItems = existing
          ? items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...items, { ...item, quantity: 1 }];
        set({
          items: newItems,
          isOpen: true,
          userCarts: userId ? { ...userCarts, [userId]: newItems } : userCarts,
        });
      },

      removeItem: (id) => {
        const { items, userId, userCarts } = get();
        const newItems = items.filter((i) => i.id !== id);
        set({
          items: newItems,
          userCarts: userId ? { ...userCarts, [userId]: newItems } : userCarts,
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const { items, userId, userCarts } = get();
        const newItems = items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        );
        set({
          items: newItems,
          userCarts: userId ? { ...userCarts, [userId]: newItems } : userCarts,
        });
      },

      clearCart: () => {
        const { userId, userCarts } = get();
        set({
          items: [],
          userCarts: userId ? { ...userCarts, [userId]: [] } : userCarts,
        });
      },

      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "dynexa-cart" }
  )
);
