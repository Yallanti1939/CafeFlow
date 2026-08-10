import apiClient from './apiClient';

export interface SelectedCustomizationOption {
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  id?: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  basePrice: number;
  customizationPrice: number;
  finalPrice: number;
  selectedCustomizations: SelectedCustomizationOption[];
}

export interface Cart {
  id: number;
  customerId: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  finalAmount: number;
}

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get<Cart>('/api/cart');
    return response.data;
  },

  addCartItem: async (item: Omit<CartItem, 'id' | 'finalPrice'>): Promise<Cart> => {
    const response = await apiClient.post<Cart>('/api/cart/items', item);
    return response.data;
  },

  updateQuantity: async (cartItemId: number, quantity: number): Promise<Cart> => {
    const response = await apiClient.put<Cart>(`/api/cart/items/${cartItemId}`, { quantity });
    return response.data;
  },

  deleteItem: async (cartItemId: number): Promise<Cart> => {
    const response = await apiClient.delete<Cart>(`/api/cart/items/${cartItemId}`);
    return response.data;
  },

  mergeCart: async (guestItems: Omit<CartItem, 'id' | 'finalPrice'>[]): Promise<Cart> => {
    const response = await apiClient.post<Cart>('/api/cart/merge', guestItems);
    return response.data;
  }
};
