import { AdminSummary, AuthResponse, DataEntry, User } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed');
  }

  return data as T;
}

export const api = {
  login: async (username: string, password: string): Promise<AuthResponse> =>
    request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: async (token: string): Promise<User> => request<User>('/me', {}, token),
  dashboard: async (token: string): Promise<{ total_entries: number; warning_entries: number; collector_id: number; entries: DataEntry[] }> =>
    request<any>('/dashboard', {}, token),
  entries: async (token: string): Promise<{ data: DataEntry[] }> =>
    request<{ data: DataEntry[] }>('/entries/me', {}, token),
  markets: async (token: string): Promise<{ data: Array<{ id: number; name: string; province: string; district: string; nks: string }> }> =>
    request<{ data: Array<{ id: number; name: string; province: string; district: string; nks: string }> }>('/markets', {}, token),
  collectors: async (token: string): Promise<{ data: Array<{ id: number; username: string; full_name: string; role: string; status: string }> }> =>
    request<{ data: Array<{ id: number; username: string; full_name: string; role: string; status: string }> }>('/admin/collectors', {}, token),
  assignments: async (token: string): Promise<{ data: Array<{ id: number; user_id: number; market_id: number; user?: { full_name?: string; username?: string }; market?: { name?: string; district?: string } }> }> =>
    request<{ data: Array<{ id: number; user_id: number; market_id: number; user?: { full_name?: string; username?: string }; market?: { name?: string; district?: string } }> }>('/admin/assignments', {}, token),
  createAssignment: async (token: string, payload: { user_id: number; market_id: number }) =>
    request<{ message: string; data: unknown }>('/admin/assignments', { method: 'POST', body: JSON.stringify(payload) }, token),
  adminEntries: async (token: string): Promise<{ data: DataEntry[] }> =>
    request<{ data: DataEntry[] }>('/admin/entries', {}, token),
  auditLogs: async (token: string): Promise<{ data: Array<{ id: number; entry_id: number; user_id: number; action: string; before?: string; after?: string; created_at?: string; user?: { full_name?: string; username?: string } }> }> =>
    request<{ data: Array<{ id: number; entry_id: number; user_id: number; action: string; before?: string; after?: string; created_at?: string; user?: { full_name?: string; username?: string } }> }>('/admin/audit-logs', {}, token),
  comparison: async (token: string, year?: number): Promise<{ year: number; data: Array<{ market_name: string; commodity_name: string; current_year: number; previous_year: number; current_average: number; previous_average: number; delta: number; delta_percent: number }> }> =>
    request<{ year: number; data: Array<{ market_name: string; commodity_name: string; current_year: number; previous_year: number; current_average: number; previous_average: number; delta: number; delta_percent: number }> }>(`/admin/comparison${year ? `?year=${year}` : ''}`, {}, token),
  summary: async (token: string, year?: number): Promise<{ year: number; data: Array<{ market_name: string; commodity_name: string; year: number; average_price: number; min_price: number; max_price: number; count: number }> }> =>
    request<{ year: number; data: Array<{ market_name: string; commodity_name: string; year: number; average_price: number; min_price: number; max_price: number; count: number }> }>(`/admin/summary${year ? `?year=${year}` : ''}`, {}, token),
  categories: async (token: string): Promise<{ data: Array<{ id: number; name: string; type: string }> }> =>
    request<{ data: Array<{ id: number; name: string; type: string }> }>('/categories', {}, token),
  commodities: async (token: string): Promise<{ data: Array<{ id: number; code: string; name: string; category_id: number; brand_type?: string }> }> =>
    request<{ data: Array<{ id: number; code: string; name: string; category_id: number; brand_type?: string }> }>('/commodities', {}, token),
  units: async (token: string): Promise<{ data: Array<{ id: number; name: string; is_standard: boolean; conversion_factor: number }> }> =>
    request<{ data: Array<{ id: number; name: string; is_standard: boolean; conversion_factor: number }> }>('/units', {}, token),
  createEntry: async (token: string, payload: {
    year: number;
    market_id: number;
    category_id: number;
    commodity_id: number;
    brand_type: string;
    local_unit_id: number;
    local_quantity: number;
    local_weight_kg: number;
    standard_unit_id: number;
    market_price: number;
    minimum_price: number;
    maximum_price: number;
    previous_price: number;
    notes: string;
  }) => request<{ message: string; data: DataEntry }>('/entries', { method: 'POST', body: JSON.stringify(payload) }, token),
  adminDashboard: async (token: string): Promise<AdminSummary> =>
    request<AdminSummary>('/admin/dashboard', {}, token),
  createCollector: async (token: string, payload: { username: string; password: string; full_name: string }) =>
    request<{ message: string; data: User }>('/admin/collectors', { method: 'POST', body: JSON.stringify(payload) }, token),
  createMarket: async (token: string, payload: { province: string; district: string; nks: string; name: string }) =>
    request<{ message: string; data: unknown }>('/admin/markets', { method: 'POST', body: JSON.stringify(payload) }, token),
  createCategory: async (token: string, payload: { name: string; type: string }) =>
    request<{ message: string; data: unknown }>('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }, token),
  createCommodity: async (token: string, payload: { code: string; name: string; category_id: number; brand_type?: string }) =>
    request<{ message: string; data: unknown }>('/admin/commodities', { method: 'POST', body: JSON.stringify(payload) }, token),
  createUnit: async (token: string, payload: { name: string; is_standard?: boolean; conversion_factor?: number }) =>
    request<{ message: string; data: unknown }>('/admin/units', { method: 'POST', body: JSON.stringify(payload) }, token),
};
