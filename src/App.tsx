import React from 'react';
import { TrafficProvider } from './context/TrafficContext';
import { Header } from './components/layout/Header';
import { StatusRibbon } from './components/layout/StatusRibbon';
import { RoadNetworkMap } from './components/map/RoadNetworkMap';
import { TimelineView } from './components/features/TimelineView';
import { RecoveryView } from './components/features/RecoveryView';
import { RippleView } from './components/features/RippleView';
import { AdvisoryCard } from './components/features/AdvisoryCard';

const DashboardContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-blue-500/20 selection:text-blue-300">
      {/* Clean Navbar */}
      <Header />

      {/* Corridor Selector Strip */}
      <StatusRibbon />

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Map & Advisory (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <RoadNetworkMap />
            <AdvisoryCard />
          </div>

          {/* Right Column: 3 Core Features (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Feature 1: Future Traffic Timeline */}
            <TimelineView />

            {/* Feature 2: Recovery-Time Prediction */}
            <RecoveryView />

            {/* Feature 3: Ripple Prediction */}
            <RippleView />
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#20293a] bg-[#0b0f17] px-4 lg:px-8 py-3 text-xs text-slate-400">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🛰️ SAATHI · Domain 1: AI in Smart Cities (Neurax Hackathon 3.0)</span>
          <span>Team Buggie: E Sai Shubham · Aastha Tiwari · Janvi Gadge</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TrafficProvider>
      <DashboardContent />
    </TrafficProvider>
  );
};

export default App;
