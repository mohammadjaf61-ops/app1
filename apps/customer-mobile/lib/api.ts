import { API_BASE_URL } from './constants';

export interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  categoryId?: string;
  inStock?: boolean;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

export async function fetchProducts(categoryId?: string): Promise<Product[]> {
  const params = categoryId ? `?categoryId=${categoryId}` : '';
  return fetchApi<Product[]>(`/products${params}`);
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  return fetchApi<Product[]>('/products/featured');
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchApi<Category[]>('/categories');
}
