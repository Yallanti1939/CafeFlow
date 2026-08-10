import apiClient from './apiClient';

export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface CustomizationOption {
  id?: number;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface CustomizationGroup {
  id?: number;
  name: string;
  isRequired: boolean;
  selectionType: 'SINGLE' | 'MULTI';
  options?: CustomizationOption[];
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  isVisible: boolean;
  availabilityStatus: 'AVAILABLE' | 'OUT_OF_STOCK' | 'UNAVAILABLE';
  customizationGroupIds?: number[];
  customizationGroups?: CustomizationGroup[];
}

export const productService = {
  // Categories CRUD
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/api/categories');
    return response.data;
  },

  createCategory: async (formData: FormData): Promise<Category> => {
    const response = await apiClient.post<Category>('/api/admin/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateCategory: async (id: number, formData: FormData): Promise<Category> => {
    const response = await apiClient.put<Category>(`/api/admin/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/categories/${id}`);
  },

  // Products CRUD
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/api/admin/products');
    return response.data;
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const response = await apiClient.post<Product>('/api/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateProduct: async (id: number, formData: FormData): Promise<Product> => {
    const response = await apiClient.put<Product>(`/api/admin/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/products/${id}`);
  },

  // Customizations CRUD
  getCustomizations: async (): Promise<CustomizationGroup[]> => {
    const response = await apiClient.get<CustomizationGroup[]>('/api/admin/customizations');
    return response.data;
  },

  createCustomizationGroup: async (group: CustomizationGroup): Promise<CustomizationGroup> => {
    const response = await apiClient.post<CustomizationGroup>('/api/admin/customizations', group);
    return response.data;
  },

  updateCustomizationGroup: async (id: number, group: CustomizationGroup): Promise<CustomizationGroup> => {
    const response = await apiClient.put<CustomizationGroup>(`/api/admin/customizations/${id}`, group);
    return response.data;
  },

  deleteCustomizationGroup: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/customizations/${id}`);
  },

  addCustomizationOption: async (groupId: number, option: CustomizationOption): Promise<CustomizationOption> => {
    const response = await apiClient.post<CustomizationOption>(`/api/admin/customizations/${groupId}/options`, option);
    return response.data;
  },

  updateCustomizationOption: async (optionId: number, option: CustomizationOption): Promise<CustomizationOption> => {
    const response = await apiClient.put<CustomizationOption>(`/api/admin/customizations/options/${optionId}`, option);
    return response.data;
  },

  deleteCustomizationOption: async (optionId: number): Promise<void> => {
    await apiClient.delete(`/api/admin/customizations/options/${optionId}`);
  }
};
