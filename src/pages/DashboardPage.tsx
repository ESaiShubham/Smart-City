import React from 'react';
import { RoadStatus, ForecastData, RecoveryData, RippleData, AdvisoryData, DiversionData, DashboardSummary } from '../types/traffic';
import { StatusRibbon } from '../components/layout/StatusRibbon';
import { RoadNetworkMap } from '../components/map/RoadNetworkMap';
import { TimelineView } from '../components/features/TimelineView';
import { RecoveryView } from '../components/features/RecoveryView';
import { RippleView } from '../components/features/RippleView';
import { AdvisoryCard } from '../components/features/AdvisoryCard';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  roads: RoadStatus[];
  selectedRoad: RoadStatus | null;
  selectedRoadId: string | null;
  onSelectRoad: (id: string) => void;
  forecast: ForecastData | null;
  recoveryData: RecoveryData | null;
  rippleData: RippleData | null;
  advisoryData: AdvisoryData | null;
  diversionData: DiversionData | null;
  isLoading: boolean;
  onRefreshRecovery: (queue?: number, arrival?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  roads,
  selectedRoad,
  selectedRoadId,
  onSelectRoad,
  forecast,
  recoveryData,
  rippleData,
  advisoryData,
  diversionData,
  isLoading,
  onRefreshRecovery,
}) => {
  return (
    <div className="max-w-[1720px] mx-auto p-3 sm:p-4 space-y-3.5">
      {/* Top Corridors Ribbon */}
      <StatusRibbon
        summary={summary}
        roads={roads}
        selectedRoadId={selectedRoadId}
        onSelectRoad={onSelectRoad}
      />

      {/* 2-Column Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (5.5 cols): Map + Combined Advisory */}
        <div className="lg:col-span-6 space-y-3.5">
          <RoadNetworkMap
            roads={roads}
            selectedRoadId={selectedRoadId}
            onSelectRoad={onSelectRoad}
            rippleData={rippleData}
            diversionData={diversionData}
          />

          <AdvisoryCard
            road={selectedRoad}
            advisory={advisoryData}
            diversion={diversionData}
          />
        </div>

        {/* Right Column (6.5 cols): 3 Predictive Pillars */}
        <div className="lg:col-span-6 space-y-3.5">
          {/* 1. Future Traffic Timeline */}
          <TimelineView
            road={selectedRoad}
            forecast={forecast}
            isLoading={isLoading}
          />

          {/* 2. Recovery-Time Prediction */}
          <RecoveryView
            road={selectedRoad}
            recoveryData={recoveryData}
            onRefreshRecovery={onRefreshRecovery}
          />

          {/* 3. Ripple Prediction */}
          <RippleView
            road={selectedRoad}
            rippleData={rippleData}
            onSelectAffectedRoad={onSelectRoad}
          />
        </div>
      </div>
    </div>
  );
};
