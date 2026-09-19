import type { Road, TimelineStep, RecoveryPrediction, RipplePrediction, CombinedAdvisory } from '../types/traffic';

/**
 * Synthesizes 🔮 Timeline, 🔄 Recovery, and 🌊 Ripple predictions into a single
 * actionable Simulated Decision-Support Advisory.
 */
export function generateCombinedAdvisory(
  road: Road,
  timeline: TimelineStep[],
  recovery: RecoveryPrediction,
  ripple: RipplePrediction
): CombinedAdvisory {
  const isCritical = timeline.some((t) => t.level === 'CRITICAL') || recovery.isUnrecoverable;
  const isHeavy = timeline.some((t) => t.level === 'HEAVY');

  let severity: 'GREEN' | 'AMBER' | 'ORANGE' | 'RED' = 'GREEN';
  if (isCritical) severity = 'RED';
  else if (isHeavy) severity = 'ORANGE';
  else if (timeline.some((t) => t.level === 'MODERATE')) severity = 'AMBER';

  // 1. How traffic will change
  const nadirStep = [...timeline].sort((a, b) => a.predictedSpeed - b.predictedSpeed)[0];
  const finalStep = timeline[timeline.length - 1];
  const trafficChangeSummary = `Speed expected to bottom out at ${nadirStep.predictedSpeed} km/h (${nadirStep.levelLabel} ${nadirStep.emoji}) at ${nadirStep.timeLabel} (${nadirStep.clockTime}). Trend indicates ${finalStep.trend === 'improving' ? 'progressive recovery reaching ' + finalStep.predictedSpeed + ' km/h by ' + finalStep.timeLabel : 'sustained gridlock pressure over the next 60 minutes'}.`;

  // 2. When congestion may recover
  let recoverySummary = '';
  if (recovery.isUnrecoverable) {
    recoverySummary = `CRITICAL BOTTLENECK: Inflow arrival rate (${recovery.arrivalRate.toLocaleString()} veh/hr) exceeds road clearance capacity. Inflow queue cannot dissipate without immediate upstream diversion.`;
  } else if (recovery.recoveryTimeMinutes === 0) {
    recoverySummary = `Corridor currently cleared. Zero lingering queue detected; traffic flowing at normal capacity.`;
  } else {
    recoverySummary = `Estimated queue clearance time: ${recovery.recoveryTimeMinutes} minutes post-incident removal at net discharge rate of ${recovery.netClearingRateMin} vehicles/min. Expected return to normal traffic condition: ${recovery.expectedNormalTime}.`;
  }

  // 3. Where congestion may spread
  let rippleSummary = '';
  if (ripple.atRiskRoads.length === 0) {
    rippleSummary = `Localized impact only. Connected road network maintains sufficient headroom; zero cross-corridor spillover predicted.`;
  } else {
    const cascadeTrail = ripple.cascadeChain
      .map((n) => `${n.roadId} in +${n.cumulativeMinutes}m (${n.predictedLevel})`)
      .join(' ➔ ');
    const safeTrail = ripple.safeRoads
      .map((s) => `${s.roadId} (${s.spareCapacityPercent}% spare cap)`)
      .join(', ');
    rippleSummary = `Shockwave cascade path: ${cascadeTrail || 'Direct spillover'}. Spillover wave moving at ${ripple.propagationSpeedKmh} km/h. Recommended unburdened bypass routes: ${safeTrail || 'None available'}.`;
  }

  // Recommended Tactical Interventions
  const recommendedActions: string[] = [];
  if (isCritical || isHeavy) {
    recommendedActions.push(`Extend green-phase duration by +28s at ${road.connectedRoads[0]?.junctionName || 'downstream junction'} to accelerate net clearing.`);
    recommendedActions.push(`Activate Variable Message Signs (VMS) on inbound arterials advising 15-20 min transit delays.`);
    if (ripple.safeRoads.length > 0) {
      recommendedActions.push(`Deploy automated diversion vectors routing 25-35% incoming volume onto ${ripple.safeRoads[0].roadId} (${ripple.safeRoads[0].roadName}).`);
    }
    recommendedActions.push(`Dispatch rapid clearance patrol / towing units to safeguard shoulder clearance.`);
  } else {
    recommendedActions.push(`Maintain dynamic adaptive signal cycle (Green-wave baseline).`);
    recommendedActions.push(`Monitor downstream junction thresholds via edge sensor telemetry.`);
  }

  // Diversion Routes
  const diversionRoutes = ripple.safeRoads.map((safe) => ({
    congestedRoad: road.code,
    divertVia: `${safe.roadId} — ${safe.roadName}`,
    spareCapacity: `${safe.spareCapacityPercent}% (${safe.spareCapacityVehiclesHr.toLocaleString()} veh/hr)`,
    timeSaving: `Est. 14-22 min saved`,
  }));

  const headline = isCritical
    ? `🚨 CRITICAL TRAFFIC ADVISORY: Multi-corridor Cascade Alert on ${road.code}`
    : isHeavy
    ? `⚠️ CONGESTION WARNING: Spillover Risk on Connected Nodes of ${road.code}`
    : `ℹ️ NORMAL OPERATIONAL ADVISORY: Free Flow Condition on ${road.code}`;

  return {
    id: `ADV-${road.id}-${Date.now().toString().slice(-4)}`,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    sourceRoadCode: road.code,
    sourceRoadName: road.name,
    severity,
    headline,
    trafficChangeSummary,
    recoverySummary,
    rippleSummary,
    recommendedActions,
    diversionRoutes,
  };
}
