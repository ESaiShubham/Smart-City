import React, { useState } from 'react';
import { RecoveryData, RoadStatus } from '../../types/traffic';
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface RecoveryViewProps {
  road: RoadStatus | null;
  recoveryData: RecoveryData | null;
  onRefreshRecovery: (queueOverride?: number, arrivalOverride?: number) => void;
}

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  road,
  recoveryData,
  onRefreshRecovery,
}) => {
  const [isCleared, setIsCleared] = useState<boolean>(false);
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [currentQueue, setCurrentQueue] = useState<number>(1240);

  if (!road) return null;

  const roadCapacity = 4800;
  const arrivalRate = 1700;
  const netClearingRate = roadCapacity - arrivalRate; // 3,100
  const netPerMin = (netClearingRate / 60).toFixed(2); // 51.67
  const recoveryMinutes = Math.round(currentQueue / (netClearingRate / 60)); // 24 min

  const handleToggleCleared = () => {
    setIsCleared(!isCleared);
    if (!isCleared) {
      setCurrentQueue(0);
      onRefreshRecovery(0, arrivalRate);
    } else {
      setCurrentQueue(1240);
      onRefreshRecovery(1240, arrivalRate);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCurrentQueue(val);
    onRefreshRecovery(val, arrivalRate);
  };

  return (
    <div className="bg-[#0d121f] border border-[#1b2333] rounded-xl p-3.5 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱️</span>
            <h3 className="text-xs font-bold text-white tracking-wide">
              2. Recovery-Time Prediction
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Estimates how long congestion will take to clear after an incident is removed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleCleared}
            className="px-3 py-1 bg-[#131926] hover:bg-[#1a2234] border border-[#20293a] text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isCleared ? 'Incident Cleared' : 'Mark Incident Cleared'}</span>
          </button>

          <button
            onClick={() => setShowSlider(!showSlider)}
            className={`p-1.5 rounded-lg border transition ${
              showSlider
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-[#131926] text-slate-400 border-[#20293a] hover:text-white'
            }`}
            title="Adjust queue slider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Slider if toggled */}
      {showSlider && (
        <div className="bg-[#131926] border border-[#20293a] rounded-lg p-2.5 space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Simulate Queue Length:</span>
            <span className="font-bold text-cyan-400">{currentQueue.toLocaleString()} vehicles</span>
          </div>
          <input
            type="range"
            min="0"
            max="3000"
            step="50"
            value={currentQueue}
            onChange={handleSliderChange}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      )}

      {/* Top 3 Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#131926] border border-[#20293a] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Current queue</div>
          <div className="text-sm font-extrabold text-white mt-1">
            {currentQueue.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">vehicles</span>
          </div>
        </div>

        <div className="bg-[#131926] border border-[#20293a] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Road capacity</div>
          <div className="text-sm font-extrabold text-white mt-1">
            {roadCapacity.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">vehicles/hour</span>
          </div>
        </div>

        <div className="bg-[#131926] border border-[#20293a] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Arrival rate</div>
          <div className="text-sm font-extrabold text-white mt-1">
            {arrivalRate.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">vehicles/hour</span>
          </div>
        </div>
      </div>

      {/* Bottom Stats Banner */}
      <div className="bg-[#131926] border border-[#20293a] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          {/* Estimated recovery */}
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>⏱️</span> Estimated recovery
            </div>
            <div className="text-base font-extrabold text-white mt-0.5">
              {recoveryMinutes} minutes
            </div>
          </div>

          {/* Expected normal traffic */}
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Expected normal traffic
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">
              08:31 AM
            </div>
          </div>
        </div>

        {/* Net Clearing Rate */}
        <div className="text-right text-xs">
          <span className="text-slate-400">Net Clearing Rate: </span>
          <strong className="text-white font-mono">{netClearingRate.toLocaleString()} veh/hr</strong>
          <span className="text-slate-400"> ({netPerMin} v/min)</span>
        </div>
      </div>

      {/* Formula Footer */}
      <div className="text-[10px] text-slate-500">
        Road Capacity - Arrival Rate = Net Clearing Rate → Queue Size ÷ Recovery Time
      </div>
    </div>
  );
};
