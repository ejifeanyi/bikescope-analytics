import React, { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { StationMap } from "./components/StationMap";
import { AlertsFeed } from "./components/AlertsFeed";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import {
  MainLoadingState,
  MapLoadingSkeleton,
  AlertsLoadingSkeleton,
  AnalyticsLoadingSkeleton,
  ErrorState,
} from "./components/LoadingStates";
import { useBikeData } from "./hooks/useBikeData";
import type { TenantId } from "./types";

const AppContent: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<TenantId>("manhattan");

  const { stations, alerts, analytics, loading, error, lastUpdate, refetch } =
    useBikeData(selectedTenant, {
      autoRefreshInterval: 60000,
      enableAutoRefresh: true,
    });

  const handleTenantChange = (tenant: string) => {
    setSelectedTenant(tenant as TenantId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        selectedTenant={selectedTenant}
        onTenantChange={handleTenantChange}
        lastUpdate={lastUpdate}
        onRefresh={refetch}
        loading={loading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : loading && !lastUpdate ? (
          <MainLoadingState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              {loading && !stations.length ? (
                <MapLoadingSkeleton />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Live Station Map
                    </h2>
                    <span className="text-sm text-gray-500">
                      {stations.length} stations
                    </span>
                  </div>
                  <StationMap
                    stations={stations}
                    selectedTenant={selectedTenant}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Alerts Feed */}
              {loading && !alerts.length ? (
                <AlertsLoadingSkeleton />
              ) : (
                <AlertsFeed alerts={alerts} />
              )}

              {/* Analytics Panel */}
              {loading && !analytics ? (
                <AnalyticsLoadingSkeleton />
              ) : (
                <AnalyticsPanel analytics={analytics} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const BikeScope: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default BikeScope;
