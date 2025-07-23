import type { Station, Alert, AnalyticsSummary } from "../types";

const API_BASE = "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status
    );
  }
  return response.json();
};

export const apiService = {
  getStations: async (tenantId: string): Promise<Station[]> => {
    const response = await fetch(`${API_BASE}/stations/${tenantId}`);
    return handleResponse<Station[]>(response);
  },

  getAlerts: async (tenantId: string, limit?: number): Promise<Alert[]> => {
    const url = new URL(`${API_BASE}/alerts/${tenantId}`);
    if (limit) {
      url.searchParams.append("limit", limit.toString());
    }
    const response = await fetch(url.toString());
    return handleResponse<Alert[]>(response);
  },

  getAnalytics: async (tenantId: string): Promise<AnalyticsSummary> => {
    const response = await fetch(`${API_BASE}/analytics/${tenantId}`);
    return handleResponse<AnalyticsSummary>(response);
  },

  refreshStations: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/stations/refresh`, {
      method: "POST",
    });
    return handleResponse<{ message: string }>(response);
  },

  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; timestamp: string }>(response);
  },

  getAllData: async (tenantId: string) => {
    const [stations, alerts, analytics] = await Promise.all([
      apiService.getStations(tenantId),
      apiService.getAlerts(tenantId),
      apiService.getAnalytics(tenantId),
    ]);

    return { stations, alerts, analytics };
  },
};

export { ApiError };
