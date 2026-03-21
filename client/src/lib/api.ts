/**
 * API Service Layer
 * Routes through Next.js rewrites (proxy) to avoid CORS issues.
 * In dev: frontend on :3000 proxies to backend services on :3001-:3004.
 * In Docker: rewrites route to internal Docker network service URLs.
 */

const BASE = ''; // All requests go through Next.js rewrites on same origin

// ===== Helpers =====

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || data?.detail || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return { 
    Authorization: `Bearer ${token}`,
    'X-User-ID': typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '',
  };
}

// ===== Types =====

export interface AuthResponse {
  userId: string;
  token: string;
  expiresIn: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image_url?: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price?: number;
  name?: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  status: string;
  total_price: number;
  created_at: string;
  updated_at?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  count: number;
  average_rating: number;
}

export interface OrderSummary {
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  status_breakdown: Record<string, number>;
}

// ===== User Service APIs =====

export const userApi = {
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>(`${BASE}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>(`${BASE}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  validate: (token: string) =>
    request<{ valid: boolean; userId: string; email: string }>(
      `${BASE}/api/auth/validate`,
      {
        method: 'POST',
        headers: authHeaders(token),
      }
    ),

  getUser: (id: string) =>
    request<User>(`${BASE}/api/users/${id}`),

  getCurrentUserProfile: (token: string) =>
    request<User>(`${BASE}/api/users/me/profile`, {
      headers: authHeaders(token),
    }),

  updateProfile: (token: string, updates: { name?: string; email?: string }) =>
    request<User>(`${BASE}/api/users/me/profile`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<{ message: string }>(`${BASE}/api/users/me/password`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteProfile: (token: string) =>
    request<void>(`${BASE}/api/users/me/profile`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  health: () =>
    request<HealthStatus>(`${BASE}/api/health/user`),
};

// ===== Product Catalog Service APIs =====

export const productApi = {
  list: (params?: { search?: string; category?: string; min_price?: number; max_price?: number; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.min_price !== undefined) searchParams.set('min_price', String(params.min_price));
    if (params?.max_price !== undefined) searchParams.set('max_price', String(params.max_price));
    if (params?.sort) searchParams.set('sort', params.sort);
    const qs = searchParams.toString();
    return request<Product[]>(`${BASE}/api/products/${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) =>
    request<Product>(`${BASE}/api/products/${id}`),

  create: (product: Omit<Product, 'id'>, token: string) =>
    request<Product>(`${BASE}/api/products/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(product),
    }),

  update: (id: string, updates: Partial<Product>, token: string) =>
    request<Product>(`${BASE}/api/products/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    }),

  delete: (id: string, token: string) =>
    request<{ message: string }>(`${BASE}/api/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  categories: () =>
    request<{ categories: string[] }>(`${BASE}/api/products/categories`),

  checkStock: (items: OrderItem[]) =>
    request<{ items: unknown[]; all_available: boolean }>(
      `${BASE}/api/products/check-stock`,
      {
        method: 'POST',
        body: JSON.stringify({ items }),
      }
    ),

  getReviews: (productId: string) =>
    request<ReviewsResponse>(`${BASE}/api/products/${productId}/reviews`),

  createReview: (productId: string, rating: number, comment: string, userId: string, userName: string) =>
    request<Review>(`${BASE}/api/products/${productId}/reviews?user_id=${userId}&user_name=${encodeURIComponent(userName)}`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),

  health: () =>
    request<HealthStatus>(`${BASE}/api/health/product`),
};

// ===== Order Service APIs =====

export const orderApi = {
  create: (items: OrderItem[], token: string) =>
    request<Order>(`${BASE}/api/orders/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ items }),
    }),

  list: (token?: string) =>
    request<Order[]>(`${BASE}/api/orders/`, {
      headers: token ? authHeaders(token) : {},
    }),

  get: (id: string, token?: string) =>
    request<Order>(`${BASE}/api/orders/${id}`, {
      headers: token ? authHeaders(token) : {},
    }),

  summary: (token: string) =>
    request<OrderSummary>(`${BASE}/api/orders/summary`, {
      headers: authHeaders(token),
    }),

  updateStatus: (id: string, status: string, token: string) =>
    request<{ message: string; status: string }>(`${BASE}/api/orders/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),

  cancel: (id: string, token: string) =>
    request<{ message: string; status: string }>(`${BASE}/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: authHeaders(token),
    }),

  health: () =>
    request<HealthStatus>(`${BASE}/api/health/order`),
};

// ===== Notification Service APIs =====

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  order_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  items: OrderItem[];
  read: boolean;
  created_at: string;
}

export const notificationApi = {
  list: (token?: string) =>
    request<NotificationItem[]>(`${BASE}/api/notifications/`, {
      headers: token ? authHeaders(token) : {},
    }),

  count: () =>
    request<{ count: number }>(`${BASE}/api/notifications/count`),

  unreadCount: (token: string) =>
    request<{ count: number }>(`${BASE}/api/notifications/unread-count`, {
      headers: authHeaders(token),
    }),

  markAsRead: (id: string, token: string) =>
    request<{ message: string }>(`${BASE}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: authHeaders(token),
    }),

  markAllAsRead: (token: string) =>
    request<{ message: string; count: number }>(`${BASE}/api/notifications/read-all`, {
      method: 'PUT',
      headers: authHeaders(token),
    }),

  delete: (id: string, token: string) =>
    request<{ message: string }>(`${BASE}/api/notifications/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  health: () =>
    request<HealthStatus>(`${BASE}/api/health/notification`),
};

// ===== Payment Service APIs =====

export interface PaymentItem {
  _id: string;
  order_id: string;
  user_id: string;
  amount: number;
  status: string;
  transaction_id: string;
  created_at: string;
}

export const paymentApi = {
  getPaymentByOrder: (orderId: string) =>
    request<PaymentItem>(`${BASE}/api/payments/order/${orderId}`),

  processManualPayment: (order_id: string, user_id: string, amount: number) =>
    request<{ message: string; payment: PaymentItem }>(`${BASE}/api/payments/process`, {
      method: 'POST',
      body: JSON.stringify({ order_id, user_id, amount }),
    }),

  health: () =>
    request<HealthStatus>(`${BASE}/api/health/payment`),
};
