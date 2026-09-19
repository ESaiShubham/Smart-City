import React from 'react';
import { TRAFFIC_LEVELS } from '../../types/traffic';

export const MapLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
      <span className="text-[11px] font-medium text-slate-400">Legend:</span>
      {Object.values(TRAFFIC_LEVELS).map((item) => (
        <div key={item.level} className="flex items-center gap-1.5">
          <span>{item.emoji}</span>
          <span className="text-slate-300 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
