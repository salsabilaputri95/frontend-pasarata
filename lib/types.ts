export type UserRole = 'admin' | 'collector';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  status: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DataEntry {
  id: number;
  year: number;
  market_id: number;
  collector_id: number;
  category_id: number;
  commodity_id: number;
  brand_type?: string;
  local_unit_id: number;
  local_quantity: number;
  local_weight_kg: number;
  standard_unit_id: number;
  market_price: number;
  minimum_price: number;
  maximum_price: number;
  previous_price: number;
  converted_price: number;
  warning_status: 'normal' | 'below_minimum' | 'above_maximum';
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  market?: { id: number; name: string; district?: string };
  category?: { id: number; name: string };
  commodity?: Commodity;
  local_unit?: Unit;
  standard_unit?: Unit;
}

export interface Unit {
  id: number;
  name: string;
  is_standard: boolean;
  standard_value?: number;
  standard_unit_name?: string;
  conversion_factor?: number;
  active?: boolean;
}

export interface Commodity {
  id: number;
  code: string;
  name: string;
  category_id: number;
  standard_unit_id?: number;
  standard_unit?: Unit;
  brand_type?: string;
  active?: boolean;
  category?: { id?: number; name?: string };
}

export interface CommodityCategory {
  id: number;
  name: string;
  type: string;
  active?: boolean;
}

export interface Market {
  id: number;
  name: string;
  district?: string;
  province?: string;
  nks?: string;
  active?: boolean;
}

export interface CollectorDashboard {
  collector_id: number;
  year?: number;
  assigned_markets: number;
  assigned_market?: { id: number; name: string; district?: string; nks?: string; province?: string };
  markets: Array<{ id: number; name: string; district?: string; nks?: string; province?: string }>;
  total_entries: number;
  inactive_entries: number;
  warning_entries: number;
  editable_entries: number;
  entries: DataEntry[];
}

export interface AdminSummary {
  collectors: number;
  markets: number;
  commodities: number;
  total_entries: number;
  warning_entries: number;
  by_year?: Array<{
    year: number;
    total_entries: number;
    warning_entries: number;
  }>;
  by_market?: Array<{
    market_id: number;
    market_name: string;
    district: string;
    total_entries: number;
    warning_entries: number;
  }>;
  by_collector?: Array<{
    collector_id: number;
    collector_name: string;
    username: string;
    total_entries: number;
    warning_entries: number;
  }>;
  recent_entries?: DataEntry[];
  message?: string;
}

