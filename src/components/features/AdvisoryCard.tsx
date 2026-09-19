import React, { useState } from 'react';
import { useTraffic } from '../../context/TrafficContext';
import { Copy, Check } from 'lucide-react';

export const AdvisoryCard: React.FC = () => {
  const { combinedAdvisory } = useTraffic();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const report = `
[SAATHI Combined Advisory - Simulated]
Corridor: ${combinedAdvisory.sourceRoadCode} (${combinedAdvisory.sourceRoadName})
Generated: ${combinedAdvisory.generatedAt}

1. How traffic will change:
${combinedAdvisory.trafficChangeSummary}

2. When congestion may recover:
${combinedAdvisory.recoverySummary}

3. Where congestion may spread:
${combinedAdvisory.rippleSummary}

Note: All predictions and advisories are simulated decision-support outputs and are not direct traffic-control commands.
`;
    navigator.clipboard.writeText(report.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#131926] border border-[#20293a] rounded-xl p-4 lg:p-5 flex flex-col gap-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#20293a] pb-3">
        <div>
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span>📣 Combined Advisory</span>
            <span className="text-[11px] font-sans font-normal text-slate-400 bg-[#182030] px-2 py-0.5 rounded border border-[#20293a]">
              Simulated
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Single simulated decision-support output combining Timeline, Recovery, and Ripple
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#182030] hover:bg-[#20293a] text-slate-300 text-xs font-mono transition-all border border-[#20293a]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Advisory</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* How traffic will change */}
        <div className="p-3 rounded-lg bg-[#182030] border border-[#20293a] flex flex-col gap-1.5">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span>🔮</span> How traffic will change
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {combinedAdvisory.trafficChangeSummary}
          </p>
        </div>

        {/* When congestion may recover */}
        <div className="p-3 rounded-lg bg-[#182030] border border-[#20293a] flex flex-col gap-1.5">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span>🔄</span> When congestion may recover
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {combinedAdvisory.recoverySummary}
          </p>
        </div>

        {/* Where congestion may spread */}
        <div className="p-3 rounded-lg bg-[#182030] border border-[#20293a] flex flex-col gap-1.5">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span>🌊</span> Where congestion may spread
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {combinedAdvisory.rippleSummary}
          </p>
        </div>
      </div>

      {/* Advisory Notice */}
      <div className="text-[11px] text-slate-400 bg-[#0c1019] p-2.5 rounded-lg border border-[#20293a] flex items-center gap-2">
        <span className="text-amber-400 font-semibold">⚠️ Note:</span>
        <span>
          All predictions and advisories are simulated decision-support outputs and are not direct traffic-control commands.
        </span>
      </div>
    </div>
  );
};
