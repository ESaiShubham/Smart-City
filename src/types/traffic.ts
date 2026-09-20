export type TrafficLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface TrafficLevelConfig {
  label: string;
  sublabel: string;
  speedRange: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  emoji?: string;
}

export const TRAFFIC_LEVELS: Record<TrafficLevel, TrafficLevelConfig> = {
  green: {
    label: 'FREE',
    sublabel: 'Optimal flow',
    speedRange: '> 45 km/h',
    color: '#10b981',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/10',
    emoji: '🟢',
  },
  yellow: {
    label: 'MODERATE',
    sublabel: 'Minor slowing',
    speedRange: '30–45 km/h',
    color: '#eab308',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/10',
    emoji: '🟡',
  },
  orange: {
    label: 'HEAVY',
    sublabel: 'Significant delay',
    speedRange: '15–30 km/h',
    color: '#f97316',
    badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    borderClass: 'border-orange-500/30',
    bgClass: 'bg-orange-500/10',
    emoji: '🟠',
  },
  red: {
    label: 'CRITICAL',
    sublabel: 'Gridlock alert',
    speedRange: '< 15 km/h',
    color: '#f43f5e',
    badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    borderClass: 'border-rose-500/30',
    bgClass: 'bg-rose-500/10',
    emoji: '🔴',
  },
};

export interface RoadStatus {
  segment_id: string;
  name?: string;
  road_class: string;
  lanes: number;
  capacity_vph: number;
  free_flow_speed_kmh: number;
  length_km?: number;
  current_speed_kmh: number;
  current_flow_vph: number;
  occupancy_pct: number;
  queue_length_veh: number;
  delay_min: number;
  congestion_index: number;
  level: TrafficLevel;
  active_incident?: boolean;
  incident_details?: IncidentData | null;
  source_node: string;
  target_node: string;
  source_lat: number;
  source_lon: number;
  target_lat: number;
  target_lon: number;
}

export type Road = RoadStatus;

export interface HorizonForecast {
  horizon_minutes: number;
  predicted_speed_kmh: number;
  predicted_flow_vph: number;
  predicted_congestion_index: number;
  level: TrafficLevel;
  status_label: string;
  confidence: number;
}

export interface ForecastData {
  segment_id: string;
  generated_at: string;
  current_speed_kmh: number;
  current_congestion: number;
  current_level: string;
  forecast: Record<'15m' | '30m' | '45m' | '60m', HorizonForecast>;
  confidence: Record<string, number>;
  model_type: string;
}

export interface IncidentData {
  incident_id: string;
  segment_id: string;
  start_time: string;
  end_time?: string | null;
  incident_type: string;
  severity: number;
  lanes_blocked: number;
  status: string;
  description?: string;
}

export interface RecoveryData {
  segment_id: string;
  timestamp: string;
  queue_length_veh: number;
  effective_capacity_vph: number;
  arrival_rate_vph: number;
  net_clearing_rate_vph: number;
  estimated_recovery_minutes: number | null;
  status: 'recovering' | 'requires_intervention' | 'cleared';
  confidence: number;
  explanation: string;
}

export interface RippleAffectedSegment {
  segment_id: string;
  target_node: string;
  road_class: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  estimated_arrival_minutes: number;
  predicted_congestion: number;
  cascade_level: number;
  available_capacity_vph: number;
}

export interface RippleData {
  source_segment: string;
  current_congestion: number;
  affected_segments: RippleAffectedSegment[];
  total_impacted_length_km: number;
  cascade_summary: string;
}

export interface AdvisoryData {
  segment_id: string;
  generated_at: string;
  severity: 'info' | 'warning' | 'critical';
  headline: string;
  bullet_points: string[];
  ripple_warning?: string;
  recommended_diversion?: any;
  disclaimer: string;
}

export interface DiversionData {
  segment_id: string;
  primary_route_blocked: boolean;
  recommended_route: string[];
  alternative_routes: string[][];
  reason: string;
  expected_travel_time_min: number;
  baseline_travel_time_min: number;
  time_saved_min: number;
}

export interface DashboardSummary {
  timestamp: string;
  active_incidents_count: number;
  critical_roads_count: number;
  average_congestion_index: number;
  average_speed_kmh: number;
  spillover_risk_roads_count: number;
  simulation_status: string;
  simulation_speed: number;
  city: string;
}
