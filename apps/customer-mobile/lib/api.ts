import { API_BASE_URL } from './constants';

const inFlightRequests = new Map<string, Promise<unknown>>();

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
  const url = `${API_BASE_URL}${endpoint}`;
  const existingRequest = inFlightRequests.get(url);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return response.json() as Promise<T>;
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });

  inFlightRequests.set(url, request);
  return request;
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

export interface DeliveryZone {
  id: string;
  nameAr: string;
  nameEn?: string;
  feeIqd: number;
  minOrderIqd: number;
  estimatedMinutes?: number;
  isActive: boolean;
}

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  return fetchApi<DeliveryZone[]>('/business-rules/delivery-zones');
}
