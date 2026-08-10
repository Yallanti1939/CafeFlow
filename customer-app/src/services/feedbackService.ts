import apiClient from './apiClient';

export interface ProductFeedbackRequest {
  productId: number;
  orderItemId: number;
  rating: number;
  comment: string;
}

export interface FeedbackRequest {
  orderId: number;
  overallRating: number;
  serviceRating: number;
  comment: string;
  recommend: boolean;
  productFeedbacks: ProductFeedbackRequest[];
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  customer: string; // masked phone number
}

export const feedbackService = {
  submitFeedback: async (request: FeedbackRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/feedback', request);
    return response.data;
  },

  getProductFeedback: async (productId: number): Promise<ProductReview[]> => {
    const response = await apiClient.get<ProductReview[]>(`/api/products/${productId}/feedback`);
    return response.data;
  }
};
