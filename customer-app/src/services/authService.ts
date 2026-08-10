import apiClient from './apiClient';

export interface OtpResponse {
  message: string;
  otp?: string; // only returned in dev profile
}

export interface VerifyResponse {
  token: string;
  type: string;
  role: string;
  identifier: string;
  name: string;
}

export const authService = {
  sendOtp: async (mobileNumber: string): Promise<OtpResponse> => {
    const response = await apiClient.post<OtpResponse>('/api/auth/customer/send-otp', { mobileNumber });
    return response.data;
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<VerifyResponse> => {
    const response = await apiClient.post<VerifyResponse>('/api/auth/customer/verify-otp', { mobileNumber, otp });
    
    // Persist JWT token and customer details
    localStorage.setItem('customer_token', response.data.token);
    localStorage.setItem('customer_identifier', response.data.identifier);
    localStorage.setItem('customer_name', response.data.name);
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_identifier');
    localStorage.removeItem('customer_name');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('customer_token');
  }
};
