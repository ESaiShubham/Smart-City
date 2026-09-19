import React from 'react';
import { useTraffic } from '../../context/TrafficContext';
import { TRAFFIC_LEVELS } from '../../types/traffic';
import { ArrowDown } from 'lucide-react';

export const RippleView: React.FC = () => {
  const { selectedRoad, ripplePrediction, setSelectedRoadId } = useTraffic();

  return (
    <div className="bg-[#131926] border border-[#20293a] rounded-xl p-4 lg:p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#20293a] pb-3">
        <div>
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span>🌊 3. Ripple Prediction</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Predicts how congestion on one road may affect connected roads
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#182030] px-3 py-1 rounded-md border border-[#20293a]">
          <span>Congestion shockwave speed:</span>
          <span className="text-white font-bold">{ripplePrediction.propagationSpeedKmh} km/h</span>
        </div>
      </div>

      {/* Ripple Cascade Tree & Safe Corridor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cascade Chain */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300">Congestion Spillover Sequence:</span>

          {/* Root Epicenter */}
          <div 
            onClick={() => setSelectedRoadId(selectedRoad.id)}
            className="p-3 rounded-lg bg-[#182030] border border-rose-500/30 flex items-center justify-between cursor-pointer hover:border-rose-500/50 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-white text-sm">{selectedRoad.code}</span>
              <span className="text-xs text-slate-300">({selectedRoad.name})</span>
            </div>
            <span className="text-xs font-medium text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              🔴 Congested now
            </span>
          </div>

          {/* Connected Cascade Nodes */}
          {ripplePrediction.cascadeChain.map((node, index) => {
            const config = TRAFFIC_LEVELS[node.predictedLevel];

            return (
              <React.Fragment key={`${node.roadId}-${index}`}>
                {/* Downward Delay Indicator */}
                <div className="flex items-center gap-2 pl-6 py-0.5 text-xs font-mono text-slate-400">
                  <ArrowDown className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-orange-400 font-bold">+{node.waveDelayMinutes} min</span>
                  <span className="text-slate-500">({node.distanceKm} km)</span>
                </div>

                {/* Impacted Road */}
                <div 
                  onClick={() => setSelectedRoadId(node.roadId)}
                  className="p-3 rounded-lg bg-[#182030] border border-[#20293a] hover:border-blue-500/40 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-white text-sm">{node.roadId}</span>
                    <span className="text-xs text-slate-300">({node.roadName})</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badgeClass}`}>
                    {node.levelEmoji} {config.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Safe Corridor with Spare Capacity */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300">Alternative Safe Corridors:</span>

          {ripplePrediction.safeRoads.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#182030] border border-[#20293a] text-xs text-slate-400">
              No adjacent safe bypass corridors currently detected.
            </div>
          ) : (
            ripplePrediction.safeRoads.map((safe) => (
              <div 
                key={safe.roadId}
                onClick={() => setSelectedRoadId(safe.roadId)}
                className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 flex flex-col gap-2 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{safe.roadId}</span>
                    <span className="text-xs text-slate-300">({safe.roadName})</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Safe
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1 border-t border-emerald-500/15">
                  <span>Spare capacity available:</span>
                  <span className="text-emerald-400 font-bold">{safe.spareCapacityPercent}% ({safe.spareCapacityVehiclesHr.toLocaleString()} veh/hr)</span>
                </div>
              </div>
            ))
          )}

          {/* Logic explanation box */}
          <div className="mt-auto p-3 rounded-lg bg-[#0c1019] border border-[#20293a] text-[11px] text-slate-400 leading-relaxed font-mono">
            <span className="text-slate-300 block mb-1">Basic Logic:</span>
            <span>Congested Road ➔ Extra Traffic ➔ Connected Roads ➔ Calculate New Load ➔ Identify At-Risk Roads ➔ Estimate Arrival Time</span>
          </div>
        </div>
      </div>
    </div>
  );
};
