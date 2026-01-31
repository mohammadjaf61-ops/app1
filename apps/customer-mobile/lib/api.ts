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
  try {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return await fetchApi<Product[]>(`/products${params}`);
  } catch {
    // Return mock data when API unavailable
    return getMockProducts();
  }
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    return await fetchApi<Product[]>('/products/featured');
  } catch {
    return getMockProducts();
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    return await fetchApi<Category[]>('/categories');
  } catch {
    return getMockCategories();
  }
}

function getMockProducts(): Product[] {
  return [
    { id: 'p1', sku: 'APL-001', nameAr: 'تفاح أحمر', price: 2500, inStock: true },
    { id: 'p2', sku: 'BNN-002', nameAr: 'موز', price: 1500, inStock: true },
    { id: 'p3', sku: 'MLK-003', nameAr: 'حليب طازج', price: 3000, inStock: true },
    { id: 'p4', sku: 'BRD-004', nameAr: 'خبز صمون', price: 1000, inStock: true },
    { id: 'p5', sku: 'EGG-005', nameAr: 'بيض طازج', price: 5000, inStock: true },
    { id: 'p6', sku: 'CHZ-006', nameAr: 'جبن أبيض', price: 4500, inStock: true },
  ];
}

function getMockCategories(): Category[] {
  return [
    { id: 'c1', nameAr: 'فواكه' },
    { id: 'c2', nameAr: 'خضروات' },
    { id: 'c3', nameAr: 'ألبان' },
    { id: 'c4', nameAr: 'مشروبات' },
    { id: 'c5', nameAr: 'معلبات' },
    { id: 'c6', nameAr: 'مخبوزات' },
  ];
}
