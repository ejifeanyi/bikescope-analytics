import { useState, useEffect, useCallback, useRef } from "react";
import { apiService, ApiError } from "../services/api";
import type { Station, Alert, AnalyticsSummary } from "../types";

interface UseBikeDataReturn {
  stations: Station[];
  alerts: Alert[];
  analytics: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refetch: () => void;
}

interface UseBikeDataOptions {
  autoRefreshInterval?: number;
  enableAutoRefresh?: boolean;
}

export const useBikeData = (
  selectedTenant: string,
  options: UseBikeDataOptions = {}
): UseBikeDataReturn => {
  const {
    autoRefreshInterval = 60000,
    enableAutoRefresh = true,
  } = options;

  const [stations, setStations] = useState<Station[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setError(null);

      if (!lastUpdate) {
        setLoading(true);
      }

      const data = await apiService.getAllData(selectedTenant);

      if (abortController.signal.aborted) {
        return;
      }

      setStations(data.stations);
      setAlerts(data.alerts);
      setAnalytics(data.analytics);
      setLastUpdate(new Date());
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }

      const errorMessage =
        err instanceof ApiError
          ? `API Error: ${err.message}`
          : err instanceof Error
          ? err.message
          : "Unknown error occurred";

      setError(errorMessage);
      console.error("Error fetching bike data:", err);
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedTenant, lastUpdate]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setLoading(true);
    setLastUpdate(null); 
    fetchData();
  }, [selectedTenant]); 

  useEffect(() => {
    if (!enableAutoRefresh) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchData();
    }, autoRefreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, autoRefreshInterval, enableAutoRefresh]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    stations,
    alerts,
    analytics,
    loading,
    error,
    lastUpdate,
    refetch,
  };
};
