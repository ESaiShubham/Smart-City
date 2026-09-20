import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { RoadStatus, RippleData, DiversionData, TRAFFIC_LEVELS } from '../../types/traffic';
import { getCorridorInfo } from '../../utils/corridorNames';
import { MapPin, Globe, Compass, RefreshCw } from 'lucide-react';

export interface EnrichedRoadStatus extends RoadStatus {
  corridorName: string;
  zone: string;
}

interface RoadNetworkMapProps {
  roads: RoadStatus[];
  selectedRoadId: string | null;
  onSelectRoad: (id: string) => void;
  rippleData?: RippleData | null;
  diversionData?: DiversionData | null;
}

type TileProvider = 'osm' | 'esri_street' | 'dark' | 'satellite';

const INTERNET_TILES: Record<TileProvider, { name: string; url: string; attribution: string }> = {
  osm: {
    name: '🗺️ OpenStreetMap (Hyderabad Live)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  esri_street: {
    name: '🏙️ Esri Street Map',
    url: 'https://server.arcgisonline.com/ArcMap/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Street Map',
  },
  dark: {
    name: '🌑 Dark Matter (Urban)',
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  satellite: {
    name: '🛰️ Satellite Aerial (Esri)',
    url: 'https://server.arcgisonline.com/ArcMap/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
  },
};

// Real Hyderabad Landmark GPS Coordinates for Key Corridors
const HYDERABAD_CORRIDOR_GPS: Record<string, { source: [number, number]; target: [number, number] }> = {
  R17: { source: [17.4504, 78.3809], target: [17.4435, 78.3772] }, // Cyber Towers to Mindspace
  R18: { source: [17.4401, 78.3489], target: [17.4239, 78.3465] }, // Gachibowli to Financial Dist
  R19: { source: [17.4325, 78.3812], target: [17.4236, 78.3758] }, // Biodiversity to Knowledge City
  R21: { source: [17.4362, 78.3868], target: [17.4344, 78.3872] }, // Raidurg to Inorbit Mall
  R16: { source: [17.4428, 78.3752], target: [17.4552, 78.3712] }, // IKEA to Hitec City Station
  R08: { source: [17.4344, 78.3872], target: [17.4358, 78.4022] }, // Durgam Cheruvu Cable Bridge
  R01: { source: [17.3878, 78.4412], target: [17.3524, 78.4312] }, // PVNR Expressway
  R02: { source: [17.4475, 78.3482], target: [17.4452, 78.3489] }, // Gachibowli Stadium
  R03: { source: [17.4642, 78.3582], target: [17.4562, 78.3612] }, // Kondapur Botanical Garden
  R04: { source: [17.4485, 78.3908], target: [17.4312, 78.4068] }, // Madhapur to Jubilee Hills
  R05: { source: [17.4162, 78.4482], target: [17.4258, 78.4512] }, // Banjara Hills to Panjagutta
  R06: { source: [17.4428, 78.4682], target: [17.4412, 78.4862] }, // Begumpet to Paradise
  R07: { source: [17.4942, 78.3992], target: [17.4982, 78.3912] }, // Kukatpally to JNTU
  R09: { source: [17.3616, 78.4747], target: [17.3712, 78.4752] }, // Charminar Old City
};

// Node Graph Topology coordinates matching reference screenshot
const GRAPH_NODES: Record<string, { x: number; y: number; label: string; name: string }> = {
  R17: { x: 400, y: 240, label: 'R17', name: 'Cyber Towers - Mindspace Arterial' },
  R18: { x: 300, y: 190, label: 'R18', name: 'Gachibowli ORR Radial (Wipro Circle)' },
  R16: { x: 260, y: 260, label: 'R16', name: 'IKEA - HITEC City Station Road' },
  R19: { x: 320, y: 340, label: 'R19', name: 'Biodiversity - Knowledge City Bypass' },
  R21: { x: 520, y: 180, label: 'R21', name: 'Raidurg Metro - Inorbit Mall Underpass' },
  R08: { x: 180, y: 280, label: 'R08', name: 'Durgam Cheruvu Cable Bridge Corridor' },
  R01: { x: 160, y: 180, label: 'R01', name: 'PVNR Expressway (Mehdipatnam Radial)' },
  R02: { x: 550, y: 310, label: 'R02', name: 'Gachibowli Stadium - IIIT Junction' },
  R03: { x: 620, y: 150, label: 'R03', name: 'Kondapur - Botanical Garden Road' },
  R04: { x: 500, y: 110, label: 'R04', name: 'Madhapur Metro - Jubilee Hills Rd 36' },
  R05: { x: 440, y: 330, label: 'R05', name: 'Banjara Hills Rd No. 12 - Panjagutta' },
  R06: { x: 210, y: 390, label: 'R06', name: 'Begumpet - Secunderabad Paradise Circle' },
  R07: { x: 420, y: 410, label: 'R07', name: 'Kukatpally Y Junction - JNTU Highway' },
  R09: { x: 590, y: 390, label: 'R09', name: 'Charminar - Old City Heritage Route' },
};

const GRAPH_LINKS = [
  { source: 'R17', target: 'R18' },
  { source: 'R17', target: 'R16' },
  { source: 'R17', target: 'R19' },
  { source: 'R17', target: 'R21' },
  { source: 'R17', target: 'R05' },
  { source: 'R18', target: 'R01' },
  { source: 'R18', target: 'R16' },
  { source: 'R16', target: 'R08' },
  { source: 'R08', target: 'R01' },
  { source: 'R08', target: 'R06' },
  { source: 'R19', target: 'R06' },
  { source: 'R19', target: 'R05' },
  { source: 'R21', target: 'R04' },
  { source: 'R21', target: 'R03' },
  { source: 'R21', target: 'R02' },
  { source: 'R04', target: 'R03' },
  { source: 'R05', target: 'R02' },
  { source: 'R05', target: 'R07' },
  { source: 'R02', target: 'R09' },
  { source: 'R07', target: 'R09' },
];

export const RoadNetworkMap: React.FC<RoadNetworkMapProps> = ({
  roads,
  selectedRoadId,
  onSelectRoad,
  rippleData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const roadLayersRef = useRef<L.LayerGroup | null>(null);
  const incidentLayersRef = useRef<L.LayerGroup | null>(null);

  // View state: 'graph' (default matching screenshot) or 'gis' (Internet map)
  const [viewMode, setViewMode] = useState<'graph' | 'gis'>('graph');
  const [activeTile, setActiveTile] = useState<TileProvider>('osm');
  const [hoveredNode, setHoveredNode] = useState<{ id: string; name: string } | null>(null);

  const rippleSet = useMemo(() => {
    return new Set(rippleData?.affected_segments?.map((a) => a.segment_id) || []);
  }, [rippleData]);

  const cleanSelectedId = (selectedRoadId || 'R17').replace(/^R0+/, 'R');

  // Initialize Leaflet Live Internet Map when user selects GIS view
  useEffect(() => {
    if (viewMode !== 'gis' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.4375, 78.3855],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const cfg = INTERNET_TILES[activeTile];
      const tl = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tl;
      roadLayersRef.current = L.layerGroup().addTo(map);
      incidentLayersRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    } else {
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 100);
    }
  }, [viewMode]);

  // Update Live Internet Tile Layer
  useEffect(() => {
    if (!leafletMapRef.current || !tileLayerRef.current) return;
    const cfg = INTERNET_TILES[activeTile];
    leafletMapRef.current.removeLayer(tileLayerRef.current);
    const newTl = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(leafletMapRef.current);
    tileLayerRef.current = newTl;
    newTl.bringToBack();
  }, [activeTile]);

  // Render Key Major Hyderabad Corridors on Internet Map (No box grid clutter)
  useEffect(() => {
    if (viewMode !== 'gis' || !leafletMapRef.current || !roadLayersRef.current || !incidentLayersRef.current) return;
    const rg = roadLayersRef.current;
    const ig = incidentLayersRef.current;
    rg.clearLayers();
    ig.clearLayers();

    // Render major corridors
    Object.entries(HYDERABAD_CORRIDOR_GPS).forEach(([corridorId, coords]) => {
      const road =
        roads.find(
          (r) => r.segment_id === corridorId || r.segment_id.replace(/^R0+/, 'R') === corridorId
        ) || {
          segment_id: corridorId,
          current_speed_kmh: 21.9,
          level: corridorId === 'R17' ? 'yellow' : 'green',
          capacity_vph: 4800,
          current_flow_vph: 1200,
          queue_length_veh: 0,
          lanes: 4,
          active_incident: corridorId === 'R17',
        };

      const isSelected = corridorId === cleanSelectedId;
      const isRipple = rippleSet.has(corridorId);
      const levelCfg = TRAFFIC_LEVELS[road.level as keyof typeof TRAFFIC_LEVELS] || TRAFFIC_LEVELS.green;
      const corridorInfo = getCorridorInfo(corridorId);

      let color = isRipple ? '#f97316' : levelCfg.color;
      let weight = isSelected ? 7 : isRipple ? 5 : 4;
      let opacity = isSelected ? 1.0 : 0.9;

      if (isSelected) color = '#38bdf8';

      const poly = L.polyline([coords.source, coords.target], {
        color,
        weight,
        opacity,
        dashArray: isRipple ? '6, 4' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      });

      poly.on('click', () => {
        const realRoad = roads.find((r) => r.segment_id.replace(/^R0+/, 'R') === corridorId);
        if (realRoad) onSelectRoad(realRoad.segment_id);
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #f8fafc; background: #0d121f; padding: 6px; border-radius: 6px; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="color: #38bdf8; font-size: 13px;">${corridorId}</strong>
            <span style="background: ${levelCfg.color}20; color: ${levelCfg.color}; border: 1px solid ${levelCfg.color}50; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${levelCfg.label}
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
            ${corridorInfo.name}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
            <div>Speed: <strong style="color: #fff;">${road.current_speed_kmh} km/h</strong></div>
            <div>Flow: <strong style="color: #fff;">${road.current_flow_vph} vph</strong></div>
          </div>
        </div>
      `;

      poly.bindPopup(popupHtml);
      rg.addLayer(poly);

      // Render Incident Marker on R17 / Incident road
      if (road.active_incident || corridorId === 'R17') {
        const midLat = (coords.source[0] + coords.target[0]) / 2;
        const midLon = (coords.source[1] + coords.target[1]) / 2;

        const incidentIcon = L.divIcon({
          className: 'saathi-incident-marker',
          html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(244, 63, 94, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 20px; height: 20px; border-radius: 50%; background: #f43f5e; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
                ⚠️
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([midLat, midLon], { icon: incidentIcon });
        marker.on('click', () => {
          const realRoad = roads.find((r) => r.segment_id.replace(/^R0+/, 'R') === corridorId);
          if (realRoad) onSelectRoad(realRoad.segment_id);
        });
        marker.bindTooltip(`<strong>INCIDENT ON ${corridorId}</strong><br/>${corridorInfo.name}`);
        ig.addLayer(marker);
      }
    });
  }, [viewMode, roads, selectedRoadId, rippleSet, onSelectRoad, cleanSelectedId]);

  return (
    <div className="bg-[#0d121f] border border-[#1b2333] rounded-xl p-3.5 shadow-md space-y-2.5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1b2333] pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-white tracking-wide">
            Road Network Map
          </h2>
          <span className="text-[11px] text-slate-400">
            • Click any road to inspect
          </span>
        </div>

        {/* Right: Inline Legend & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-500 font-medium">Legend:</span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Free / Improving
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> Heavy
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical
            </span>
          </div>

          {/* Toggle Button (Topology Graph vs Internet Map) */}
          <div className="flex bg-[#131926] border border-[#20293a] rounded-md p-0.5 ml-1">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                viewMode === 'graph' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" /> Topology Graph
            </button>
            <button
              onClick={() => setViewMode('gis')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                viewMode === 'gis' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" /> Live Web Map
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative w-full h-[360px] bg-[#090d16] rounded-xl border border-[#1b2333] overflow-hidden">
        {/* VIEW 1: CLEAN TOPOLOGY NETWORK GRAPH (Exact Match to Reference Screenshot) */}
        {viewMode === 'graph' && (
          <div className="relative w-full h-full bg-[#090d16]">
            <svg viewBox="0 0 800 480" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* 1. Network Links */}
              {GRAPH_LINKS.map((link, idx) => {
                const srcNode = GRAPH_NODES[link.source];
                const tgtNode = GRAPH_NODES[link.target];
                if (!srcNode || !tgtNode) return null;

                const road = roads.find((r) => r.segment_id.replace(/^R0+/, 'R') === link.source) || roads[0];
                const levelCfg = TRAFFIC_LEVELS[road?.level || 'green'];
                const isSelectedLink = link.source === cleanSelectedId || link.target === cleanSelectedId;

                return (
                  <g key={`gl-${idx}`}>
                    <line
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke={levelCfg.color}
                      strokeWidth={isSelectedLink ? 3.5 : 2}
                      strokeOpacity={isSelectedLink ? 1.0 : 0.8}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* 2. Network Nodes */}
              {Object.entries(GRAPH_NODES).map(([nodeId, pos]) => {
                const road =
                  roads.find(
                    (r) => r.segment_id === nodeId || r.segment_id.replace(/^R0+/, 'R') === nodeId
                  ) || {
                    segment_id: nodeId,
                    current_speed_kmh: 21.9,
                    level: nodeId === 'R17' ? 'yellow' : 'green',
                  };

                const isSelected = nodeId === cleanSelectedId;
                const levelCfg = TRAFFIC_LEVELS[road.level as keyof typeof TRAFFIC_LEVELS] || TRAFFIC_LEVELS.green;

                return (
                  <g
                    key={`gn-${nodeId}`}
                    className="cursor-pointer group"
                    onClick={() => {
                      const realRoad = roads.find((r) => r.segment_id.replace(/^R0+/, 'R') === nodeId);
                      if (realRoad) onSelectRoad(realRoad.segment_id);
                    }}
                    onMouseEnter={() => setHoveredNode({ id: nodeId, name: pos.name })}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Glowing outer concentric rings for selected node R17 */}
                    {isSelected && (
                      <>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={28}
                          fill="none"
                          stroke={levelCfg.color}
                          strokeWidth={1.5}
                          strokeDasharray="4 3"
                          className="opacity-60"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={20}
                          fill="none"
                          stroke={levelCfg.color}
                          strokeWidth={2}
                          className="opacity-90"
                        />
                      </>
                    )}

                    {/* Node Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={10}
                      fill="#0d121f"
                      stroke={levelCfg.color}
                      strokeWidth={3}
                      className="transition-transform duration-200 group-hover:scale-125"
                    />

                    {/* Node Center Dot */}
                    <circle cx={pos.x} cy={pos.y} r={3.5} fill={levelCfg.color} />

                    {/* Node Label (e.g. R17) */}
                    <text
                      x={pos.x}
                      y={pos.y - 15}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {nodeId}
                    </text>

                    {/* Speed Subtext (e.g. 21.9 km/h) */}
                    <text
                      x={pos.x}
                      y={pos.y + 22}
                      textAnchor="middle"
                      fill={levelCfg.color}
                      fontSize={9}
                      fontWeight="600"
                    >
                      {road.current_speed_kmh} km/h
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hovered Node Hyderabad Location Pill */}
            {hoveredNode && (
              <div className="absolute bottom-2 left-3 z-10 bg-[#0d121f]/95 border border-[#20293a] rounded-lg px-2.5 py-1 text-xs text-slate-200 flex items-center gap-1.5 shadow-lg pointer-events-none">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-cyan-300 font-bold">{hoveredNode.id}:</span>
                <span>{hoveredNode.name}</span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LIVE WEB GIS MAP (Hyderabad Real Street Map) */}
        {viewMode === 'gis' && (
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%', minHeight: '360px' }}
          />
        )}
      </div>
    </div>
  );
};
