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
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface CustomizationGroup {
  id: number;
  name: string;
  isRequired: boolean;
  selectionType: 'SINGLE' | 'MULTI';
  options: CustomizationOption[];
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
  customizationGroups: CustomizationGroup[];
}

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'espresso': '/images/products/espresso.png',
  'cappuccino': '/images/products/cappuccino.png',
  'latte': '/images/products/latte.png',
  'cold coffee': '/images/products/cold_coffee.png',
  'masala chai': '/images/products/masala_chai.png',
  'green tea': '/images/products/green_tea.png',
  'veg burger': '/images/products/veg_burger.png',
  'paneer sandwich': '/images/products/paneer_sandwich.png',
  'french fries': '/images/products/french_fries.png',
  'chocolate brownie': '/images/products/brownie.png',
  'cheesecake': '/images/products/cheesecake.png',
};

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'coffee': '/images/products/cappuccino.png',
  'tea': '/images/products/green_tea.png',
  'burgers': '/images/products/veg_burger.png',
  'sandwiches': '/images/products/paneer_sandwich.png',
  'snacks': '/images/products/french_fries.png',
  'desserts': '/images/products/brownie.png',
  'ice creams': '/images/products/cheesecake.png',
};

function enrichProductImage(product: Product): Product {
  if (!product) return product;
  if (!product.imageUrl || product.imageUrl.trim() === '') {
    const key = product.name.toLowerCase().trim();
    if (PRODUCT_IMAGE_MAP[key]) {
      return { ...product, imageUrl: PRODUCT_IMAGE_MAP[key] };
    }
    const catKey = (product.categoryName || '').toLowerCase().trim();
    if (CATEGORY_DEFAULT_IMAGES[catKey]) {
      return { ...product, imageUrl: CATEGORY_DEFAULT_IMAGES[catKey] };
    }
  }
  return product;
}

export const productService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/api/categories');
    return response.data;
  },

  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/api/products');
    return response.data.map(enrichProductImage);
  },

  getProductsByCategory: async (categoryId: number): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/api/categories/${categoryId}/products`);
    return response.data.map(enrichProductImage);
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/products/${id}`);
    return enrichProductImage(response.data);
  },

  searchProducts: async (keyword: string): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/api/products/search`, {
      params: { keyword },
    });
    return response.data.map(enrichProductImage);
  }
};
