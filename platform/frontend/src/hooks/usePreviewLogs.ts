import { useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5157';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'stdout' | 'stderr';
  level: 'info' | 'error' | 'warning';
  isError: boolean;
}

export interface UsePreviewLogsOptions {
  previewId: string;
  autoConnect?: boolean;
}

export const usePreviewLogs = ({ previewId, autoConnect = true }: UsePreviewLogsOptions) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const connect = useCallback(async () => {
    if (connectionRef.current) {
      return; // Already connected
    }

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_URL}/hubs/preview-logs`, {
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connection.on('LogLine', (logEntry: LogEntry) => {
        setLogs((prev) => [...prev, logEntry]);
      });

      connection.on('StreamError', (errorInfo: { error: string; message: string }) => {
        setError(errorInfo.message);
        console.error('Stream error:', errorInfo);
      });

      connection.onreconnecting(() => {
        setIsConnected(false);
        setError('Reconnecting...');
      });

      connection.onreconnected(() => {
        setIsConnected(true);
        setError(null);
        // Rejoin the preview room after reconnection
        if (connectionRef.current) {
          connectionRef.current.invoke('JoinPreviewRoom', previewId).catch((err) => {
            console.error('Failed to rejoin preview room:', err);
          });
        }
      });

      connection.onclose(() => {
        setIsConnected(false);
      });

      await connection.start();
      await connection.invoke('JoinPreviewRoom', previewId);

      connectionRef.current = connection;
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to log stream';
      setError(errorMessage);
      console.error('SignalR connection error:', err);
    }
  }, [previewId]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.invoke('LeavePreviewRoom', previewId);
        await connectionRef.current.stop();
      } catch (err) {
        console.error('Error disconnecting:', err);
      } finally {
        connectionRef.current = null;
        setIsConnected(false);
      }
    }
  }, [previewId]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (connectionRef.current) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  return {
    logs,
    isConnected,
    error,
    connect,
    disconnect,
    clearLogs,
  };
};
