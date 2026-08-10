import apiClient from './apiClient';

export interface DashboardKPIs {
  todayRevenue: number;
  todayOrdersCount: number;
  pendingOrdersCount: number;
  completedOrdersCount: number;
  pendingCounterPayments: number;
  averageCustomerRating: number;
}

export interface SalesAnalytics {
  paymentMethodDistribution: Record<string, number>;
  orderStatusCounts: Record<string, number>;
  topProducts: Array<{
    productName: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
  dailySalesBreakdown: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  averageOrderValue: number;
}

export interface FeedbackSummary {
  totalFeedback: number;
  avgOverallRating: number;
  avgServiceRating: number;
  recommendationRate: number;
}

export const dashboardService = {
  getKPIs: async (): Promise<DashboardKPIs> => {
    const response = await apiClient.get<DashboardKPIs>('/api/admin/dashboard');
    return response.data;
  },

  getAnalytics: async (): Promise<SalesAnalytics> => {
    const response = await apiClient.get<SalesAnalytics>('/api/admin/analytics');
    return response.data;
  },

  getFeedbackAnalytics: async (): Promise<FeedbackSummary> => {
    const response = await apiClient.get<FeedbackSummary>('/api/admin/feedback');
    return response.data;
  }
};
