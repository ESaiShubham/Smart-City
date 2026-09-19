import type { Road, Incident } from '../types/traffic';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-081',
    roadId: 'R17',
    title: 'Multi-Vehicle Collision at Tech Junction',
    type: 'COLLISION',
    severity: 'CRITICAL',
    description: '3-car pile-up blocking 2 of 4 lanes. Emergency services on scene. Traffic backed up 1.8km.',
    reportedTime: '09:18 AM',
    lanesBlocked: 2,
    totalLanes: 4,
    initialQueue: 1240,
    isCleared: false,
  },
  {
    id: 'INC-2026-079',
    roadId: 'R04',
    title: 'Monsoon Flash Waterlogging',
    type: 'WATERLOGGING',
    severity: 'HIGH',
    description: 'Underpass drainage clogged with 35cm standing water. Slow movement restricted to outer lane.',
    reportedTime: '08:45 AM',
    lanesBlocked: 2,
    totalLanes: 3,
    initialQueue: 820,
    isCleared: false,
  },
  {
    id: 'INC-2026-074',
    roadId: 'R12',
    title: 'Metro Feeder Electric Bus Breakdown',
    type: 'VEHICLE_BREAKDOWN',
    severity: 'MEDIUM',
    description: 'EV bus stalled at junction approach. Tow truck dispatched.',
    reportedTime: '09:05 AM',
    lanesBlocked: 1,
    totalLanes: 3,
    initialQueue: 410,
    isCleared: true,
    clearedAt: '09:30 AM',
  }
];

export const INITIAL_ROADS: Road[] = [
  {
    id: 'R17',
    code: 'R17',
    name: 'Cyber Corridor Central',
    category: 'ARTERIAL',
    freeFlowSpeed: 40,
    currentSpeed: 22,
    speedTrend: -4.5,
    capacity: 4800,
    arrivalRate: 1700,
    currentQueue: 1240,
    lengthKm: 3.4,
    lanes: 4,
    coordinates: { x: 410, y: 280 },
    connectedRoads: [
      { targetId: 'R18', distanceKm: 3.6, spilloverShare: 0.55, junctionName: 'Junction J4 (Cyber Cross)' },
      { targetId: 'R19', distanceKm: 2.2, spilloverShare: 0.25, junctionName: 'Junction J7 (Greenway Diverter)' },
      { targetId: 'R16', distanceKm: 1.8, spilloverShare: 0.20, junctionName: 'Junction J2 (Tech Gate)' }
    ],
    activeIncident: INITIAL_INCIDENTS[0],
    historicalFactors: [0.3, 0.25, 0.2, 0.25, 0.4, 0.7, 0.95, 1.15, 1.25, 1.1, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.15, 1.3, 1.25, 1.0, 0.8, 0.65, 0.5, 0.4]
  },
  {
    id: 'R18',
    code: 'R18',
    name: 'North Tech Boulevard',
    category: 'ARTERIAL',
    freeFlowSpeed: 50,
    currentSpeed: 24,
    speedTrend: -3.0,
    capacity: 3900,
    arrivalRate: 2650,
    currentQueue: 650,
    lengthKm: 2.8,
    lanes: 3,
    coordinates: { x: 530, y: 200 },
    connectedRoads: [
      { targetId: 'R21', distanceKm: 1.8, spilloverShare: 0.60, junctionName: 'Junction J5 (North Underpass)' },
      { targetId: 'R08', distanceKm: 3.1, spilloverShare: 0.40, junctionName: 'Junction J9 (Silicon Node)' }
    ],
    activeIncident: null,
    historicalFactors: [0.25, 0.2, 0.2, 0.3, 0.5, 0.8, 1.1, 1.2, 1.0, 0.85, 0.8, 0.85, 0.9, 0.95, 1.0, 1.1, 1.25, 1.3, 1.1, 0.9, 0.7, 0.5, 0.4, 0.3]
  },
  {
    id: 'R19',
    code: 'R19',
    name: 'Greenway Bypass Corridor',
    category: 'EXPRESSWAY',
    freeFlowSpeed: 60,
    currentSpeed: 54,
    speedTrend: +1.0,
    capacity: 5200,
    arrivalRate: 1950,
    currentQueue: 40,
    lengthKm: 4.5,
    lanes: 4,
    coordinates: { x: 320, y: 390 },
    connectedRoads: [
      { targetId: 'R20', distanceKm: 2.5, spilloverShare: 0.50, junctionName: 'Junction J8 (Lake Interchange)' },
      { targetId: 'R01', distanceKm: 3.0, spilloverShare: 0.50, junctionName: 'Junction J11 (South Gate)' }
    ],
    activeIncident: null,
    historicalFactors: [0.3, 0.2, 0.2, 0.2, 0.3, 0.5, 0.7, 0.85, 0.9, 0.8, 0.75, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0, 0.85, 0.7, 0.55, 0.45, 0.35, 0.3]
  },
  {
    id: 'R21',
    code: 'R21',
    name: 'Metro Station Underpass',
    category: 'COLLECTOR',
    freeFlowSpeed: 35,
    currentSpeed: 11,
    speedTrend: -5.0,
    capacity: 2200,
    arrivalRate: 2050,
    currentQueue: 510,
    lengthKm: 1.4,
    lanes: 2,
    coordinates: { x: 640, y: 150 },
    connectedRoads: [
      { targetId: 'R03', distanceKm: 2.2, spilloverShare: 0.70, junctionName: 'Junction J12 (Airport Link)' },
      { targetId: 'R08', distanceKm: 1.5, spilloverShare: 0.30, junctionName: 'Junction J9 (Silicon Node)' }
    ],
    activeIncident: null,
    historicalFactors: [0.2, 0.15, 0.15, 0.2, 0.4, 0.7, 1.0, 1.25, 1.2, 0.9, 0.8, 0.8, 0.85, 0.9, 0.95, 1.05, 1.2, 1.35, 1.2, 0.95, 0.7, 0.5, 0.35, 0.25]
  },
  {
    id: 'R16',
    code: 'R16',
    name: 'Tech Park Link Road',
    category: 'COLLECTOR',
    freeFlowSpeed: 40,
    currentSpeed: 28,
    speedTrend: -1.5,
    capacity: 3100,
    arrivalRate: 1800,
    currentQueue: 190,
    lengthKm: 2.0,
    lanes: 3,
    coordinates: { x: 290, y: 230 },
    connectedRoads: [
      { targetId: 'R17', distanceKm: 1.8, spilloverShare: 0.60, junctionName: 'Junction J2 (Tech Gate)' },
      { targetId: 'R05', distanceKm: 2.4, spilloverShare: 0.40, junctionName: 'Junction J14 (Campus North)' }
    ],
    activeIncident: null,
    historicalFactors: [0.2, 0.2, 0.2, 0.2, 0.3, 0.6, 0.9, 1.15, 1.2, 0.9, 0.8, 0.8, 0.85, 0.9, 0.95, 1.05, 1.2, 1.25, 1.05, 0.8, 0.6, 0.4, 0.3, 0.2]
  },
  {
    id: 'R01',
    code: 'R01',
    name: 'Central Boulevard East',
    category: 'ARTERIAL',
    freeFlowSpeed: 45,
    currentSpeed: 38,
    speedTrend: +0.5,
    capacity: 4200,
    arrivalRate: 2100,
    currentQueue: 110,
    lengthKm: 4.1,
    lanes: 4,
    coordinates: { x: 480, y: 360 },
    connectedRoads: [
      { targetId: 'R17', distanceKm: 2.9, spilloverShare: 0.45, junctionName: 'Junction J1 (Central Hub)' },
      { targetId: 'R23', distanceKm: 2.1, spilloverShare: 0.55, junctionName: 'Junction J3 (Civic Square)' }
    ],
    activeIncident: null,
    historicalFactors: [0.3, 0.2, 0.2, 0.2, 0.4, 0.7, 0.9, 1.1, 1.15, 0.95, 0.85, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2, 1.25, 1.1, 0.85, 0.65, 0.5, 0.4, 0.3]
  },
  {
    id: 'R02',
    code: 'R02',
    name: 'Financial Hub Expressway',
    category: 'EXPRESSWAY',
    freeFlowSpeed: 65,
    currentSpeed: 44,
    speedTrend: -2.0,
    capacity: 5600,
    arrivalRate: 3400,
    currentQueue: 320,
    lengthKm: 5.2,
    lanes: 4,
    coordinates: { x: 570, y: 310 },
    connectedRoads: [
      { targetId: 'R18', distanceKm: 3.4, spilloverShare: 0.50, junctionName: 'Junction J6 (Fintech Plaza)' },
      { targetId: 'R01', distanceKm: 2.7, spilloverShare: 0.50, junctionName: 'Junction J1 (Central Hub)' }
    ],
    activeIncident: null,
    historicalFactors: [0.25, 0.2, 0.2, 0.3, 0.5, 0.8, 1.15, 1.3, 1.25, 1.0, 0.9, 0.9, 0.95, 1.0, 1.05, 1.15, 1.3, 1.35, 1.15, 0.9, 0.7, 0.5, 0.35, 0.25]
  },
  {
    id: 'R03',
    code: 'R03',
    name: 'Airport Link Superway',
    category: 'EXPRESSWAY',
    freeFlowSpeed: 70,
    currentSpeed: 62,
    speedTrend: +0.2,
    capacity: 6000,
    arrivalRate: 2300,
    currentQueue: 50,
    lengthKm: 6.8,
    lanes: 4,
    coordinates: { x: 720, y: 110 },
    connectedRoads: [
      { targetId: 'R21', distanceKm: 2.2, spilloverShare: 0.40, junctionName: 'Junction J12 (Airport Link)' }
    ],
    activeIncident: null,
    historicalFactors: [0.4, 0.35, 0.3, 0.35, 0.5, 0.7, 0.85, 0.95, 1.0, 0.9, 0.85, 0.85, 0.9, 0.9, 0.95, 1.0, 1.05, 1.1, 1.0, 0.85, 0.75, 0.6, 0.5, 0.45]
  },
  {
    id: 'R04',
    code: 'R04',
    name: 'Outer Ring West Expressway',
    category: 'RING_ROAD',
    freeFlowSpeed: 60,
    currentSpeed: 16,
    speedTrend: -3.5,
    capacity: 4500,
    arrivalRate: 2800,
    currentQueue: 820,
    lengthKm: 6.2,
    lanes: 3,
    coordinates: { x: 160, y: 310 },
    connectedRoads: [
      { targetId: 'R16', distanceKm: 3.1, spilloverShare: 0.45, junctionName: 'Junction J16 (West Gate)' },
      { targetId: 'R19', distanceKm: 2.8, spilloverShare: 0.55, junctionName: 'Junction J17 (Ring Flyover)' }
    ],
    activeIncident: INITIAL_INCIDENTS[1],
    historicalFactors: [0.3, 0.25, 0.2, 0.25, 0.4, 0.7, 0.95, 1.1, 1.15, 0.95, 0.85, 0.8, 0.85, 0.9, 0.95, 1.05, 1.15, 1.25, 1.1, 0.85, 0.7, 0.5, 0.4, 0.3]
  },
  {
    id: 'R05',
    code: 'R05',
    name: 'University Academic Avenue',
    category: 'COLLECTOR',
    freeFlowSpeed: 35,
    currentSpeed: 30,
    speedTrend: +0.8,
    capacity: 2800,
    arrivalRate: 1400,
    currentQueue: 75,
    lengthKm: 2.1,
    lanes: 2,
    coordinates: { x: 230, y: 150 },
    connectedRoads: [
      { targetId: 'R16', distanceKm: 2.4, spilloverShare: 0.50, junctionName: 'Junction J14 (Campus North)' }
    ],
    activeIncident: null,
    historicalFactors: [0.15, 0.1, 0.1, 0.15, 0.3, 0.6, 1.0, 1.2, 1.0, 0.8, 0.75, 0.7, 0.75, 0.8, 0.9, 1.1, 1.2, 1.1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.15]
  },
  {
    id: 'R08',
    code: 'R08',
    name: 'Silicon Parkway North',
    category: 'ARTERIAL',
    freeFlowSpeed: 50,
    currentSpeed: 34,
    speedTrend: -1.2,
    capacity: 4200,
    arrivalRate: 2350,
    currentQueue: 180,
    lengthKm: 3.9,
    lanes: 3,
    coordinates: { x: 610, y: 70 },
    connectedRoads: [
      { targetId: 'R18', distanceKm: 3.1, spilloverShare: 0.50, junctionName: 'Junction J9 (Silicon Node)' },
      { targetId: 'R21', distanceKm: 1.5, spilloverShare: 0.50, junctionName: 'Junction J9 (Silicon Node)' }
    ],
    activeIncident: null,
    historicalFactors: [0.2, 0.2, 0.15, 0.2, 0.4, 0.7, 1.1, 1.25, 1.15, 0.9, 0.85, 0.85, 0.9, 0.95, 1.05, 1.15, 1.25, 1.3, 1.1, 0.85, 0.65, 0.45, 0.3, 0.2]
  },
  {
    id: 'R12',
    code: 'R12',
    name: 'Metro Terminal West',
    category: 'COLLECTOR',
    freeFlowSpeed: 35,
    currentSpeed: 29,
    speedTrend: +2.5,
    capacity: 2900,
    arrivalRate: 1550,
    currentQueue: 80,
    lengthKm: 1.9,
    lanes: 3,
    coordinates: { x: 190, y: 440 },
    connectedRoads: [
      { targetId: 'R04', distanceKm: 2.2, spilloverShare: 0.60, junctionName: 'Junction J19 (Terminal Link)' },
      { targetId: 'R19', distanceKm: 2.6, spilloverShare: 0.40, junctionName: 'Junction J20 (West Diverter)' }
    ],
    activeIncident: INITIAL_INCIDENTS[2],
    historicalFactors: [0.2, 0.15, 0.15, 0.2, 0.4, 0.75, 1.1, 1.2, 1.05, 0.85, 0.8, 0.8, 0.85, 0.9, 0.95, 1.05, 1.15, 1.2, 1.0, 0.8, 0.6, 0.4, 0.3, 0.2]
  },
  {
    id: 'R20',
    code: 'R20',
    name: 'Lakeview Flyover Corridor',
    category: 'ARTERIAL',
    freeFlowSpeed: 55,
    currentSpeed: 48,
    speedTrend: +0.4,
    capacity: 4600,
    arrivalRate: 2100,
    currentQueue: 95,
    lengthKm: 3.8,
    lanes: 3,
    coordinates: { x: 420, y: 470 },
    connectedRoads: [
      { targetId: 'R19', distanceKm: 2.5, spilloverShare: 0.50, junctionName: 'Junction J8 (Lake Interchange)' },
      { targetId: 'R01', distanceKm: 3.2, spilloverShare: 0.50, junctionName: 'Junction J21 (South Spine)' }
    ],
    activeIncident: null,
    historicalFactors: [0.25, 0.2, 0.2, 0.25, 0.4, 0.65, 0.85, 1.05, 1.1, 0.9, 0.85, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2, 1.25, 1.05, 0.8, 0.6, 0.45, 0.35, 0.25]
  },
  {
    id: 'R23',
    code: 'R23',
    name: 'Civic Center Boulevard',
    category: 'ARTERIAL',
    freeFlowSpeed: 45,
    currentSpeed: 36,
    speedTrend: -0.8,
    capacity: 3800,
    arrivalRate: 2150,
    currentQueue: 140,
    lengthKm: 3.0,
    lanes: 3,
    coordinates: { x: 610, y: 430 },
    connectedRoads: [
      { targetId: 'R01', distanceKm: 2.1, spilloverShare: 0.55, junctionName: 'Junction J3 (Civic Square)' },
      { targetId: 'R02', distanceKm: 2.8, spilloverShare: 0.45, junctionName: 'Junction J22 (East Arc)' }
    ],
    activeIncident: null,
    historicalFactors: [0.2, 0.15, 0.15, 0.2, 0.4, 0.7, 0.95, 1.15, 1.2, 0.95, 0.85, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2, 1.25, 1.1, 0.85, 0.65, 0.45, 0.3, 0.2]
  }
];

export const CITY_OVERVIEW = {
  name: 'Smart Urban Corridor (Sector 4 & 5)',
  totalRoads: 14,
  networkLengthKm: 48.6,
  totalCapacityVehHr: 58800,
  averageCongestionIndex: 68.4,
  lastUpdated: '18:59:00 IST',
};
