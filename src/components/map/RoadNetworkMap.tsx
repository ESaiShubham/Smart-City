import React, { useState, useMemo } from 'react';
import { useTraffic } from '../../context/TrafficContext';
import type { Road } from '../../types/traffic';
import { TRAFFIC_LEVELS } from '../../types/traffic';
import { classifyTrafficLevel } from '../../services/timelinePredictor';
import { MapLegend } from './MapLegend';

export const RoadNetworkMap: React.FC = () => {
  const { 
    roads, 
    selectedRoadId, 
    setSelectedRoadId, 
    ripplePrediction 
  } = useTraffic();

  const [hoveredRoad, setHoveredRoad] = useState<Road | null>(null);

  const roadMap = useMemo(() => new Map<string, Road>(roads.map((r) => [r.id, r])), [roads]);

  // Build clean list of edges
  const edges = useMemo(() => {
    const list: Array<{
      source: Road;
      target: Road;
      isRipplePath: boolean;
    }> = [];

    const atRiskMap = new Map(ripplePrediction.cascadeChain.map((n) => [n.roadId, n.predictedLevel]));

    roads.forEach((road) => {
      road.connectedRoads.forEach((conn) => {
        const target = roadMap.get(conn.targetId);
        if (target) {
          const isRipplePath =
            (road.id === ripplePrediction.sourceRoadId && atRiskMap.has(target.id)) ||
            (atRiskMap.has(road.id) && atRiskMap.has(target.id));

          list.push({
            source: road,
            target,
            isRipplePath,
          });
        }
      });
    });

    return list;
  }, [roads, roadMap, ripplePrediction]);

  // Color helper
  const getTrafficColor = (speed: number, freeFlow: number) => {
    const level = classifyTrafficLevel(speed, freeFlow);
    switch (level) {
      case 'CRITICAL': return '#f43f5e';
      case 'HEAVY': return '#f97316';
      case 'MODERATE': return '#f59e0b';
      case 'FREE': return '#10b981';
    }
  };

  const selectedRoad = roadMap.get(selectedRoadId);

  return (
    <div className="bg-[#131926] border border-[#20293a] rounded-xl overflow-hidden flex flex-col shadow-sm">
      {/* Map Header */}
      <div className="px-4 py-3 border-b border-[#20293a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Road Network Map</span>
          <span className="text-[11px] text-slate-400">• Click any road to inspect</span>
        </div>
        <MapLegend />
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[16/10] max-h-[460px] bg-[#0c1019] flex items-center justify-center p-2">
        <svg
          viewBox="0 0 850 540"
          className="w-full h-full select-none"
        >
          {/* Subtle grid points */}
          <pattern id="dotPattern" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#1e2738" opacity="0.6" />
          </pattern>
          <rect width="850" height="540" fill="url(#dotPattern)" />

          {/* 1. Road Edges */}
          {edges.map((edge, index) => {
            const { source, target, isRipplePath } = edge;
            const isSelected = source.id === selectedRoadId || target.id === selectedRoadId;
            const sourceColor = getTrafficColor(source.currentSpeed, source.freeFlowSpeed);

            return (
              <g key={`edge-${source.id}-${target.id}-${index}`}>
                {/* Background Line */}
                <line
                  x1={source.coordinates.x}
                  y1={source.coordinates.y}
                  x2={target.coordinates.x}
                  y2={target.coordinates.y}
                  stroke="#161f30"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Primary Road Line */}
                <line
                  x1={source.coordinates.x}
                  y1={source.coordinates.y}
                  x2={target.coordinates.x}
                  y2={target.coordinates.y}
                  stroke={sourceColor}
                  strokeWidth={isSelected ? "4" : "2.5"}
                  strokeLinecap="round"
                  opacity={isSelected ? 1 : 0.75}
                  className="transition-all"
                />

                {/* Ripple Shockwave Pulse */}
                {isRipplePath && (
                  <line
                    x1={source.coordinates.x}
                    y1={source.coordinates.y}
                    x2={target.coordinates.x}
                    y2={target.coordinates.y}
                    stroke="#f43f5e"
                    strokeWidth="3.5"
                    strokeDasharray="6,8"
                    strokeLinecap="round"
                    opacity="0.9"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="50;0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </line>
                )}

                {/* Traffic Flow Particles */}
                <circle r="2" fill="#e2e8f0" opacity="0.7">
                  <animateMotion
                    path={`M ${source.coordinates.x} ${source.coordinates.y} L ${target.coordinates.x} ${target.coordinates.y}`}
                    dur={`${Math.max(1.8, 100 / Math.max(10, source.currentSpeed))}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* 2. Congestion Ripple Ring for Active Epicenter */}
          {selectedRoad && (selectedRoad.activeIncident || classifyTrafficLevel(selectedRoad.currentSpeed, selectedRoad.freeFlowSpeed) === 'CRITICAL') && (
            <g transform={`translate(${selectedRoad.coordinates.x}, ${selectedRoad.coordinates.y})`}>
              <circle r="14" fill="none" stroke="#f43f5e" strokeWidth="1.5" opacity="0.8">
                <animate attributeName="r" values="14;48" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2.2s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* 3. Road Nodes */}
          {roads.map((road) => {
            const isSelected = road.id === selectedRoadId;
            const color = getTrafficColor(road.currentSpeed, road.freeFlowSpeed);

            return (
              <g
                key={`node-${road.id}`}
                transform={`translate(${road.coordinates.x}, ${road.coordinates.y})`}
                className="cursor-pointer"
                onClick={() => setSelectedRoadId(road.id)}
                onMouseEnter={() => setHoveredRoad(road)}
                onMouseLeave={() => setHoveredRoad(null)}
              >
                {/* Selected Indicator Ring */}
                {isSelected && (
                  <circle
                    r="19"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r={isSelected ? "13" : "10"}
                  fill="#0b0f17"
                  stroke={color}
                  strokeWidth={isSelected ? "3" : "2"}
                  className="transition-all hover:scale-125"
                />

                <circle
                  r={isSelected ? "5" : "4"}
                  fill={color}
                />

                {/* Label */}
                <text
                  x="0"
                  y="-16"
                  textAnchor="middle"
                  fill={isSelected ? "#ffffff" : "#94a3b8"}
                  fontSize={isSelected ? "12" : "10.5"}
                  fontWeight={isSelected ? "bold" : "600"}
                  fontFamily="monospace"
                  className="pointer-events-none"
                >
                  {road.code}
                </text>

                {/* Speed */}
                <text
                  x="0"
                  y="23"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  className="pointer-events-none"
                >
                  {road.currentSpeed} km/h
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredRoad && (
          <div
            className="absolute z-20 pointer-events-none bg-[#131926] p-3 rounded-lg border border-[#20293a] shadow-lg text-xs w-60"
            style={{
              left: `${Math.min(75, Math.max(10, (hoveredRoad.coordinates.x / 850) * 100))}%`,
              top: `${Math.min(70, Math.max(15, (hoveredRoad.coordinates.y / 540) * 100 - 15))}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-[#20293a] pb-1.5 mb-1.5">
              <span className="font-mono font-bold text-white">{hoveredRoad.code} — {hoveredRoad.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TRAFFIC_LEVELS[classifyTrafficLevel(hoveredRoad.currentSpeed, hoveredRoad.freeFlowSpeed)].badgeClass}`}>
                {TRAFFIC_LEVELS[classifyTrafficLevel(hoveredRoad.currentSpeed, hoveredRoad.freeFlowSpeed)].label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">Speed</span>
                <span className="font-mono font-semibold text-white">{hoveredRoad.currentSpeed} km/h</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Queue</span>
                <span className="font-mono font-semibold text-orange-400">{hoveredRoad.currentQueue.toLocaleString()} veh</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
