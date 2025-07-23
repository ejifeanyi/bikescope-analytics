import React from "react";
import { MapPin, Activity, AlertTriangle } from "lucide-react";

export const MainLoadingState: React.FC = () => (
  <div className="flex justify-center items-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="text-gray-600">
        <p className="text-lg font-medium">Loading BikeScope</p>
        <p className="text-sm mt-1">Fetching station data...</p>
      </div>
    </div>
  </div>
);

export const MapLoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <div className="animate-pulse bg-gray-300 h-6 w-32 rounded"></div>
      </div>
      <div className="animate-pulse bg-gray-300 h-4 w-20 rounded"></div>
    </div>

    <div className="h-96 w-full rounded-lg bg-gray-200 animate-pulse flex items-center justify-center">
      <div className="text-center text-gray-500">
        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading map...</p>
      </div>
    </div>
  </div>
);

export const AlertsLoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-gray-300" />
        <div className="animate-pulse bg-gray-300 h-6 w-32 rounded"></div>
      </div>
    </div>

    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-gray-300 rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AnalyticsLoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center">
        <Activity className="w-5 h-5 mr-2 text-gray-300" />
        <div className="animate-pulse bg-gray-300 h-6 w-24 rounded"></div>
      </div>
    </div>

    <div className="p-4 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-20"></div>
                <div className="h-5 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="animate-pulse bg-gray-300 h-4 w-32 rounded"></div>
        <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
    <h3 className="text-lg font-medium text-red-800 mb-2">
      Unable to Load Data
    </h3>
    <p className="text-red-600 text-sm mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium"
    >
      Try Again
    </button>
  </div>
);
