import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Clock, TrendingUp, Users } from "lucide-react";
import type { AnalyticsPanelProps, AnalyticsSummary } from "../types";

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}> = ({ icon, label, value, bgColor, iconColor }) => (
  <div className={`${bgColor} p-4 rounded-lg`}>
    <div className="flex items-center space-x-3">
      <div className={`${iconColor}`}>{icon}</div>
      <div>
        <p className={`text-xs ${iconColor} font-medium`}>{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const TopStationsChart: React.FC<{ analytics: AnalyticsSummary }> = ({
  analytics,
}) => {
  const chartData = analytics.top_stations.map((station, index) => ({
    name:
      station.name.length > 15
        ? `${station.name.substring(0, 15)}...`
        : station.name,
    trips: station.trip_count,
    fullName: station.name,
    rank: index + 1,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">{data.trips}</span>{" "}
            trips
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold mb-3 text-gray-900">
        Top 5 Stations (Last 30 Days)
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#666" }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#666" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="trips"
            fill="#3b82f6"
            radius={[2, 2, 0, 0]}
            strokeWidth={0}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-4 border-b border-gray-100">
      <h3 className="text-lg font-semibold flex items-center text-gray-900">
        <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
        Analytics
      </h3>
    </div>
    <div className="p-4">
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    </div>
  </div>
);

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  analytics,
}) => {
  if (!analytics) {
    return <LoadingState />;
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold flex items-center text-gray-900">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Analytics
          <span className="ml-2 text-xs text-gray-500 font-normal">
            Last 30 Days
          </span>
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label="Total Trips"
            value={formatNumber(analytics.total_trips)}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
          />

          <MetricCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Trip Duration"
            value={formatDuration(analytics.avg_trip_duration)}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
          />

          <MetricCard
            icon={<Activity className="w-5 h-5" />}
            label="Peak Usage Hour"
            value={formatHour(analytics.peak_hour)}
            bgColor="bg-green-50"
            iconColor="text-green-600"
          />
        </div>

        {/* Top Stations Chart */}
        <TopStationsChart analytics={analytics} />
      </div>
    </div>
  );
};
