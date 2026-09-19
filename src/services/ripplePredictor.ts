import type { Road, RipplePrediction, RippleCascadeNode, TrafficLevel } from '../types/traffic';
import { TRAFFIC_LEVELS } from '../types/traffic';
import { classifyTrafficLevel } from './timelinePredictor';

/**
 * Ripple Prediction Engine:
 * Predicts spatial-temporal congestion spillover across the road network graph.
 */
export function predictRipplePropagation(
  sourceRoad: Road,
  allRoads: Road[],
  propagationSpeedKmh: number = 18
): RipplePrediction {
  const roadMap = new Map<string, Road>(allRoads.map((r) => [r.id, r]));
  const sourceLevel = classifyTrafficLevel(sourceRoad.currentSpeed, sourceRoad.freeFlowSpeed);

  // Compute overflow / spillover backlog from source road
  const isCongested = sourceLevel === 'CRITICAL' || sourceLevel === 'HEAVY' || sourceRoad.currentQueue > 300;
  const queueVolume = sourceRoad.currentQueue;
  const overflowDemand = isCongested ? Math.round(queueVolume * 0.75 + (sourceRoad.arrivalRate * 0.35)) : 0;

  const cascadeChain: RippleCascadeNode[] = [];
  const atRiskRoads: RippleCascadeNode[] = [];
  const safeRoads: RippleCascadeNode[] = [];

  // 1. Direct downstream/upstream connections from source road
  sourceRoad.connectedRoads.forEach((conn) => {
    const targetRoad = roadMap.get(conn.targetId);
    if (!targetRoad) return;

    // Shockwave travel time: Time = (Distance / Speed) * 60 minutes
    const waveDelayMinutes = Math.round((conn.distanceKm / propagationSpeedKmh) * 60);
    const nodeCumulativeMins = waveDelayMinutes;

    // Calculate added spillover traffic load
    const spilloverTraffic = Math.round(overflowDemand * conn.spilloverShare);
    const newLoadVehiclesHr = targetRoad.arrivalRate + spilloverTraffic;
    const spareCapacityVehiclesHr = targetRoad.capacity - newLoadVehiclesHr;
    const spareCapacityPercent = Math.round((spareCapacityVehiclesHr / targetRoad.capacity) * 100);

    // Predict new speed under spillover pressure
    let predictedSpeed: number;
    let predictedLevel: TrafficLevel;

    if (spareCapacityPercent > 35 && targetRoad.currentSpeed > targetRoad.freeFlowSpeed * 0.7) {
      predictedSpeed = Math.max(targetRoad.freeFlowSpeed * 0.8, targetRoad.currentSpeed - 3);
      predictedLevel = 'FREE';
    } else if (spareCapacityPercent > 10) {
      predictedSpeed = Math.round(targetRoad.freeFlowSpeed * 0.45);
      predictedLevel = 'HEAVY';
    } else {
      predictedSpeed = Math.min(12, Math.round(targetRoad.freeFlowSpeed * 0.25));
      predictedLevel = 'CRITICAL';
    }

    const isSafe = predictedLevel === 'FREE' || spareCapacityPercent >= 35;
    const config = TRAFFIC_LEVELS[predictedLevel];

    const node: RippleCascadeNode = {
      roadId: targetRoad.id,
      roadName: targetRoad.name,
      junctionName: conn.junctionName,
      distanceKm: conn.distanceKm,
      waveDelayMinutes,
      cumulativeMinutes: nodeCumulativeMins,
      predictedLevel,
      levelEmoji: config.emoji,
      predictedSpeed,
      newLoadVehiclesHr,
      capacity: targetRoad.capacity,
      spareCapacityVehiclesHr,
      spareCapacityPercent,
      isSafe,
      statusNote: isSafe
        ? `Safe corridor: ${spareCapacityPercent}% spare capacity (${spareCapacityVehiclesHr.toLocaleString()} veh/hr available).`
        : `At-Risk: Inflow surges to ${newLoadVehiclesHr.toLocaleString()} veh/hr, degrading speeds to ${predictedSpeed} km/h.`,
    };

    if (isSafe) {
      safeRoads.push(node);
    } else {
      atRiskRoads.push(node);
      cascadeChain.push(node);

      // 2. Secondary Cascade (e.g. R18 -> R21 as in README)
      targetRoad.connectedRoads.forEach((secondConn) => {
        if (secondConn.targetId === sourceRoad.id) return;
        const secondTarget = roadMap.get(secondConn.targetId);
        if (!secondTarget) return;

        const secondWaveDelay = Math.round((secondConn.distanceKm / propagationSpeedKmh) * 60);
        const secondCumulative = nodeCumulativeMins + secondWaveDelay;
        const secondarySpillover = Math.round(spilloverTraffic * secondConn.spilloverShare * 0.8);
        const secNewLoad = secondTarget.arrivalRate + secondarySpillover;
        const secSpareCap = secondTarget.capacity - secNewLoad;
        const secSparePct = Math.round((secSpareCap / secondTarget.capacity) * 100);

        let secLevel: TrafficLevel = 'HEAVY';
        let secSpeed = Math.round(secondTarget.freeFlowSpeed * 0.4);

        if (secSparePct <= 10 || secondTarget.capacity < 2500) {
          secLevel = 'CRITICAL';
          secSpeed = Math.min(10, Math.round(secondTarget.freeFlowSpeed * 0.25));
        }

        const secConfig = TRAFFIC_LEVELS[secLevel];
        const secondNode: RippleCascadeNode = {
          roadId: secondTarget.id,
          roadName: secondTarget.name,
          junctionName: secondConn.junctionName,
          distanceKm: secondConn.distanceKm,
          waveDelayMinutes: secondWaveDelay,
          cumulativeMinutes: secondCumulative,
          predictedLevel: secLevel,
          levelEmoji: secConfig.emoji,
          predictedSpeed: secSpeed,
          newLoadVehiclesHr: secNewLoad,
          capacity: secondTarget.capacity,
          spareCapacityVehiclesHr: secSpareCap,
          spareCapacityPercent: secSparePct,
          isSafe: false,
          statusNote: `Secondary ripple: Congestion spills through ${secondConn.junctionName} in +${secondCumulative} min.`,
        };

        cascadeChain.push(secondNode);
        atRiskRoads.push(secondNode);
      });
    }
  });

  // Summary generation
  let summaryText = '';
  if (!isCongested) {
    summaryText = `Corridor ${sourceRoad.code} operating within stable margins. No immediate ripple spillover detected onto adjacent segments.`;
  } else {
    const atRiskCodes = atRiskRoads.map((r) => `${r.roadId} (${r.predictedLevel})`).join(', ');
    const safeCodes = safeRoads.map((r) => `${r.roadId} (${r.spareCapacityPercent}% spare)`).join(', ');
    summaryText = `Congestion wave propagating at ${propagationSpeedKmh} km/h. At-risk corridors: ${atRiskCodes || 'None'}. Recommended diversion routes: ${safeCodes || 'None'}.`;
  }

  return {
    sourceRoadId: sourceRoad.id,
    sourceRoadName: sourceRoad.name,
    sourceLevel,
    propagationSpeedKmh,
    cascadeChain,
    atRiskRoads,
    safeRoads,
    summaryText,
  };
}
