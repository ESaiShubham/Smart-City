import React from 'react';
import { useTraffic } from '../../context/TrafficContext';
import { TRAFFIC_LEVELS } from '../../types/traffic';
import { classifyTrafficLevel } from '../../services/timelinePredictor';

export const StatusRibbon: React.FC = () => {
  const { roads, selectedRoad, selectedRoadId, setSelectedRoadId } = useTraffic();

  const selectedLevel = classifyTrafficLevel(selectedRoad.currentSpeed, selectedRoad.freeFlowSpeed);
  const selectedConfig = TRAFFIC_LEVELS[selectedLevel];

  return (
    <div className="bg-[#131926] border-b border-[#20293a] px-4 lg:px-8 py-2.5">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Road selector pills */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5">
          <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Corridors:</span>
          {roads.slice(0, 8).map((r) => {
            const isSelected = r.id === selectedRoadId;
            const level = classifyTrafficLevel(r.currentSpeed, r.freeFlowSpeed);
            const dotColor = 
              level === 'FREE' ? 'bg-emerald-400' :
              level === 'MODERATE' ? 'bg-amber-400' :
              level === 'HEAVY' ? 'bg-orange-400' : 'bg-rose-400';

            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoadId(r.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#182030] text-slate-300 hover:bg-[#20293a]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span>{r.code}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Road Status Details */}
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-medium">{selectedRoad.name}</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-white font-semibold">
            {selectedRoad.currentSpeed} km/h
          </span>
          <span className="text-slate-500 text-[11px]">
            / {selectedRoad.freeFlowSpeed} km/h
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${selectedConfig.badgeClass}`}>
            {selectedConfig.emoji} {selectedConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
};
