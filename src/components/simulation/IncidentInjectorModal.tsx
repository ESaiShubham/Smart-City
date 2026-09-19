import React, { useState } from 'react';
import { useTraffic } from '../../context/TrafficContext';
import type { IncidentType } from '../../types/traffic';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface IncidentInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentInjectorModal: React.FC<IncidentInjectorModalProps> = ({ isOpen, onClose }) => {
  const { roads, injectIncident, clearIncident, activeIncidents } = useTraffic();

  const [selectedRoadId, setSelectedRoadId] = useState<string>('R17');
  const [title, setTitle] = useState<string>('Multi-Vehicle Collision at Cyber Corridor');
  const [type, setType] = useState<IncidentType>('COLLISION');
  const [initialQueue, setInitialQueue] = useState<number>(1240);

  if (!isOpen) return null;

  const handleInject = (e: React.FormEvent) => {
    e.preventDefault();
    const road = roads.find((r) => r.id === selectedRoadId);
    injectIncident({
      roadId: selectedRoadId,
      title,
      type,
      severity: 'CRITICAL',
      description: 'Lane blockage causing rapid queue accumulation.',
      lanesBlocked: 2,
      totalLanes: road?.lanes || 4,
      initialQueue,
    });
    onClose();
  };

  const handlePreset = (roadId: string, customTitle: string, customType: IncidentType, queueSize: number) => {
    setSelectedRoadId(roadId);
    setTitle(customTitle);
    setType(customType);
    setInitialQueue(queueSize);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#131926] border border-[#20293a] w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#20293a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white">Simulate Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#182030]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              Quick Benchmark Scenarios:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('R17', 'R17 Multi-Vehicle Collision', 'COLLISION', 1240)}
                className="p-2.5 rounded-lg bg-[#182030] hover:bg-[#20293a] text-left border border-[#20293a] transition-colors"
              >
                <span className="font-semibold text-white block">R17 Incident</span>
                <span className="text-[10px] text-slate-400">Queue: 1,240 vehicles</span>
              </button>

              <button
                type="button"
                onClick={() => handlePreset('R04', 'R04 Waterlogging', 'WATERLOGGING', 820)}
                className="p-2.5 rounded-lg bg-[#182030] hover:bg-[#20293a] text-left border border-[#20293a] transition-colors"
              >
                <span className="font-semibold text-white block">R04 Waterlogging</span>
                <span className="text-[10px] text-slate-400">Queue: 820 vehicles</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleInject} className="space-y-3 pt-2 border-t border-[#20293a]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Target Road:</label>
                <select
                  value={selectedRoadId}
                  onChange={(e) => setSelectedRoadId(e.target.value)}
                  className="w-full bg-[#182030] border border-[#20293a] rounded-md p-2 text-white text-xs outline-none"
                >
                  {roads.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Incident Type:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IncidentType)}
                  className="w-full bg-[#182030] border border-[#20293a] rounded-md p-2 text-white text-xs outline-none"
                >
                  <option value="COLLISION">Collision</option>
                  <option value="WATERLOGGING">Waterlogging</option>
                  <option value="VEHICLE_BREAKDOWN">Breakdown</option>
                  <option value="CONSTRUCTION">Construction</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Incident Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#182030] border border-[#20293a] rounded-md p-2 text-white text-xs outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Initial Queue (vehicles):</label>
              <input
                type="number"
                min="50"
                max="3000"
                step="50"
                value={initialQueue}
                onChange={(e) => setInitialQueue(Number(e.target.value))}
                className="w-full bg-[#182030] border border-[#20293a] rounded-md p-2 text-white font-mono text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                Simulate Incident
              </button>
            </div>
          </form>

          {/* Active Incidents */}
          {activeIncidents.length > 0 && (
            <div className="pt-3 border-t border-[#20293a]">
              <span className="text-[11px] text-slate-400 font-medium block mb-2">
                Active Incidents:
              </span>
              <div className="space-y-1.5">
                {activeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-md bg-[#182030] border border-[#20293a] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white block">{inc.roadId}: {inc.title}</span>
                      <span className="text-[10px] text-slate-400">Queue: {inc.initialQueue} vehicles</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearIncident(inc.roadId)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
