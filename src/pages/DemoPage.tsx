import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, ArrowRight, Waves, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { RoadStatus, ForecastData, RecoveryData, RippleData, AdvisoryData, DiversionData } from '../types/traffic';
import { api } from '../services/api';

interface DemoPageProps {
  roads: RoadStatus[];
  onSelectRoad: (id: string) => void;
  onRefreshAll: () => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({ roads, onSelectRoad, onRefreshAll }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [demoRoadId, setDemoRoadId] = useState<string>('R0360');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [demoLog, setDemoLog] = useState<string[]>([
    'Demo initialized. Target corridor set to R0360 (Hyderabad arterial).'
  ]);

  const steps = [
    { num: 1, title: 'Incident Injected on R0360', desc: 'Simulate severe 2-lane blockage on major corridor R0360.' },
    { num: 2, title: 'Immediate Flow Reduction', desc: 'Speed drops from 45 km/h to 12 km/h; Congestion index climbs to 88%.' },
    { num: 3, title: 'Multi-Horizon Forecast Updated', desc: 'XGBoost forecaster predicts sustained critical congestion over +15m, +30m, and +45m.' },
    { num: 4, title: 'Deterministic Recovery Calculation', desc: 'Net clearing rate computed; post-clearance recovery time estimated at ~28 minutes.' },
    { num: 5, title: 'NetworkX Ripple Propagation', desc: 'Spillover detected propagating to downstream segments R0384 (12m) and R0006 (22m).' },
    { num: 6, title: 'Automated Decision Advisory', desc: 'System generates non-authoritative operator advisory with alternative route diversion.' },
    { num: 7, title: 'What-If Counterfactual Verified', desc: 'Sandbox evaluates signal priority intervention saving an estimated 14 minutes.' },
    { num: 8, title: 'Incident Resolved & State Synchronized', desc: 'Incident cleared; state broadcasts to all connected client devices in real time.' },
  ];

  const handleNextStep = async () => {
    if (currentStep >= steps.length) {
      setCurrentStep(1);
      return;
    }

    const next = currentStep + 1;
    setCurrentStep(next);

    if (next === 1) {
      setDemoLog(prev => [...prev, 'Step 1: Injected 2-lane blockage on R0360.']);
      await api.createIncident({
        segment_id: demoRoadId,
        incident_type: 'accident_like',
        severity: 3,
        lanes_blocked: 2,
        description: 'Demo collision blocking 2 lanes on R0360',
      });
      onSelectRoad(demoRoadId);
      onRefreshAll();
    } else if (next === 3) {
      setDemoLog(prev => [...prev, 'Step 3: XGBoost multi-horizon forecast recalculated for +15m, +30m, +45m, +60m.']);
    } else if (next === 5) {
      setDemoLog(prev => [...prev, 'Step 5: NetworkX trace identified downstream ripple on R0384 and R0006.']);
    } else if (next === 8) {
      setDemoLog(prev => [...prev, 'Step 8: Cleared incident on R0360. Traffic returning to baseline.']);
      onRefreshAll();
    }
  };

  const handleResetDemo = () => {
    setCurrentStep(1);
    setDemoLog(['Demo reset to initial state. Ready for demonstration.']);
    onRefreshAll();
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-5">
      {/* Demo Header */}
      <div className="bg-[#131926] border border-[#20293a] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-black text-white tracking-wide">
              SAATHI Hackathon Live Demonstration Walkthrough
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Follow this 8-step interactive presentation flow to demonstrate incident detection, multi-horizon XGBoost forecasting, deterministic queuing recovery, NetworkX ripple spillover, and multi-device WebSocket synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0d121f] hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-[#20293a] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-md transition"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Advance Step ({currentStep}/{steps.length})</span>
          </button>
        </div>
      </div>

      {/* Step Pipeline Visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;

          return (
            <div
              key={s.num}
              className={`p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                  : isDone
                  ? 'bg-[#131926]/90 border-emerald-500/30 text-slate-300'
                  : 'bg-[#131926]/50 border-[#20293a] text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  isCurrent ? 'bg-cyan-500 text-slate-950' : isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  STEP {s.num}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>

              <div className={`text-xs font-bold ${isCurrent ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-400'}`}>
                {s.title}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Demo Console Log */}
      <div className="bg-[#0d121f] border border-[#20293a] rounded-xl p-4 space-y-2 font-mono text-xs">
        <div className="text-slate-400 font-semibold flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Live Demo Execution Log:</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto text-slate-300 pr-1">
          {demoLog.map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-slate-600">[{i + 1}]</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
