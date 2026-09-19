import React, { useState } from 'react';
import { useTraffic } from '../../context/TrafficContext';
import { CheckCircle2, AlertOctagon, SlidersHorizontal } from 'lucide-react';

export const RecoveryView: React.FC = () => {
  const { 
    selectedRoad, 
    recoveryPrediction, 
    clearIncident, 
    updateRoadParams, 
    resetCustomParams,
    customParams 
  } = useTraffic();

  const [showAdjust, setShowAdjust] = useState(false);

  const currentQueue = customParams.overrideQueue ?? selectedRoad.currentQueue;
  const currentCapacity = customParams.overrideCapacity ?? selectedRoad.capacity;
  const currentArrival = customParams.overrideArrivalRate ?? selectedRoad.arrivalRate;

  return (
    <div className="bg-[#131926] border border-[#20293a] rounded-xl p-4 lg:p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#20293a] pb-3">
        <div>
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span>🔄 2. Recovery-Time Prediction</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Estimates how long congestion will take to clear after an incident is removed
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedRoad.activeIncident && !selectedRoad.activeIncident.isCleared ? (
            <button
              onClick={() => clearIncident(selectedRoad.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Incident Cleared</span>
            </button>
          ) : (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              🚨 Incident cleared
            </span>
          )}

          <button
            onClick={() => setShowAdjust(!showAdjust)}
            className="p-1.5 rounded-md bg-[#182030] text-slate-400 hover:text-white border border-[#20293a]"
            title="Adjust queue & arrival rate"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Core Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#182030] border border-[#20293a]">
          <span className="text-[11px] text-slate-400 block mb-1">Current queue</span>
          <div className="text-lg font-bold font-mono text-white">
            {currentQueue.toLocaleString()} <span className="text-xs font-normal text-slate-400">vehicles</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#182030] border border-[#20293a]">
          <span className="text-[11px] text-slate-400 block mb-1">Road capacity</span>
          <div className="text-lg font-bold font-mono text-white">
            {currentCapacity.toLocaleString()} <span className="text-xs font-normal text-slate-400">vehicles/hour</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#182030] border border-[#20293a]">
          <span className="text-[11px] text-slate-400 block mb-1">Arrival rate</span>
          <div className="text-lg font-bold font-mono text-white">
            {currentArrival.toLocaleString()} <span className="text-xs font-normal text-slate-400">vehicles/hour</span>
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {recoveryPrediction.isUnrecoverable ? (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Arrival rate is equal to or greater than road capacity</span>
            <span className="text-slate-300">The system warns that the congestion may not clear without intervention.</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-lg bg-[#182030] border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏱️</span>
            <div>
              <span className="text-xs text-slate-400 block">Estimated recovery</span>
              <span className="text-xl font-bold font-mono text-white">
                {recoveryPrediction.recoveryTimeMinutes} minutes
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#20293a] hidden sm:block" />

          <div className="flex items-center gap-3">
            <span className="text-xl">🟢</span>
            <div>
              <span className="text-xs text-slate-400 block">Expected normal traffic</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {recoveryPrediction.expectedNormalTime || 'In Progress'}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#20293a] hidden sm:block" />

          <div className="text-xs font-mono text-slate-400">
            <span>Net Clearing Rate: </span>
            <span className="text-white font-bold">{recoveryPrediction.netClearingRateHr.toLocaleString()} veh/hr</span>
            <span className="text-slate-500 text-[11px]"> ({recoveryPrediction.netClearingRateMin} v/min)</span>
          </div>
        </div>
      )}

      {/* Sliders for Simulation Adjustment */}
      {showAdjust && (
        <div className="p-3 rounded-lg bg-[#0c1019] border border-[#20293a] flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-medium text-white">Test Diversion / Clearing Parameters:</span>
            <button onClick={resetCustomParams} className="text-blue-400 hover:underline text-[11px]">
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Queue: {currentQueue} veh</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={currentQueue}
                onChange={(e) => updateRoadParams({ queue: Number(e.target.value) })}
                className="w-full accent-blue-500 h-1 bg-[#182030] rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Arrival: {currentArrival} veh/hr</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={currentArrival}
                onChange={(e) => updateRoadParams({ arrivalRate: Number(e.target.value) })}
                className="w-full accent-blue-500 h-1 bg-[#182030] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Logic summary bar */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between px-2 pt-1 font-mono">
        <span>Road Capacity - Arrival Rate ➔ Net Clearing Rate ➔ Queue Size ➔ Recovery Time</span>
      </div>
    </div>
  );
};
