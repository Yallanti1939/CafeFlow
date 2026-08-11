import apiClient from './apiClient';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitFinalPrice: number;
  totalPrice: number;
  customizations: Array<{
    customizationGroupName: string;
    customizationOptionName: string;
    additionalPrice: number;
  }>;
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
}

export interface PaymentAttempt {
  id: number;
  orderId: number;
  orderIdFormatted: string;
  customerMobile?: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  provider: string;
  providerPaymentId: string;
  transactionReference: string;
  verifiedAt: string;
  createdAt: string;
}

export const orderService = {
  getAllOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/api/admin/orders');
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: string, notes: string = ''): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/api/admin/orders/${orderId}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  cancelOrder: async (orderId: number, notes: string = ''): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/api/admin/orders/${orderId}/cancel`, {
      notes,
    });
    return response.data;
  },

  getAllPayments: async (): Promise<PaymentAttempt[]> => {
    const response = await apiClient.get<PaymentAttempt[]>('/api/admin/payments');
    return response.data;
  },

  confirmCounterPayment: async (paymentId: number, idempotencyKey: string): Promise<PaymentAttempt> => {
    const response = await apiClient.patch<PaymentAttempt>(
      `/api/admin/payments/${paymentId}/confirm`,
      {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data;
  },

  confirmOrderPayment: async (orderId: number): Promise<PaymentAttempt> => {
    const response = await apiClient.patch<PaymentAttempt>(`/api/admin/orders/${orderId}/confirm-payment`);
    return response.data;
  }
};
