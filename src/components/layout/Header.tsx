import React, { useState } from 'react';
import { useTraffic } from '../../context/TrafficContext';
import { 
  RotateCcw, 
  AlertTriangle
} from 'lucide-react';
import { IncidentInjectorModal } from '../simulation/IncidentInjectorModal';

export const Header: React.FC = () => {
  const { 
    currentTime, 
    resetToDefaults,
    activeIncidents 
  } = useTraffic();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="border-b border-[#20293a] bg-[#0b0f17]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-lg shadow-sm">
              🛰️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                  SAATHI
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#131926] border border-[#20293a] text-slate-400 font-sans">
                  AI Traffic Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Team Buggie · Neurax Hackathon 3.0
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131926] border border-[#20293a] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300 font-medium">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Incident Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeIncidents.length > 0
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {activeIncidents.length > 0 
                  ? `${activeIncidents.length} Incident Active` 
                  : 'Simulate Incident'}
              </span>
            </button>

            {/* Reset */}
            <button
              onClick={resetToDefaults}
              className="p-2 rounded-lg bg-[#131926] border border-[#20293a] text-slate-400 hover:text-white transition-colors"
              title="Reset simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Incident Modal */}
      <IncidentInjectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
