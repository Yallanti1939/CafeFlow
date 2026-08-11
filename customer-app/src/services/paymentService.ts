import apiClient from './apiClient';

export interface PaymentInitiateRequest {
  orderIdFormatted: string;
  paymentMethod: 'UPI' | 'CARD';
  amount: number;
}

export interface PaymentDto {
  id: number;
  orderId: number;
  orderIdFormatted: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  provider: string;
  providerPaymentId: string;
  transactionReference: string;
  failureReason: string;
  verifiedAt: string;
}

export interface InvoiceDto {
  id: number;
  invoiceNumber: string;
  pdfPath: string;
  generatedAt: string;
}

export const paymentService = {
  initiatePayment: async (request: PaymentInitiateRequest, idempotencyKey: string): Promise<PaymentDto> => {
    const response = await apiClient.post<PaymentDto>('/api/payments/initiate', request, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  verifyPayment: async (
    params: {
      orderIdFormatted: string;
      providerOrderId: string;
      providerPaymentId: string;
      signature: string;
    },
    idempotencyKey: string
  ): Promise<PaymentDto> => {
    const response = await apiClient.post<PaymentDto>('/api/payments/verify', params, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  getCustomerInvoice: async (orderId: number): Promise<InvoiceDto> => {
    const response = await apiClient.get<InvoiceDto>(`/api/customer/invoices/${orderId}`);
    return response.data;
  },

  downloadInvoicePdf: async (invoiceNumber: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/invoices/download/${invoiceNumber}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDownloadInvoiceUrl: (invoiceNumber: string): string => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    return `${API_BASE_URL}/api/invoices/download/${invoiceNumber}`;
  }
};
