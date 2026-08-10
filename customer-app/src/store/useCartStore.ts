import { create } from 'zustand';
import { cartService, Cart, CartItem, SelectedCustomizationOption } from '../services/cartService';
import { authService } from '../services/authService';

interface CartState {
  cart: Cart | null;
  guestItems: CartItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (item: Omit<CartItem, 'id' | 'finalPrice'>) => Promise<void>;
  updateQuantity: (productId: number, customizations: SelectedCustomizationOption[], quantity: number, cartItemId?: number) => Promise<void>;
  removeItem: (productId: number, customizations: SelectedCustomizationOption[], cartItemId?: number) => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  clearCart: () => void;
  
  // Helpers
  getCartSubtotal: () => number;
  getCartTax: () => number;
  getCartFinalAmount: () => number;
  getCartItemCount: () => number;
}

const normalizeCustoms = (customs: SelectedCustomizationOption[]) => {
  return customs
    .map(c => `${c.groupName}:${c.optionName}:${c.price}`)
    .sort()
    .join('|');
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  guestItems: (() => {
    const local = localStorage.getItem('guest_cart');
    return local ? JSON.parse(local) : [];
  })(),
  isLoading: false,
  error: null,

  fetchCart: async () => {
    if (!authService.isAuthenticated()) return;
    set({ isLoading: true, error: null });
    try {
      const dbCart = await cartService.getCart();
      set({ cart: dbCart, isLoading: false });
    } catch (e: any) {
      set({ error: e.response?.data || 'Failed to fetch cart', isLoading: false });
    }
  },

  addItem: async (item) => {
    set({ isLoading: true, error: null });
    if (authService.isAuthenticated()) {
      try {
        const dbCart = await cartService.addCartItem(item);
        set({ cart: dbCart, isLoading: false });
      } catch (e: any) {
        set({ error: e.response?.data || 'Failed to add item', isLoading: false });
      }
    } else {
      // Guest local storage addition
      const items = [...get().guestItems];
      const normNew = normalizeCustoms(item.selectedCustomizations);
      
      const existing = items.find(
        i => i.productId === item.productId && normalizeCustoms(i.selectedCustomizations) === normNew
      );

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        items.push({
          ...item,
          finalPrice: (item.basePrice + item.customizationPrice) * item.quantity
        });
      }

      localStorage.setItem('guest_cart', JSON.stringify(items));
      set({ guestItems: items, isLoading: false });
    }
  },

  updateQuantity: async (productId, customizations, quantity, cartItemId) => {
    set({ isLoading: true, error: null });
    if (authService.isAuthenticated() && cartItemId) {
      try {
        const dbCart = await cartService.updateQuantity(cartItemId, quantity);
        set({ cart: dbCart, isLoading: false });
      } catch (e: any) {
        set({ error: e.response?.data || 'Failed to update quantity', isLoading: false });
      }
    } else {
      // Guest update
      let items = [...get().guestItems];
      const normCustoms = normalizeCustoms(customizations);
      const target = items.find(
        i => i.productId === productId && normalizeCustoms(i.selectedCustomizations) === normCustoms
      );

      if (target) {
        if (quantity <= 0) {
          items = items.filter(i => !(i.productId === productId && normalizeCustoms(i.selectedCustomizations) === normCustoms));
        } else {
          target.quantity = quantity;
          target.finalPrice = (target.basePrice + target.customizationPrice) * quantity;
        }
      }

      localStorage.setItem('guest_cart', JSON.stringify(items));
      set({ guestItems: items, isLoading: false });
    }
  },

  removeItem: async (productId, customizations, cartItemId) => {
    await get().updateQuantity(productId, customizations, 0, cartItemId);
  },

  mergeGuestCart: async () => {
    if (!authService.isAuthenticated()) return;
    
    let items = get().guestItems;
    if (items.length === 0) {
      const local = localStorage.getItem('guest_cart');
      if (local) {
        try {
          items = JSON.parse(local);
        } catch (e) {
          items = [];
        }
      }
    }

    if (items.length === 0) {
      await get().fetchCart();
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const merged = await cartService.mergeCart(items);
      localStorage.removeItem('guest_cart');
      set({ cart: merged, guestItems: [], isLoading: false });
    } catch (e: any) {
      console.error('Failed to merge guest cart', e);
      set({ error: 'Failed to merge guest cart', isLoading: false });
      await get().fetchCart();
    }
  },

  clearCart: () => {
    localStorage.removeItem('guest_cart');
    set({ cart: null, guestItems: [] });
  },

  getCartSubtotal: () => {
    const state = get();
    if (authService.isAuthenticated() && state.cart && state.cart.items && state.cart.items.length > 0) {
      return state.cart.subtotal;
    }
    if (state.guestItems && state.guestItems.length > 0) {
      return state.guestItems.reduce((acc, item) => acc + (item.basePrice + item.customizationPrice) * item.quantity, 0);
    }
    if (authService.isAuthenticated() && state.cart) {
      return state.cart.subtotal;
    }
    return 0;
  },

  getCartTax: () => {
    return Math.round(get().getCartSubtotal() * 0.05 * 100) / 100; // 5% GST
  },

  getCartFinalAmount: () => {
    return Math.round((get().getCartSubtotal() + get().getCartTax()) * 100) / 100;
  },

  getCartItemCount: () => {
    const state = get();
    if (authService.isAuthenticated() && state.cart && state.cart.items && state.cart.items.length > 0) {
      return state.cart.items.reduce((acc, item) => acc + item.quantity, 0);
    }
    if (state.guestItems && state.guestItems.length > 0) {
      return state.guestItems.reduce((acc, item) => acc + item.quantity, 0);
    }
    if (authService.isAuthenticated() && state.cart && state.cart.items) {
      return state.cart.items.reduce((acc, item) => acc + item.quantity, 0);
    }
    return 0;
  }
}));
