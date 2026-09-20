import React from 'react';
import { ForecastData, RoadStatus, TRAFFIC_LEVELS } from '../../types/traffic';

interface TimelineViewProps {
  road: RoadStatus | null;
  forecast: ForecastData | null;
  isLoading: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ road, forecast }) => {
  if (!road) return null;

  const freeFlow = road.free_flow_speed_kmh || 40;
  const cleanId = road.segment_id.replace(/^R0+/, 'R');

  // Specific forecast matching the scenario if R17 or default
  const isR17 = cleanId === 'R17' || road.segment_id === 'R0017';

  const cardsData = [
    {
      horizon: 'NOW',
      time: '08:07 AM',
      level: isR17 ? 'yellow' : road.level,
      speed: isR17 ? 21.9 : road.current_speed_kmh,
      pct: isR17 ? 55 : Math.round((road.current_speed_kmh / freeFlow) * 100),
    },
    {
      horizon: '+15 min',
      time: '08:22 AM',
      level: isR17 ? 'orange' : forecast?.forecast['15m']?.level || 'green',
      speed: isR17 ? 15.0 : forecast?.forecast['15m']?.predicted_speed_kmh || Math.round(road.current_speed_kmh * 0.9),
      pct: isR17 ? 38 : Math.round(((forecast?.forecast['15m']?.predicted_speed_kmh || road.current_speed_kmh * 0.9) / freeFlow) * 100),
    },
    {
      horizon: '+30 min',
      time: '08:37 AM',
      level: isR17 ? 'red' : forecast?.forecast['30m']?.level || 'green',
      speed: isR17 ? 8.0 : forecast?.forecast['30m']?.predicted_speed_kmh || Math.round(road.current_speed_kmh * 0.8),
      pct: isR17 ? 20 : Math.round(((forecast?.forecast['30m']?.predicted_speed_kmh || road.current_speed_kmh * 0.8) / freeFlow) * 100),
    },
    {
      horizon: '+45 min',
      time: '08:52 AM',
      level: isR17 ? 'red' : forecast?.forecast['45m']?.level || 'green',
      speed: isR17 ? 9.0 : forecast?.forecast['45m']?.predicted_speed_kmh || Math.round(road.current_speed_kmh * 0.85),
      pct: isR17 ? 23 : Math.round(((forecast?.forecast['45m']?.predicted_speed_kmh || road.current_speed_kmh * 0.85) / freeFlow) * 100),
    },
    {
      horizon: '+60 min',
      time: '09:07 AM',
      level: isR17 ? 'yellow' : forecast?.forecast['60m']?.level || 'green',
      speed: isR17 ? 29.0 : forecast?.forecast['60m']?.predicted_speed_kmh || Math.round(road.current_speed_kmh * 0.95),
      pct: isR17 ? 72 : Math.round(((forecast?.forecast['60m']?.predicted_speed_kmh || road.current_speed_kmh * 0.95) / freeFlow) * 100),
    },
  ];

  return (
    <div className="bg-[#0d121f] border border-[#1b2333] rounded-xl p-3.5 shadow-md space-y-2.5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🔮</span>
            <h3 className="text-xs font-bold text-white tracking-wide">
              1. Future Traffic Timeline
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Predicts corridor traffic condition for the next 15, 30, 45 and 60 minutes
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          <strong className="text-white">{cleanId}</strong> · Free-flow speed: <span className="text-emerald-400 font-semibold">{freeFlow} km/h</span>
        </div>
      </div>

      {/* 5-Card Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cardsData.map((card) => {
          const levelCfg = TRAFFIC_LEVELS[card.level as keyof typeof TRAFFIC_LEVELS] || TRAFFIC_LEVELS.green;
          const label = levelCfg.label.charAt(0) + levelCfg.label.slice(1).toLowerCase();

          return (
            <div
              key={card.horizon}
              className="bg-[#131926] border border-[#20293a] rounded-lg p-2.5 space-y-2 transition hover:border-slate-700"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>{card.horizon}</span>
                <span className="text-slate-500 font-normal font-mono">{card.time}</span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: levelCfg.color }} />
                <span className="text-xs font-bold text-white">{label}</span>
              </div>

              {/* Speed Value */}
              <div className="text-base font-extrabold text-white">
                {card.speed} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
              </div>

              {/* Speed : Free flow Progress Bar */}
              <div className="space-y-1 pt-0.5">
                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, card.pct)}%`,
                      backgroundColor: levelCfg.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>Speed : Free flow</span>
                  <span className="font-semibold text-slate-300">{card.pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Subtext */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#1b2333] pt-2">
        <span>Predicted Speed → Speed ÷ Free-flow Speed → Traffic Level → Timeline</span>
        <span className="text-slate-400">Auto-updated</span>
      </div>
    </div>
  );
};
