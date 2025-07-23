import React from "react";
import { RefreshCw } from "lucide-react";
import { TenantSelector } from "./TenantSelector";

interface AppHeaderProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
  lastUpdate: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  selectedTenant,
  onTenantChange,
  lastUpdate,
  onRefresh,
  loading,
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">BikeScope</h1>
            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Analytics
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <TenantSelector
              selectedTenant={selectedTenant}
              onTenantChange={onTenantChange}
            />

            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {lastUpdate && (
              <div className="text-xs text-gray-500">
                <div className="hidden sm:block">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
                <div className="sm:hidden">
                  {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
