import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { DemoPage } from './pages/DemoPage';
import { WhatIfDrawer } from './components/features/WhatIfDrawer';
import { IncidentInjectorModal } from './components/simulation/IncidentInjectorModal';
import { useTrafficSocket } from './hooks/useTrafficSocket';
import { api } from './services/api';
import {
  RoadStatus,
  ForecastData,
  RecoveryData,
  RippleData,
  AdvisoryData,
  DiversionData,
} from './types/traffic';
import { AlertTriangle } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'demo'>('dashboard');
  const [roads, setRoads] = useState<RoadStatus[]>([]);
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  // Deep feature state
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [rippleData, setRippleData] = useState<RippleData | null>(null);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryData | null>(null);
  const [diversionData, setDiversionData] = useState<DiversionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals
  const [isInjectModalOpen, setIsInjectModalOpen] = useState<boolean>(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);

  // Fetch all road states
  const fetchRoads = useCallback(async () => {
    try {
      const data = await api.getCurrentTraffic();
      if (data && data.length > 0) {
        setRoads(data);
        if (!selectedRoadId) {
          // Default to R17 / R0017 matching dashboard preset, or incident road
          const r17 = data.find(r => r.segment_id === 'R0017' || r.segment_id === 'R17');
          const incRoad = data.find(r => r.active_incident);
          setSelectedRoadId(r17 ? r17.segment_id : incRoad ? incRoad.segment_id : data[0].segment_id);
        }
      }
    } catch (err) {
      console.error('Error fetching current traffic:', err);
    }
  }, [selectedRoadId]);

  // WebSocket hook with tick callback
  const handleWsTick = useCallback(() => {
    fetchRoads();
  }, [fetchRoads]);

  const { isConnected, summary, activeIncidents } = useTrafficSocket(handleWsTick);

  // Initial load
  useEffect(() => {
    fetchRoads();
  }, [fetchRoads]);

  // Fetch predictions whenever selected road changes
  const fetchRoadDetails = useCallback(async (segId: string) => {
    setIsLoading(true);
    try {
      const [fRes, recRes, ripRes, advRes, divRes] = await Promise.all([
        api.getForecast(segId).catch(() => null),
        api.getRecovery(segId).catch(() => null),
        api.getRipple(segId).catch(() => null),
        api.getAdvisory(segId).catch(() => null),
        api.getDiversion(segId).catch(() => null),
      ]);
      setForecast(fRes);
      setRecoveryData(recRes);
      setRippleData(ripRes);
      setAdvisoryData(advRes);
      setDiversionData(divRes);
    } catch (err) {
      console.error('Error fetching road details:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoadId) {
      fetchRoadDetails(selectedRoadId);
    }
  }, [selectedRoadId, fetchRoadDetails]);

  const handleSelectRoad = (id: string) => {
    setSelectedRoadId(id);
  };

  const handleControlSimulation = async (action: 'play' | 'pause' | 'reset' | 'speed', speed?: number) => {
    try {
      await api.controlSimulation(action, speed);
      fetchRoads();
    } catch (err) {
      console.error('Error controlling simulation:', err);
    }
  };

  const selectedRoad = roads.find(r => r.segment_id === selectedRoadId) || roads[0] || null;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        summary={summary}
        isConnected={isConnected}
        onOpenInjectModal={() => setIsInjectModalOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onControlSimulation={handleControlSimulation}
        currentView={currentView}
        onChangeView={setCurrentView}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentView === 'dashboard' ? (
          <DashboardPage
            summary={summary}
            roads={roads}
            selectedRoad={selectedRoad}
            selectedRoadId={selectedRoadId}
            onSelectRoad={handleSelectRoad}
            forecast={forecast}
            recoveryData={recoveryData}
            rippleData={rippleData}
            advisoryData={advisoryData}
            diversionData={diversionData}
            isLoading={isLoading}
            onRefreshRecovery={(q, a) => {
              if (selectedRoadId) api.getRecovery(selectedRoadId, q, a).then(setRecoveryData);
            }}
          />
        ) : (
          <DemoPage
            roads={roads}
            onSelectRoad={handleSelectRoad}
            onRefreshAll={() => {
              fetchRoads();
              if (selectedRoadId) fetchRoadDetails(selectedRoadId);
            }}
          />
        )}
      </main>

      {/* Modals and Drawers */}
      <IncidentInjectorModal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        roads={roads}
        activeIncidents={activeIncidents}
        onIncidentAdded={() => {
          fetchRoads();
          if (selectedRoadId) fetchRoadDetails(selectedRoadId);
        }}
        onIncidentCleared={() => {
          fetchRoads();
          if (selectedRoadId) fetchRoadDetails(selectedRoadId);
        }}
      />

      <WhatIfDrawer
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        roads={roads}
        selectedRoadId={selectedRoadId}
      />

      {/* Footer */}
      <footer className="border-t border-[#20293a] bg-[#0c101b] px-4 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SAATHI v1.0.0 · Neurax Hackathon 3.0 (Smart Cities AI)</span>
          <span>Team Buggie: E Sai Shubham · Aastha Tiwari · Janvi Gadge</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
