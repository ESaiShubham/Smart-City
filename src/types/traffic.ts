export type TrafficLevel = 'FREE' | 'MODERATE' | 'HEAVY' | 'CRITICAL';

export interface TrafficLevelConfig {
  level: TrafficLevel;
  label: string;
  emoji: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  glowClass: string;
  badgeClass: string;
  minRatio: number;
  maxRatio: number;
}

export const TRAFFIC_LEVELS: Record<TrafficLevel, TrafficLevelConfig> = {
  FREE: {
    level: 'FREE',
    label: 'Free / Improving',
    emoji: '🟢',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/25',
    glowClass: '',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    minRatio: 0.75,
    maxRatio: 999,
  },
  MODERATE: {
    level: 'MODERATE',
    label: 'Moderate',
    emoji: '🟡',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/25',
    glowClass: '',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    minRatio: 0.50,
    maxRatio: 0.75,
  },
  HEAVY: {
    level: 'HEAVY',
    label: 'Heavy',
    emoji: '🟠',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/25',
    glowClass: '',
    badgeClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    minRatio: 0.30,
    maxRatio: 0.50,
  },
  CRITICAL: {
    level: 'CRITICAL',
    label: 'Critical',
    emoji: '🔴',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/25',
    glowClass: '',
    badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    minRatio: 0.0,
    maxRatio: 0.30,
  },
};

export interface RoadConnection {
  targetId: string;
  distanceKm: number;
  spilloverShare: number; // e.g. 0.45 (45% diverted/spillover traffic)
  junctionName: string;
}

export type IncidentType = 
  | 'COLLISION'
  | 'WATERLOGGING'
  | 'CONSTRUCTION'
  | 'VEHICLE_BREAKDOWN'
  | 'VIP_CORRIDOR';

export interface Incident {
  id: string;
  roadId: string;
  title: string;
  type: IncidentType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  reportedTime: string;
  lanesBlocked: number;
  totalLanes: number;
  initialQueue: number;
  isCleared: boolean;
  clearedAt?: string;
}

export interface Road {
  id: string;
  code: string; // e.g., "R17"
  name: string; // e.g., "Cyber Corridor Central"
  category: 'ARTERIAL' | 'EXPRESSWAY' | 'COLLECTOR' | 'RING_ROAD';
  freeFlowSpeed: number; // km/h
  currentSpeed: number;  // km/h
  speedTrend: number;    // km/h delta over last 15 mins (negative = worsening)
  capacity: number;      // veh/hr
  arrivalRate: number;   // veh/hr
  currentQueue: number;  // vehicles
  lengthKm: number;      // km
  lanes: number;
  coordinates: {
    x: number; // 0 - 800 normalized map scale
    y: number; // 0 - 600 normalized map scale
  };
  connectedRoads: RoadConnection[];
  activeIncident: Incident | null;
  historicalFactors: number[]; // 24-hr traffic volume multiplier
}

export interface TimelineStep {
  offsetMinutes: 0 | 15 | 30 | 45 | 60;
  timeLabel: 'NOW' | '+15 min' | '+30 min' | '+45 min' | '+60 min';
  clockTime: string; // formatted e.g. "09:15 AM"
  predictedSpeed: number;
  speedRatio: number; // speed / freeFlowSpeed
  level: TrafficLevel;
  levelLabel: string;
  emoji: string;
  badgeClass: string;
  trend: 'improving' | 'stable' | 'deteriorating';
  rationale: string;
}

export interface RecoveryPrediction {
  roadId: string;
  roadName: string;
  currentQueue: number;
  roadCapacity: number;
  arrivalRate: number;
  netClearingRateHr: number;  // C - A (veh/hr)
  netClearingRateMin: number; // (C - A) / 60 (veh/min)
  recoveryTimeMinutes: number | null;
  isUnrecoverable: boolean;
  warningMessage: string | null;
  expectedNormalTime: string | null;
  drainageProgressPercent: number;
  incidentClearedTimestamp: string;
}

export interface RippleCascadeNode {
  roadId: string;
  roadName: string;
  junctionName: string;
  distanceKm: number;
  waveDelayMinutes: number; // e.g. +12 min
  cumulativeMinutes: number; // e.g. +18 min
  predictedLevel: TrafficLevel;
  levelEmoji: string;
  predictedSpeed: number;
  newLoadVehiclesHr: number;
  capacity: number;
  spareCapacityVehiclesHr: number;
  spareCapacityPercent: number;
  isSafe: boolean;
  statusNote: string;
}

export interface RipplePrediction {
  sourceRoadId: string;
  sourceRoadName: string;
  sourceLevel: TrafficLevel;
  propagationSpeedKmh: number;
  cascadeChain: RippleCascadeNode[];
  atRiskRoads: RippleCascadeNode[];
  safeRoads: RippleCascadeNode[];
  summaryText: string;
}

export interface CombinedAdvisory {
  id: string;
  generatedAt: string;
  sourceRoadCode: string;
  sourceRoadName: string;
  severity: 'GREEN' | 'AMBER' | 'ORANGE' | 'RED';
  headline: string;
  trafficChangeSummary: string;
  recoverySummary: string;
  rippleSummary: string;
  recommendedActions: string[];
  diversionRoutes: Array<{
    congestedRoad: string;
    divertVia: string;
    spareCapacity: string;
    timeSaving: string;
  }>;
}
