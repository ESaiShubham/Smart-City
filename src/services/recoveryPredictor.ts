import type { Road, RecoveryPrediction } from '../types/traffic';

/**
 * Predicts recovery time for traffic to return to normal after an incident is cleared.
 *
 * Basic Logic:
 *   Road Capacity - Arrival Rate
 *             ↓
 *      Net Clearing Rate
 *             ↓
 *         Queue Size
 *             ↓
 *       Recovery Time
 */
export function predictRecoveryTime(
  road: Road,
  customParams?: {
    overrideQueue?: number;
    overrideCapacity?: number;
    overrideArrivalRate?: number;
  },
  baseTime: Date = new Date()
): RecoveryPrediction {
  const queue = customParams?.overrideQueue ?? road.currentQueue;
  const capacity = customParams?.overrideCapacity ?? road.capacity;
  const arrivalRate = customParams?.overrideArrivalRate ?? road.arrivalRate;

  const netClearingRateHr = capacity - arrivalRate;
  const netClearingRateMin = netClearingRateHr / 60;

  // Unrecoverable condition: Arrival rate exceeds or matches road capacity
  if (netClearingRateHr <= 0) {
    return {
      roadId: road.id,
      roadName: road.name,
      currentQueue: queue,
      roadCapacity: capacity,
      arrivalRate,
      netClearingRateHr,
      netClearingRateMin,
      recoveryTimeMinutes: null,
      isUnrecoverable: true,
      warningMessage: `⚠️ Critical Bottleneck: Inflow arrival rate (${arrivalRate.toLocaleString()} veh/hr) equals or exceeds road capacity (${capacity.toLocaleString()} veh/hr). Queue will compound without upstream traffic diversion.`,
      expectedNormalTime: null,
      drainageProgressPercent: 0,
      incidentClearedTimestamp: baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // Queue is already empty
  if (queue <= 0) {
    return {
      roadId: road.id,
      roadName: road.name,
      currentQueue: 0,
      roadCapacity: capacity,
      arrivalRate,
      netClearingRateHr,
      netClearingRateMin,
      recoveryTimeMinutes: 0,
      isUnrecoverable: false,
      warningMessage: null,
      expectedNormalTime: baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      drainageProgressPercent: 100,
      incidentClearedTimestamp: baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // Calculate recovery time in minutes
  const recoveryMinutesExact = queue / netClearingRateMin;
  const recoveryTimeMinutes = Math.ceil(recoveryMinutesExact);

  // Compute expected normal traffic time
  const normalDate = new Date(baseTime.getTime() + recoveryTimeMinutes * 60 * 1000);
  const expectedNormalTime = normalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const clearedTimestamp = baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    roadId: road.id,
    roadName: road.name,
    currentQueue: queue,
    roadCapacity: capacity,
    arrivalRate,
    netClearingRateHr,
    netClearingRateMin: Number(netClearingRateMin.toFixed(2)),
    recoveryTimeMinutes,
    isUnrecoverable: false,
    warningMessage: null,
    expectedNormalTime,
    drainageProgressPercent: Math.min(100, Math.max(0, Math.round((netClearingRateHr / capacity) * 100))),
    incidentClearedTimestamp: clearedTimestamp,
  };
}

/**
 * Calculates comparative recovery times under active tactical diversions
 */
export function calculateDiversionScenarios(
  _road: Road,
  baseQueue: number,
  baseCapacity: number,
  baseArrivalRate: number
) {
  const diversionPercentages = [10, 20, 30, 40];
  return diversionPercentages.map((pct) => {
    const divertedVehicles = Math.round(baseArrivalRate * (pct / 100));
    const newArrival = baseArrivalRate - divertedVehicles;
    const netRateMin = (baseCapacity - newArrival) / 60;
    const recoveryMins = netRateMin > 0 ? Math.ceil(baseQueue / netRateMin) : null;
    return {
      percentage: pct,
      divertedVolume: divertedVehicles,
      newArrivalRate: newArrival,
      recoveryMinutes: recoveryMins,
      minutesSaved: recoveryMins !== null ? Math.max(0, Math.ceil(baseQueue / ((baseCapacity - baseArrivalRate) / 60)) - recoveryMins) : 0,
    };
  });
}
