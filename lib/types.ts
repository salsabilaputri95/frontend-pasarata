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
  commodity_id: number;
  brand_type?: string;
  local_quantity: number;
  local_weight_kg: number;
  market_price: number;
  minimum_price: number;
  maximum_price: number;
  previous_price: number;
  converted_price: number;
  warning_status: 'normal' | 'below_minimum' | 'above_maximum';
  notes?: string;
  created_at?: string;
}

export interface AdminSummary {
  collectors: number;
  markets: number;
  commodities: number;
  total_entries: number;
  warning_entries: number;
  message?: string;
}
