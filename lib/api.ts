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
  priceReference: async (
    token: string,
    commodityId: number,
    marketId?: number,
    year?: number,
  ): Promise<{
    found: boolean;
    ref_year: number;
    commodity_id: number;
    market_id: number;
    scope?: string;
    minimum_price?: number;
    maximum_price?: number;
    previous_price?: number;
    sample_count?: number;
    message?: string;
  }> => {
    const params = new URLSearchParams({ commodity_id: String(commodityId) });
    if (marketId) params.set('market_id', String(marketId));
    if (year) params.set('year', String(year));
    // 404 means "not found" — we catch and return found:false gracefully
    try {
      return await request(`/price-reference?${params}`, {}, token);
    } catch {
      return { found: false, ref_year: (year ?? new Date().getFullYear()) - 1, commodity_id: commodityId, market_id: marketId ?? 0, message: 'tidak ada data referensi' };
    }
  },
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
  adminEntriesFiltered: async (
    token: string,
    filters: {
      year?: number;
      market_id?: number;
      collector_id?: number;
      warning_status?: 'normal' | 'below_minimum' | 'above_maximum' | '';
      is_active?: 'true' | 'false' | '';
    } = {},
  ): Promise<{ data: DataEntry[] }> => {
    const params = new URLSearchParams();
    if (filters.year) params.set('year', String(filters.year));
    if (filters.market_id) params.set('market_id', String(filters.market_id));
    if (filters.collector_id) params.set('collector_id', String(filters.collector_id));
    if (filters.warning_status) params.set('warning_status', filters.warning_status);
    if (filters.is_active) params.set('is_active', filters.is_active);
    const qs = params.toString();
    return request<{ data: DataEntry[] }>(`/admin/entries${qs ? `?${qs}` : ''}`, {}, token);
  },
  adminUpdateEntry: async (
    token: string,
    entryId: number,
    payload: {
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
    },
  ) => request<{ message: string; data: DataEntry }>(`/admin/entries/${entryId}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  adminDeleteEntry: async (token: string, entryId: number) =>
    request<{ message: string }>(`/admin/entries/${entryId}`, { method: 'DELETE' }, token),
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
  entryAudit: async (
    token: string,
    entryId: number,
  ): Promise<{ data: Array<{ id: number; entry_id: number; user_id: number; action: string; before?: string; after?: string; created_at: string }> }> =>
    request(`/entries/${entryId}/audit`, {}, token),
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
  updateMarket: async (token: string, id: number, payload: { province: string; district: string; nks: string; name: string }) =>
    request<{ message: string; data: unknown }>(`/admin/markets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  setMarketStatus: async (token: string, id: number, active: boolean) =>
    request<{ message: string; data: unknown }>(`/admin/markets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }, token),
  createCategory: async (token: string, payload: { name: string; type: string }) =>
    request<{ message: string; data: unknown }>('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }, token),
  updateCategory: async (token: string, id: number, payload: { name: string; type: string }) =>
    request<{ message: string; data: unknown }>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  setCategoryStatus: async (token: string, id: number, active: boolean) =>
    request<{ message: string; data: unknown }>(`/admin/categories/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }, token),
  createCommodity: async (token: string, payload: { code: string; name: string; category_id: number; brand_type?: string }) =>
    request<{ message: string; data: unknown }>('/admin/commodities', { method: 'POST', body: JSON.stringify(payload) }, token),
  updateCommodity: async (token: string, id: number, payload: { code: string; name: string; category_id: number; brand_type?: string }) =>
    request<{ message: string; data: unknown }>(`/admin/commodities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  setCommodityStatus: async (token: string, id: number, active: boolean) =>
    request<{ message: string; data: unknown }>(`/admin/commodities/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }, token),
  createUnit: async (token: string, payload: { name: string; is_standard?: boolean; conversion_factor?: number }) =>
    request<{ message: string; data: unknown }>('/admin/units', { method: 'POST', body: JSON.stringify(payload) }, token),
  updateUnit: async (token: string, id: number, payload: { name: string; is_standard?: boolean; conversion_factor?: number }) =>
    request<{ message: string; data: unknown }>(`/admin/units/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  setUnitStatus: async (token: string, id: number, active: boolean) =>
    request<{ message: string; data: unknown }>(`/admin/units/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }, token),
  deleteAssignment: async (token: string, id: number) =>
    request<{ message: string }>(`/admin/assignments/${id}`, { method: 'DELETE' }, token),
  inspectImportHeaders: async (token: string, file: File) => {

    const formData = new FormData();
    formData.append('file', file);
    return requestForm<{ headers: string[]; sample_rows: string[][]; total_rows: number; message: string }>('/admin/import/headers', formData, token);
  },
  previewImportEntries: async (
    token: string,
    file: File,
    options?: {
      collectorIdDefault?: number;
      mapping?: Record<string, string>;
      defaults?: Record<string, string>;
    },
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.collectorIdDefault) {
      formData.append('collector_id_default', String(options.collectorIdDefault));
    }
    if (options?.mapping && Object.keys(options.mapping).length > 0) {
      formData.append('mapping', JSON.stringify(options.mapping));
    }
    if (options?.defaults && Object.keys(options.defaults).length > 0) {
      formData.append('defaults', JSON.stringify(options.defaults));
    }
    return requestForm<{
      total_rows: number;
      valid_rows: number;
      errors: Record<string, string[]>;
      sample_parsed?: Array<Record<string, unknown>>;
      message: string;
    }>('/admin/import/preview', formData, token);
  },
  importEntries: async (
    token: string,
    file: File,
    options?: {
      collectorIdDefault?: number;
      mapping?: Record<string, string>;
      defaults?: Record<string, string>;
    },
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.collectorIdDefault) {
      formData.append('collector_id_default', String(options.collectorIdDefault));
    }
    if (options?.mapping && Object.keys(options.mapping).length > 0) {
      formData.append('mapping', JSON.stringify(options.mapping));
    }
    if (options?.defaults && Object.keys(options.defaults).length > 0) {
      formData.append('defaults', JSON.stringify(options.defaults));
    }
    return requestForm<{ message: string; imported_rows: number; skipped_rows: number; validation_logs: Record<string, string[]> }>('/admin/import/commit', formData, token);
  },
  previewImportMaster: async (
    token: string,
    file: File,
    target: 'commodities' | 'categories' | 'units' | 'markets',
    options?: {
      mapping?: Record<string, string>;
      defaults?: Record<string, string>;
    },
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);
    if (options?.mapping && Object.keys(options.mapping).length > 0) {
      formData.append('mapping', JSON.stringify(options.mapping));
    }
    if (options?.defaults && Object.keys(options.defaults).length > 0) {
      formData.append('defaults', JSON.stringify(options.defaults));
    }
    return requestForm<{
      target: string;
      total_rows: number;
      valid_rows: number;
      new_rows: number;
      update_rows: number;
      errors: Record<string, string[]>;
      sample_parsed?: Array<Record<string, unknown>>;
      message: string;
    }>('/admin/import/master/preview', formData, token);
  },
  importMaster: async (
    token: string,
    file: File,
    target: 'commodities' | 'categories' | 'units' | 'markets',
    options?: {
      mapping?: Record<string, string>;
      defaults?: Record<string, string>;
    },
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);
    if (options?.mapping && Object.keys(options.mapping).length > 0) {
      formData.append('mapping', JSON.stringify(options.mapping));
    }
    if (options?.defaults && Object.keys(options.defaults).length > 0) {
      formData.append('defaults', JSON.stringify(options.defaults));
    }
    return requestForm<{
      message: string;
      target: string;
      created_count: number;
      updated_count: number;
      skipped_count: number;
    }>('/admin/import/master/commit', formData, token);
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
