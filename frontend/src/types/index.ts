export interface AssetSpecs {
  ram: string;
  processor: string;
  storage: string;
}

export interface IncidentDetails {
  police_report_num: string;
  description: string;
  reported_at: string;
  reported_by: string;
}

export interface Asset {
  qr_code: string;
  category: string;
  specs: AssetSpecs;
  original_value: number;
  book_value: number;
  purchase_date: string;
  status: string;
  custodio_fisico: string;
  responsable_administrativo: string;
  assigned_to: string | null;
  repair_cost: number | null;
  new_equipment_price: number;
  lifespan_months: number;
  extension_months: number;
  warranty_end_date: string;
  battery_wear_pct: number;
  previous_failures_count: number;
  incident_details: IncidentDetails | null;
  remaining_months?: number; // calculated dynamically by backend
}

export interface AllocationRequest {
  id: string;
  requester_role: string;
  collaborator: string;
  collaborator_profile: string;
  category_requested: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface HistoryLog {
  timestamp: string;
  asset_qr: string;
  from_status: string;
  to_status: string;
  emisor: string;
  receptor: string;
  motivo: string;
  custodio_fisico: string;
  responsable_administrativo: string;
}
