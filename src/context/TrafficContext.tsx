import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Road, Incident, TimelineStep, RecoveryPrediction, RipplePrediction, CombinedAdvisory } from '../types/traffic';
import { INITIAL_ROADS } from '../data/trafficDataset';
import { predictFutureTimeline } from '../services/timelinePredictor';
import { predictRecoveryTime } from '../services/recoveryPredictor';
import { predictRipplePropagation } from '../services/ripplePredictor';
import { generateCombinedAdvisory } from '../services/advisoryGenerator';

interface TrafficContextType {
  roads: Road[];
  selectedRoadId: string;
  selectedRoad: Road;
  currentTime: Date;
  isSimulating: boolean;
  timelinePredictions: TimelineStep[];
  recoveryPrediction: RecoveryPrediction;
  ripplePrediction: RipplePrediction;
  combinedAdvisory: CombinedAdvisory;
  activeIncidents: Incident[];
  customParams: {
    overrideQueue?: number;
    overrideCapacity?: number;
    overrideArrivalRate?: number;
  };
  setSelectedRoadId: (id: string) => void;
  toggleSimulation: () => void;
  fastForwardTime: (minutes: number) => void;
  injectIncident: (incident: Omit<Incident, 'id' | 'isCleared' | 'reportedTime'>) => void;
  clearIncident: (roadId: string) => void;
  updateRoadParams: (params: { queue?: number; capacity?: number; arrivalRate?: number }) => void;
  resetCustomParams: () => void;
  resetToDefaults: () => void;
}

const TrafficContext = createContext<TrafficContextType | undefined>(undefined);

export const TrafficProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roads, setRoads] = useState<Road[]>(INITIAL_ROADS);
  const [selectedRoadId, setSelectedRoadId] = useState<string>('R17');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [customParams, setCustomParams] = useState<{
    overrideQueue?: number;
    overrideCapacity?: number;
    overrideArrivalRate?: number;
  }>({});

  // Active selected road object
  const selectedRoad = useMemo(() => {
    return roads.find((r) => r.id === selectedRoadId) || roads[0];
  }, [roads, selectedRoadId]);

  // Active incidents list
  const activeIncidents = useMemo(() => {
    return roads
      .map((r) => r.activeIncident)
      .filter((inc): inc is Incident => inc !== null && !inc.isCleared);
  }, [roads]);

  // Core predictions computed reactively
  const timelinePredictions = useMemo(() => {
    return predictFutureTimeline(selectedRoad, currentTime);
  }, [selectedRoad, currentTime]);

  const recoveryPrediction = useMemo(() => {
    return predictRecoveryTime(selectedRoad, customParams, currentTime);
  }, [selectedRoad, customParams, currentTime]);

  const ripplePrediction = useMemo(() => {
    return predictRipplePropagation(selectedRoad, roads, 18);
  }, [selectedRoad, roads]);

  const combinedAdvisory = useMemo(() => {
    return generateCombinedAdvisory(selectedRoad, timelinePredictions, recoveryPrediction, ripplePrediction);
  }, [selectedRoad, timelinePredictions, recoveryPrediction, ripplePrediction]);

  // Live simulation tick
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => new Date(prev.getTime() + 1000));

      setRoads((prevRoads) =>
        prevRoads.map((road) => {
          if (road.id === selectedRoadId && Object.keys(customParams).length > 0) {
            return road;
          }

          const jitter = (Math.random() - 0.49) * 0.8;
          let newSpeed = Math.round((road.currentSpeed + jitter) * 10) / 10;
          newSpeed = Math.max(5, Math.min(road.freeFlowSpeed, newSpeed));

          let newQueue = road.currentQueue;
          if (road.activeIncident?.isCleared && road.currentQueue > 0) {
            const drainRate = Math.max(5, Math.round((road.capacity - road.arrivalRate) / 60));
            newQueue = Math.max(0, road.currentQueue - drainRate);
          }

          return {
            ...road,
            currentSpeed: newSpeed,
            currentQueue: newQueue,
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, selectedRoadId, customParams]);

  const toggleSimulation = () => setIsSimulating((prev) => !prev);

  const fastForwardTime = (minutes: number) => {
    setCurrentTime((prev) => new Date(prev.getTime() + minutes * 60 * 1000));
  };

  const injectIncident = (data: Omit<Incident, 'id' | 'isCleared' | 'reportedTime'>) => {
    const newIncident: Incident = {
      ...data,
      id: `INC-${Date.now().toString().slice(-4)}`,
      isCleared: false,
      reportedTime: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRoads((prevRoads) =>
      prevRoads.map((road) => {
        if (road.id === data.roadId) {
          return {
            ...road,
            currentSpeed: Math.max(8, Math.round(road.currentSpeed * 0.45)),
            currentQueue: road.currentQueue + data.initialQueue,
            speedTrend: -4.5,
            activeIncident: newIncident,
          };
        }
        return road;
      })
    );
    setSelectedRoadId(data.roadId);
  };

  const clearIncident = (roadId: string) => {
    setRoads((prevRoads) =>
      prevRoads.map((road) => {
        if (road.id === roadId && road.activeIncident) {
          return {
            ...road,
            activeIncident: {
              ...road.activeIncident,
              isCleared: true,
              clearedAt: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          };
        }
        return road;
      })
    );
  };

  const updateRoadParams = (params: { queue?: number; capacity?: number; arrivalRate?: number }) => {
    setCustomParams((prev) => ({
      overrideQueue: params.queue ?? prev.overrideQueue,
      overrideCapacity: params.capacity ?? prev.overrideCapacity,
      overrideArrivalRate: params.arrivalRate ?? prev.overrideArrivalRate,
    }));
  };

  const resetCustomParams = () => {
    setCustomParams({});
  };

  const resetToDefaults = () => {
    setRoads(INITIAL_ROADS);
    setSelectedRoadId('R17');
    setCustomParams({});
    setCurrentTime(new Date());
  };

  return (
    <TrafficContext.Provider
      value={{
        roads,
        selectedRoadId,
        selectedRoad,
        currentTime,
        isSimulating,
        timelinePredictions,
        recoveryPrediction,
        ripplePrediction,
        combinedAdvisory,
        activeIncidents,
        customParams,
        setSelectedRoadId,
        toggleSimulation,
        fastForwardTime,
        injectIncident,
        clearIncident,
        updateRoadParams,
        resetCustomParams,
        resetToDefaults,
      }}
    >
      {children}
    </TrafficContext.Provider>
  );
};

export const useTraffic = () => {
  const context = useContext(TrafficContext);
  if (!context) {
    throw new Error('useTraffic must be used within a TrafficProvider');
  }
  return context;
};
