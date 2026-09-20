import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, Sparkles, Sliders, Play, Pause } from 'lucide-react';
import { DashboardSummary } from '../../types/traffic';

interface HeaderProps {
  summary: DashboardSummary | null;
  isConnected: boolean;
  onOpenInjectModal: () => void;
  onOpenWhatIf: () => void;
  onControlSimulation: (action: 'play' | 'pause' | 'reset' | 'speed', speed?: number) => void;
  currentView: 'dashboard' | 'demo';
  onChangeView: (view: 'dashboard' | 'demo') => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  isConnected,
  onOpenInjectModal,
  onOpenWhatIf,
  onControlSimulation,
  currentView,
  onChangeView,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('08:07:23 AM');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeIncidents = summary?.active_incidents_count ?? 2;
  const isSimRunning = summary?.simulation_status === 'RUNNING';

  return (
    <header className="w-full bg-[#0d121f] border-b border-[#1b2333] px-4 py-2.5">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
        {/* Left: Branding & Team */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1a2234] border border-[#2d3b55] flex items-center justify-center text-indigo-400 shadow-sm">
            <span className="text-lg">🛰️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-wider">SAATHI</span>
              <span className="text-[10px] font-medium text-slate-300 bg-[#1e293b] border border-slate-700 px-2 py-0.5 rounded-md">
                AI Traffic Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Team Buggie · Neurax Hackathon 3.0</p>
          </div>
        </div>

        {/* Right: Telemetry Pills & Actions */}
        <div className="flex items-center gap-2.5">
          {/* View Switcher */}
          <div className="hidden sm:flex items-center bg-[#131926] p-0.5 rounded-lg border border-[#20293a] text-xs">
            <button
              onClick={() => onChangeView('dashboard')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                currentView === 'dashboard' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onChangeView('demo')}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                currentView === 'demo' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Demo Walkthrough
            </button>
          </div>

          {/* What-if sandbox trigger */}
          <button
            onClick={onOpenWhatIf}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-[#131926] hover:bg-[#1a2234] text-slate-300 text-xs font-medium rounded-lg border border-[#20293a] transition"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Sandbox</span>
          </button>

          {/* Clock Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#131926] rounded-lg border border-[#20293a] text-xs font-mono text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currentTime}</span>
          </div>

          {/* Incident Alert Pill */}
          <button
            onClick={onOpenInjectModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 text-xs font-medium transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{activeIncidents} Incident Active</span>
          </button>

          {/* Refresh / Reset button */}
          <button
            onClick={() => onControlSimulation('reset')}
            title="Reset Simulation Telemetry"
            className="w-8 h-8 rounded-lg bg-[#131926] hover:bg-[#1a2234] border border-[#20293a] flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
