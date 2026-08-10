import apiClient from './apiClient';

export interface LoginResponse {
  token: string;
  type: string;
  role: string;
  email: string;
  name: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/admin/login', { email, password });
    
    // Store credentials
    localStorage.setItem('admin_token', response.data.token);
    localStorage.setItem('admin_role', response.data.role);
    localStorage.setItem('admin_email', response.data.email);
    localStorage.setItem('admin_name', response.data.name);
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_name');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('admin_token');
  },

  getRole: (): string | null => {
    return localStorage.getItem('admin_role');
  },

  getName: (): string | null => {
    return localStorage.getItem('admin_name');
  }
};
