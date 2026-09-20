import React, { useState } from 'react';
import { AdvisoryData, DiversionData, RoadStatus } from '../../types/traffic';
import { getCorridorInfo } from '../../utils/corridorNames';
import { Copy, Check } from 'lucide-react';

interface AdvisoryCardProps {
  road: RoadStatus | null;
  advisory: AdvisoryData | null;
  diversion: DiversionData | null;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({ road }) => {
  const [copied, setCopied] = useState(false);

  if (!road) return null;

  const corridorInfo = getCorridorInfo(road.segment_id, road.source_lat, road.source_lon);

  const handleCopy = () => {
    const text = [
      `[SAATHI HYDERABAD TRAFFIC ADVISORY]`,
      `Corridor: ${road.segment_id} (${corridorInfo.name})`,
      `Zone: ${corridorInfo.zone}`,
      `1. How traffic will change: Speed expected to bottom out at 8 km/h (Critical) at +30 min (08:37 AM) along ${corridorInfo.name}. Trend indicates sustained gridlock pressure over next 60m.`,
      `2. When congestion may recover: Estimated queue clearance time: 24 minutes post-incident removal at net discharge rate of 51.67 veh/min. Normal traffic: 08:31 AM.`,
      `3. Where congestion may spread: Shockwave cascade: R18 Gachibowli ORR (+12m) → R21 Raidurg Metro (+18m) → R08 Durgam Cheruvu (+22m) → R16 IKEA Radial (+6m). Recommended bypass: R19 Biodiversity Bypass (55% spare capacity).`,
      `[SIMULATED DECISION-SUPPORT OUTPUT]`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0d121f] border border-[#1b2333] rounded-xl p-3.5 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">📣</span>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Combined Advisory
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-[#1e293b] border border-slate-700 px-1.5 py-0.5 rounded">
              Simulated
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Single simulated decision-support output combining Timeline, Recovery, and Ripple for Hyderabad corridors
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#131926] hover:bg-[#1a2234] border border-[#20293a] text-slate-300 text-xs font-medium rounded-lg transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'Copied' : 'Copy Advisory'}</span>
        </button>
      </div>

      {/* 3-Column Advisory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Card 1: How traffic will change */}
        <div className="bg-[#131926] border border-[#20293a] rounded-lg p-3 space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🔮</span> How traffic will change
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Speed expected to bottom out at 8 km/h (Critical 🔴) at +30 min (08:37 AM) along Cyber Towers &amp; Mindspace Arterial. Sustained gridlock pressure through peak hour.
          </p>
        </div>

        {/* Card 2: When congestion may recover */}
        <div className="bg-[#131926] border border-[#20293a] rounded-lg p-3 space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>⏱️</span> When congestion may recover
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Estimated queue clearance time: 24 minutes post-incident removal at net discharge rate of 51.67 vehicles/min. Expected return to normal traffic condition: 08:31 AM.
          </p>
        </div>

        {/* Card 3: Where congestion may spread */}
        <div className="bg-[#131926] border border-[#20293a] rounded-lg p-3 space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🌊</span> Where congestion may spread
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Shockwave cascade path: R18 Gachibowli ORR in +12m &rarr; R21 Raidurg Underpass in +18m &rarr; R08 Durgam Cheruvu in +22m &rarr; R16 IKEA Radial in +6m. Recommended unburdened bypass: R19 Biodiversity Bypass (55% spare cap).
          </p>
        </div>
      </div>

      {/* Bottom Note */}
      <div className="flex items-start gap-1.5 text-[10px] text-slate-500 border-t border-[#1b2333] pt-2">
        <span className="text-amber-400 font-bold">⚠️ Note:</span>
        <span>
          All predictions and advisories are simulated decision-support outputs for Hyderabad urban corridors and are not direct traffic-control commands.
        </span>
      </div>
    </div>
  );
};
