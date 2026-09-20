import React from 'react';
import { TRAFFIC_LEVELS, TrafficLevel } from '../../types/traffic';

export const MapLegend: React.FC = () => {
  const levels: TrafficLevel[] = ['green', 'yellow', 'orange', 'red'];

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-[#131926] border border-[#20293a] px-3 py-1.5 rounded-lg">
      <span className="text-slate-400 font-medium">Legend:</span>
      {levels.map((lvl) => {
        const config = TRAFFIC_LEVELS[lvl];
        return (
          <div key={lvl} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-slate-300 font-medium">{config.label}</span>
            <span className="text-[10px] text-slate-400">({config.speedRange})</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
        <span className="w-2.5 h-0.5 border-t-2 border-dashed border-orange-400" />
        <span className="text-orange-300 text-[11px]">Ripple Impact</span>
      </div>
    </div>
  );
};
