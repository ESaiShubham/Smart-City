import React from 'react';
import { RoadStatus, TRAFFIC_LEVELS } from '../../types/traffic';
import { getCorridorInfo } from '../../utils/corridorNames';

interface StatusRibbonProps {
  summary?: any;
  roads: RoadStatus[];
  selectedRoadId: string | null;
  onSelectRoad: (id: string) => void;
}

export const StatusRibbon: React.FC<StatusRibbonProps> = ({
  roads,
  selectedRoadId,
  onSelectRoad,
}) => {
  // Ensure default key corridors appear in order matching the screenshot
  const priorityIds = ['R17', 'R18', 'R19', 'R21', 'R16', 'R01', 'R02', 'R03', 'R08', 'R0360', 'R0384'];

  const displayedRoads = React.useMemo(() => {
    const list: RoadStatus[] = [];
    const added = new Set<string>();

    priorityIds.forEach((pid) => {
      const found = roads.find(
        (r) => r.segment_id === pid || r.segment_id.replace(/^R0+/, 'R') === pid
      );
      if (found && !added.has(found.segment_id)) {
        list.push(found);
        added.add(found.segment_id);
      }
    });

    // Add remaining roads
    roads.forEach((r) => {
      if (!added.has(r.segment_id) && list.length < 24) {
        list.push(r);
        added.add(r.segment_id);
      }
    });

    return list;
  }, [roads]);

  const selectedRoad = roads.find((r) => r.segment_id === selectedRoadId) || roads[0] || null;
  const selectedInfo = selectedRoad ? getCorridorInfo(selectedRoad.segment_id, selectedRoad.source_lat, selectedRoad.source_lon) : null;
  const levelCfg = selectedRoad ? TRAFFIC_LEVELS[selectedRoad.level] || TRAFFIC_LEVELS.green : TRAFFIC_LEVELS.green;

  const getDotColor = (level: string) => {
    if (level === 'red') return 'bg-rose-500';
    if (level === 'orange') return 'bg-orange-500';
    if (level === 'yellow') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="w-full bg-[#0d121f] border border-[#1b2333] rounded-xl px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Left: Corridors List */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-0.5">
        <span className="text-slate-400 font-medium text-xs shrink-0 pr-1">
          Corridors:
        </span>
        {displayedRoads.map((rd) => {
          const isSelected = rd.segment_id === selectedRoadId;
          const cleanName = rd.segment_id.replace(/^R0+/, 'R');
          const dotColor = getDotColor(rd.level);

          return (
            <button
              key={rd.segment_id}
              onClick={() => onSelectRoad(rd.segment_id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#131926] text-slate-300 border border-[#20293a] hover:border-slate-600 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : dotColor}`} />
              <span>{cleanName}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Selected Corridor Status */}
      {selectedRoad && (
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <div className="text-slate-200 font-semibold">
            <span>{selectedInfo?.name || selectedRoad.segment_id}</span>
            <span className="text-slate-400 font-normal ml-2">
              · &nbsp;
              <strong className="text-white">{selectedRoad.current_speed_kmh} km/h</strong> / {selectedRoad.free_flow_speed_kmh} km/h
            </span>
          </div>

          <div
            className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${levelCfg.badgeClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: levelCfg.color }} />
            <span>{levelCfg.label.charAt(0) + levelCfg.label.slice(1).toLowerCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
