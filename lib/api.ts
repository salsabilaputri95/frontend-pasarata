import { AdminSummary, AuthResponse, CollectorDashboard, DataEntry, User } from './types';

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

async function requestBlob(path: string, options: RequestInit = {}, token?: string): Promise<Blob> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error ?? 'Request failed');
  }

  return response.blob();
}

async function requestForm<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: formData,
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
  dashboard: async (token: string, year?: number): Promise<CollectorDashboard> =>
    request<CollectorDashboard>(`/dashboard${year ? `?year=${year}` : ''}`, {}, token),
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
  exportCsv: async (token: string, scope: 'entries' | 'summary' | 'comparison', year?: number): Promise<Blob> =>
    requestBlob(`/admin/export?scope=${scope}${year ? `&year=${year}` : ''}`, {}, token),
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
  updateEntry: async (token: string, entryId: number, payload: {
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
  }) => request<{ message: string; data: DataEntry }>(`/entries/${entryId}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  deactivateEntry: async (token: string, entryId: number) =>
    request<{ message: string; data: DataEntry }>(`/entries/${entryId}/deactivate`, { method: 'PATCH' }, token),
  adminDashboard: async (token: string): Promise<AdminSummary> =>
    request<AdminSummary>('/admin/dashboard', {}, token),
  createCollector: async (token: string, payload: { username: string; password: string; full_name: string }) =>
    request<{ message: string; data: User }>('/admin/collectors', { method: 'POST', body: JSON.stringify(payload) }, token),
  updateCollector: async (token: string, collectorId: number, payload: { username?: string; full_name?: string }) =>
    request<{ message: string; data: User }>(`/admin/collectors/${collectorId}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  setCollectorStatus: async (token: string, collectorId: number, status: 'active' | 'inactive') =>
    request<{ message: string; data: User }>(`/admin/collectors/${collectorId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token),
  resetCollectorPassword: async (token: string, collectorId: number, newPassword: string) =>
    request<{ message: string }>(`/admin/collectors/${collectorId}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password: newPassword }) }, token),
  createMarket: async (token: string, payload: { province: string; district: string; nks: string; name: string }) =>
    request<{ message: string; data: unknown }>('/admin/markets', { method: 'POST', body: JSON.stringify(payload) }, token),
  createCategory: async (token: string, payload: { name: string; type: string }) =>
    request<{ message: string; data: unknown }>('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }, token),
  createCommodity: async (token: string, payload: { code: string; name: string; category_id: number; brand_type?: string }) =>
    request<{ message: string; data: unknown }>('/admin/commodities', { method: 'POST', body: JSON.stringify(payload) }, token),
  createUnit: async (token: string, payload: { name: string; is_standard?: boolean; conversion_factor?: number }) =>
    request<{ message: string; data: unknown }>('/admin/units', { method: 'POST', body: JSON.stringify(payload) }, token),
  previewImportEntries: async (token: string, file: File, collectorIdDefault?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (collectorIdDefault) {
      formData.append('collector_id_default', String(collectorIdDefault));
    }
    return requestForm<{ total_rows: number; valid_rows: number; errors: Record<string, string[]>; message: string }>('/admin/import/preview', formData, token);
  },
  importEntries: async (token: string, file: File, collectorIdDefault?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (collectorIdDefault) {
      formData.append('collector_id_default', String(collectorIdDefault));
    }
    return requestForm<{ message: string; imported_rows: number; skipped_rows: number; validation_logs: Record<string, string[]> }>('/admin/import/commit', formData, token);
  },
  exportReport: async (
    token: string,
    payload: {
      scope: 'entries' | 'summary' | 'comparison';
      format?: 'csv' | 'xlsx';
      year?: number;
      market_id?: number;
      collector_id?: number;
      warning_status?: 'normal' | 'below_minimum' | 'above_maximum';
    },
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    params.set('scope', payload.scope);
    params.set('format', payload.format ?? 'xlsx');
    if (payload.year) params.set('year', String(payload.year));
    if (payload.market_id) params.set('market_id', String(payload.market_id));
    if (payload.collector_id) params.set('collector_id', String(payload.collector_id));
    if (payload.warning_status) params.set('warning_status', payload.warning_status);
    return requestBlob(`/admin/export-report?${params.toString()}`, {}, token);
  },
};
