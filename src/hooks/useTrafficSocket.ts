import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardSummary, IncidentData } from '../types/traffic';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/traffic';

interface WebSocketState {
  isConnected: boolean;
  lastMessage: any;
  summary: DashboardSummary | null;
  activeIncidents: IncidentData[];
}

export function useTrafficSocket(onTick?: (data: any) => void) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    summary: null,
    activeIncidents: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket Connected to SAATHI Central Traffic Stream');
        setState(prev => ({ ...prev, isConnected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          if (type === 'connection_established') {
            setState(prev => ({
              ...prev,
              summary: data.summary,
              activeIncidents: data.active_incidents || [],
            }));
          } else if (type === 'simulation_tick') {
            setState(prev => ({
              ...prev,
              summary: data.summary,
              activeIncidents: data.active_incidents || [],
              lastMessage: payload,
            }));
            if (onTick) onTick(data);
          } else if (type === 'incident_created' || type === 'incident_cleared') {
            setState(prev => ({ ...prev, lastMessage: payload }));
            if (onTick) onTick(payload);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.warn('⚠️ WebSocket Disconnected. Retrying in 3 seconds...');
        setState(prev => ({ ...prev, isConnected: false }));
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        ws.close();
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    }
  }, [onTick]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendCommand = (action: string, payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    }
  };

  return {
    ...state,
    sendCommand,
  };
}
