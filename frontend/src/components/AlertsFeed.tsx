import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  getSeverityStyles,
  getAlertIcon,
  formatAlertType,
  formatAlertTime,
} from "../utils/alertUtils";
import type { AlertsFeedProps, Alert } from "../types";

const AlertItem: React.FC<{ alert: Alert }> = ({ alert }) => {
  const severityStyles = getSeverityStyles(alert.severity);
  const icon = getAlertIcon(alert.type);
  const formattedType = formatAlertType(alert.type);
  const formattedTime = formatAlertTime(alert.timestamp);

  return (
    <div className={`p-3 rounded-lg border ${severityStyles}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg" role="img" aria-label={formattedType}>
            {icon}
          </span>

          <div className="flex-1">
            <p className="font-medium text-sm">
              {alert.station_name || `Station ${alert.station_id}`}
            </p>
            <p className="text-xs opacity-75">
              {formattedType} • {alert.severity.toUpperCase()}
            </p>
          </div>
        </div>

        <time className="text-xs opacity-75 ml-2" dateTime={alert.timestamp}>
          {formattedTime}
        </time>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="text-center py-8 text-gray-500">
    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
    <p className="text-sm">No recent alerts</p>
    <p className="text-xs mt-1">All stations are operating normally</p>
  </div>
);

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts }) => {
  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold flex items-center text-gray-900">
          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
          Recent Alerts
          {alerts.length > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </h3>
      </div>

      <div className="p-4">
        {alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sortedAlerts.map((alert, index) => (
              <AlertItem
                key={`${alert.station_id}-${alert.timestamp}-${index}`}
                alert={alert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
