export interface StationResponse {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  bikes_available: number;
  docks_available: number;
  last_updated: string; // ISO string from datetime
  status_color: "green" | "yellow" | "red";
}

export interface StationStatus {
  bikes_available: number;
  docks_available: number;
  last_updated: string;
}

export interface Station {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  bikes_available: number;
  docks_available: number;
  last_updated: string;
  status_color: "green" | "yellow" | "red";
}

export interface Alert {
  station_id: string;
  station_name: string;
  type: "low_bikes" | "full_station" | "offline";
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

export interface TopStation {
  station_id: string;
  name: string;
  trip_count: number;
}

export interface AnalyticsSummary {
  top_stations: TopStation[];
  avg_trip_duration: number;
  peak_hour: number;
  total_trips: number;
}

export interface TenantSelectorProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
}

export interface StationMapProps {
  stations: Station[];
  selectedTenant: string;
}

export interface AlertsFeedProps {
  alerts: Alert[];
}

export interface AnalyticsPanelProps {
  analytics: AnalyticsSummary | null;
}

export type AlertType = Alert["type"];
export type AlertSeverity = Alert["severity"];
export type TenantId = "manhattan" | "brooklyn";
