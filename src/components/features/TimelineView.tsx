import React from 'react';
import { useTraffic } from '../../context/TrafficContext';
import { TRAFFIC_LEVELS } from '../../types/traffic';

export const TimelineView: React.FC = () => {
  const { selectedRoad, timelinePredictions } = useTraffic();

  return (
    <div className="bg-[#131926] border border-[#20293a] rounded-xl p-4 lg:p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#20293a] pb-3">
        <div>
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span>🔮 1. Future Traffic Timeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Predicts corridor traffic condition for the next 15, 30, 45 and 60 minutes
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#182030] px-3 py-1 rounded-md border border-[#20293a]">
          <span className="text-slate-400 font-semibold">{selectedRoad.code}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Free-flow speed:</span>
          <span className="text-emerald-400 font-bold">{selectedRoad.freeFlowSpeed} km/h</span>
        </div>
      </div>

      {/* 5-Step Timeline List / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {timelinePredictions.map((step) => {
          const config = TRAFFIC_LEVELS[step.level];
          const ratioPercent = Math.round(step.speedRatio * 100);

          return (
            <div
              key={step.offsetMinutes}
              className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                step.level === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/25' :
                step.level === 'HEAVY' ? 'bg-orange-500/10 border-orange-500/25' :
                step.level === 'MODERATE' ? 'bg-amber-500/10 border-amber-500/25' :
                'bg-emerald-500/10 border-emerald-500/25'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="font-bold text-slate-300">{step.timeLabel}</span>
                  <span className="text-[10px] text-slate-500">{step.clockTime}</span>
                </div>

                <div className="flex items-center gap-1.5 my-1">
                  <span className="text-sm">{step.emoji}</span>
                  <span className={`text-xs font-semibold ${config.textColor}`}>
                    {step.levelLabel}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-xl font-bold font-mono text-white">
                    {step.predictedSpeed}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">km/h</span>
                </div>
              </div>

              {/* Speed Ratio Bar */}
              <div className="mt-2 pt-2 border-t border-[#20293a]">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                  <span>Speed ÷ Free-flow</span>
                  <span className={config.textColor}>{ratioPercent}%</span>
                </div>
                <div className="w-full h-1 bg-[#182030] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      step.level === 'CRITICAL' ? 'bg-rose-500' :
                      step.level === 'HEAVY' ? 'bg-orange-500' :
                      step.level === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ratioPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logic summary bar */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between px-2 pt-1 font-mono">
        <span>Predicted Speed ➔ Speed ÷ Free-flow Speed ➔ Traffic Level ➔ Timeline</span>
        <span className="text-slate-500">Auto-updated</span>
      </div>
    </div>
  );
};
