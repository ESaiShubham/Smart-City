import React from 'react';
import { RippleData, RoadStatus } from '../../types/traffic';

interface RippleViewProps {
  road: RoadStatus | null;
  rippleData: RippleData | null;
  onSelectAffectedRoad: (id: string) => void;
}

export const RippleView: React.FC<RippleViewProps> = ({
  road,
  onSelectAffectedRoad,
}) => {
  if (!road) return null;

  const cascadeSequence = [
    {
      id: 'R17',
      name: 'Cyber Towers - Mindspace Arterial',
      badge: 'Congested now',
      level: 'red',
      delayMinutes: null,
      distanceKm: null,
    },
    {
      id: 'R18',
      name: 'Gachibowli ORR Radial (Wipro Circle)',
      badge: 'Heavy',
      level: 'orange',
      delayMinutes: 12,
      distanceKm: 3.6,
    },
    {
      id: 'R21',
      name: 'Raidurg Metro - Inorbit Mall Underpass',
      badge: 'Critical',
      level: 'red',
      delayMinutes: 6,
      distanceKm: 1.8,
    },
    {
      id: 'R08',
      name: 'Durgam Cheruvu Cable Bridge Corridor',
      badge: 'Heavy',
      level: 'orange',
      delayMinutes: 10,
      distanceKm: 3.1,
    },
    {
      id: 'R16',
      name: 'IKEA - HITEC City Station Radial',
      badge: 'Heavy',
      level: 'orange',
      delayMinutes: 6,
      distanceKm: 1.8,
    },
  ];

  const getBadgeStyle = (level: string) => {
    if (level === 'red') return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    if (level === 'orange') return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
    if (level === 'yellow') return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  };

  const getDotColor = (level: string) => {
    if (level === 'red') return 'bg-rose-500';
    if (level === 'orange') return 'bg-orange-500';
    if (level === 'yellow') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="bg-[#0d121f] border border-[#1b2333] rounded-xl p-3.5 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🌊</span>
            <h3 className="text-xs font-bold text-white tracking-wide">
              3. Ripple Prediction
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Predicts how congestion on one road may affect connected roads in Hyderabad
          </p>
        </div>

        <div className="text-[11px] text-slate-400">
          Congestion shockwave speed: <strong className="text-white">18 km/h</strong>
        </div>
      </div>

      {/* 2-Column Split: Spillover Sequence vs Alternative Safe Corridors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        {/* Left Column (7 cols): Congestion Spillover Sequence */}
        <div className="md:col-span-7 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300">
            Congestion Spillover Sequence:
          </div>

          <div className="space-y-1.5">
            {cascadeSequence.map((item) => (
              <React.Fragment key={item.id}>
                {item.delayMinutes !== null && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 pl-4 py-0.5 font-medium">
                    <span>&darr;</span>
                    <span>+{item.delayMinutes} min</span>
                    <span className="text-slate-500">({item.distanceKm} km)</span>
                  </div>
                )}

                <div
                  onClick={() => onSelectAffectedRoad(item.id)}
                  className="bg-[#131926] border border-[#20293a] hover:border-slate-600 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition text-xs"
                >
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5 truncate max-w-[280px]">
                    <span className="text-white font-mono shrink-0">{item.id}</span>
                    <span className="text-slate-400 font-normal truncate">({item.name})</span>
                  </div>

                  <div
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1.5 shrink-0 ${getBadgeStyle(
                      item.level
                    )}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(item.level)}`} />
                    <span>{item.badge}</span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Alternative Safe Corridors */}
        <div className="md:col-span-5 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300">
            Alternative Safe Corridors:
          </div>

          <div className="bg-[#131926] border border-[#20293a] rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="font-semibold text-white">
                <span className="font-mono">R19</span>{' '}
                <span className="text-slate-400 font-normal">(Biodiversity - Knowledge City Bypass)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Safe
              </span>
            </div>

            <div className="text-xs text-slate-400">
              Spare capacity available:{' '}
              <strong className="text-emerald-400 font-bold">55% (2,869 veh/hr)</strong>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 border-t border-[#1b2333]">
              Recommended bypass around Hitec City bottleneck via Outer Ring Road service arterial.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
