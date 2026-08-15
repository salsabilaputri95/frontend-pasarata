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
  commodity?: { id: number; name: string; code?: string };
  local_unit?: { id: number; name: string };
  standard_unit?: { id: number; name: string };
}

export interface CollectorDashboard {
  collector_id: number;
  year?: number;
  assigned_markets: number;
  markets: Array<{ id: number; name: string; district?: string; nks?: string }>;
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

