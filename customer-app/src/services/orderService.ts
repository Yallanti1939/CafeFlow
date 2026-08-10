import apiClient from './apiClient';
import { SelectedCustomizationOption } from './cartService';

export interface OrderItemCustomization {
  id: number;
  customizationGroupName: string;
  customizationOptionName: string;
  additionalPrice: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  unitBasePrice: number;
  customizationTotal: number;
  unitFinalPrice: number;
  totalPrice: number;
  customizations: OrderItemCustomization[];
}

export interface Order {
  id: number;
  orderIdFormatted: string;
  customerId: number;
  customerMobile: string;
  subtotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: 'UPI' | 'CARD' | 'COUNTER_PAY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  status: string;
  changedByType: string;
  notes: string;
  createdAt: string;
}

export const orderService = {
  placeOrder: async (paymentMethod: string, discount: number = 0, idempotencyKey: string): Promise<Order> => {
    const response = await apiClient.post<Order>(
      '/api/orders',
      { paymentMethod, discount },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data;
  },

  getCustomerOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/api/customer/orders');
    return response.data;
  },

  getCustomerOrderDetails: async (orderIdFormatted: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/api/customer/orders/${orderIdFormatted}`);
    return response.data;
  },

  trackOrderPublicly: async (orderId: string, mobileNumber: string): Promise<Order> => {
    const response = await apiClient.post<Order>('/api/orders/track', {
      orderId,
      mobileNumber,
    });
    return response.data;
  },

  getOrderStatusHistory: async (orderIdFormatted: string): Promise<OrderStatusHistory[]> => {
    const response = await apiClient.get<OrderStatusHistory[]>(`/api/orders/${orderIdFormatted}/history`);
    return response.data;
  }
};
