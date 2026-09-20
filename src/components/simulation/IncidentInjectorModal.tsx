import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import { IncidentData, RoadStatus } from '../../types/traffic';
import { api } from '../../services/api';

interface IncidentInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  roads: RoadStatus[];
  activeIncidents: IncidentData[];
  onIncidentAdded: () => void;
  onIncidentCleared: () => void;
}

export const IncidentInjectorModal: React.FC<IncidentInjectorModalProps> = ({
  isOpen,
  onClose,
  roads,
  activeIncidents,
  onIncidentAdded,
  onIncidentCleared,
}) => {
  const [segmentId, setSegmentId] = useState<string>(roads[0]?.segment_id || 'R0001');
  const [incidentType, setIncidentType] = useState<string>('lane_blockage');
  const [severity, setSeverity] = useState<number>(2);
  const [lanesBlocked, setLanesBlocked] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const presets = [
    { title: 'Severe Crash on R0360', seg: 'R0360', type: 'accident_like', sev: 3, blocked: 2, desc: 'Multi-vehicle accident blocking 2 lanes.' },
    { title: 'Stalled Truck on R0001', seg: 'R0001', type: 'stalled_vehicle', sev: 2, blocked: 1, desc: 'Heavy vehicle breakdown in center lane.' },
    { title: 'Emergency Roadwork R0168', seg: 'R0168', type: 'lane_blockage', sev: 2, blocked: 2, desc: 'Water pipeline maintenance lane restriction.' },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setSegmentId(p.seg);
    setIncidentType(p.type);
    setSeverity(p.sev);
    setLanesBlocked(p.blocked);
    setDescription(p.desc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createIncident({
        segment_id: segmentId,
        incident_type: incidentType,
        severity: Number(severity),
        lanes_blocked: Number(lanesBlocked),
        description: description || undefined,
      });
      onIncidentAdded();
      onClose();
    } catch (err) {
      console.error('Error creating incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async (incId: string) => {
    try {
      await api.clearIncident(incId);
      onIncidentCleared();
    } catch (err) {
      console.error('Error clearing incident:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131926] border border-[#20293a] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#20293a] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Inject Telemetry Incident</h2>
              <p className="text-xs text-slate-400">Simulate bottlenecks to observe real-time ripple & recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">⚡ Hackathon Scenarios:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-left bg-[#0d121f] border border-[#20293a] hover:border-cyan-500/50 p-2 rounded-lg transition"
              >
                <div className="text-xs font-bold text-white truncate">{p.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.seg} · Sev {p.sev}/3</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Target Segment</label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full bg-[#0d121f] border border-[#20293a] rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                {roads.map(r => (
                  <option key={r.segment_id} value={r.segment_id}>
                    {r.segment_id} ({r.road_class})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Incident Type</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full bg-[#0d121f] border border-[#20293a] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="lane_blockage">Lane Blockage</option>
                <option value="accident_like">Accident Collision</option>
                <option value="stalled_vehicle">Stalled Vehicle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Severity (1: Minor - 3: Major)</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full bg-[#0d121f] border border-[#20293a] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>1 - Minor Incident</option>
                <option value={2}>2 - Moderate Incident</option>
                <option value={3}>3 - Critical Gridlock</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Lanes Blocked</label>
              <select
                value={lanesBlocked}
                onChange={(e) => setLanesBlocked(Number(e.target.value))}
                className="w-full bg-[#0d121f] border border-[#20293a] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>1 Lane</option>
                <option value={2}>2 Lanes</option>
                <option value={3}>3 Lanes (Full Block)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Operator Notes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Collision at junction ingress..."
              className="w-full bg-[#0d121f] border border-[#20293a] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {loading ? 'Broadcasting to Network...' : 'Inject Active Incident'}
          </button>
        </form>

        {/* Active Incidents List */}
        {activeIncidents.length > 0 && (
          <div className="border-t border-[#20293a] pt-3 space-y-2">
            <span className="text-xs font-bold text-white">Active Network Incidents ({activeIncidents.length})</span>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {activeIncidents.map(inc => (
                <div key={inc.incident_id} className="bg-[#0d121f] border border-[#20293a] rounded-lg p-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-rose-400">{inc.segment_id} · {inc.incident_type} (Sev {inc.severity})</div>
                    <div className="text-[10px] text-slate-400">{inc.description || 'Active blockage'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClear(inc.incident_id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-emerald-400 bg-[#131926] px-2 py-1 rounded border border-[#20293a] hover:border-emerald-500/40 transition"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Clear
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
