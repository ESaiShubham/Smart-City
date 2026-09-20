import React, { useState } from 'react';
import { X, Play, Sliders, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { RoadStatus } from '../../types/traffic';
import { api } from '../../services/api';

interface WhatIfDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roads: RoadStatus[];
  selectedRoadId: string | null;
}

export const WhatIfDrawer: React.FC<WhatIfDrawerProps> = ({
  isOpen,
  onClose,
  roads,
  selectedRoadId,
}) => {
  const [targetSegment, setTargetSegment] = useState<string>(selectedRoadId || roads[0]?.segment_id || 'R0001');
  const [lanesDelta, setLanesDelta] = useState<number>(-1);
  const [capacityMultiplier, setCapacityMultiplier] = useState<number>(0.7);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.evaluateSimulation({
        name: `Scenario: Impact on ${targetSegment}`,
        modifications: [
          {
            segment_id: targetSegment,
            lanes_delta: isClosed ? 0 : lanesDelta,
            capacity_multiplier: isClosed ? 0.0 : capacityMultiplier,
            is_closed: isClosed,
          }
        ]
      });
      setResult(res);
    } catch (err) {
      console.error('Error evaluating what-if:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131926] border border-[#20293a] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#20293a] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">What-If Intervention Sandbox</h2>
              <p className="text-xs text-slate-400">Simulate lane closures, demand spikes, and roadwork counterfactuals</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Target Road Corridor</label>
            <select
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              className="w-full bg-[#0d121f] border border-[#20293a] rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              {roads.map(r => (
                <option key={r.segment_id} value={r.segment_id}>
                  {r.segment_id} ({r.road_class} · {r.lanes} lanes)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Intervention Type</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsClosed(false); setLanesDelta(-1); }}
                className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium ${
                  !isClosed && lanesDelta === -1
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-[#0d121f] border-[#20293a] text-slate-400'
                }`}
              >
                -1 Lane
              </button>
              <button
                type="button"
                onClick={() => { setIsClosed(false); setCapacityMultiplier(0.5); }}
                className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium ${
                  !isClosed && capacityMultiplier === 0.5
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-[#0d121f] border-[#20293a] text-slate-400'
                }`}
              >
                -50% Cap
              </button>
              <button
                type="button"
                onClick={() => setIsClosed(true)}
                className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium ${
                  isClosed
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-[#0d121f] border-[#20293a] text-slate-400'
                }`}
              >
                Closure
              </button>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          {loading ? 'Evaluating Graph Perturbations...' : 'Run What-If Simulation'}
        </button>

        {/* Results Comparison */}
        {result && (
          <div className="bg-[#0d121f] border border-[#20293a] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Counterfactual Impact Analysis (Baseline vs Scenario)
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#131926] p-2.5 rounded-lg border border-[#20293a]">
                <span className="text-[10px] text-slate-400 font-medium">Avg Speed</span>
                <div className="text-white font-bold mt-1">
                  {result.baseline.average_speed_kmh} <ArrowRight className="inline w-3 h-3 text-slate-500" /> {result.scenario.average_speed_kmh} km/h
                </div>
                <div className="text-[10px] text-rose-400 mt-0.5">
                  Δ {result.delta.speed_change_kmh} km/h
                </div>
              </div>

              <div className="bg-[#131926] p-2.5 rounded-lg border border-[#20293a]">
                <span className="text-[10px] text-slate-400 font-medium">Avg Congestion</span>
                <div className="text-white font-bold mt-1">
                  {(result.baseline.average_congestion_index * 100).toFixed(0)}% <ArrowRight className="inline w-3 h-3 text-slate-500" /> {(result.scenario.average_congestion_index * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-orange-400 mt-0.5">
                  +{(result.delta.congestion_change * 100).toFixed(0)}% Stress
                </div>
              </div>

              <div className="bg-[#131926] p-2.5 rounded-lg border border-[#20293a]">
                <span className="text-[10px] text-slate-400 font-medium">Critical Roads</span>
                <div className="text-white font-bold mt-1">
                  {result.baseline.critical_segments_count} <ArrowRight className="inline w-3 h-3 text-slate-500" /> {result.scenario.critical_segments_count}
                </div>
                <div className="text-[10px] text-rose-400 mt-0.5">
                  +{result.delta.additional_critical_roads} Corridors
                </div>
              </div>
            </div>

            {result.newly_stressed_segments?.length > 0 && (
              <div className="text-xs text-slate-300">
                <span className="text-rose-400 font-semibold">Stressed Corridors: </span>
                <span className="font-mono text-slate-200">{result.newly_stressed_segments.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
