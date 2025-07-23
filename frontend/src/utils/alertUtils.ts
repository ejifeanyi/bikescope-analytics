import type { AlertSeverity, AlertType } from "../types";

export const getSeverityStyles = (severity: AlertSeverity): string => {
  switch (severity) {
    case "critical":
      return "bg-red-50 border-red-200 text-red-800";
    case "warning":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    case "info":
      return "bg-blue-50 border-blue-200 text-blue-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
};

export const getAlertIcon = (type: AlertType): string => {
  switch (type) {
    case "low_bikes":
      return "🚲";
    case "full_station":
      return "🅿️";
    case "offline":
      return "⚠️";
    default:
      return "📊";
  }
};

export const formatAlertType = (type: AlertType): string => {
  switch (type) {
    case "low_bikes":
      return "Low Bikes";
    case "full_station":
      return "Station Full";
    case "offline":
      return "Station Offline";
    default:
      return "Unknown Alert";
  }
};

export const formatAlertTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};
