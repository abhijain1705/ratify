"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Types
interface MetricDataPoint {
  time_stamp: string;
  average: number;
}

interface SuccessServerLatencyProps {
  resourceGroup?: string;
  storageAccount?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Utils
const formatMilliseconds = (ms: number): string => {
  if (ms < 1000) {
    return `${ms.toFixed(1)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getStatusColor = (value: number, threshold: number = 100): string => {
  if (value <= threshold) return "text-green-600";
  if (value <= threshold * 1.5) return "text-yellow-600";
  return "text-red-600";
};

const fetchSuccessServerLatencyMetrics = async (
  resourceGroup: string,
  storageAccount: string
) => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/azure/storage-metrics",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_group: resourceGroup,
          storage_account: storageAccount,
          metric_name: "SuccessServerLatency",
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

// Main Component
export const SuccessServerLatencyComponent: React.FC<
  SuccessServerLatencyProps
> = ({
  resourceGroup = "ratify-group",
  storageAccount = "ratifyhackathon",
  autoRefresh = true,
  refreshInterval = 60000,
}) => {
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const threshold = 100; // 100ms

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchSuccessServerLatencyMetrics(
        resourceGroup,
        storageAccount
      );

      if (response.metrics && response.metrics.length > 0) {
        const timeseries = response.metrics[0].timeseries;
        if (timeseries && timeseries.length > 0) {
          setData(timeseries[0].data || []);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resourceGroup, storageAccount]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const currentValue = data.length > 0 ? data[data.length - 1].average : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].average : 0;
  const change = currentValue - previousValue;
  const changePercentage =
    previousValue !== 0 ? (change / previousValue) * 100 : 0;

  const chartData = data.map((point) => ({
    ...point,
    formattedTime: formatTimestamp(point.time_stamp),
    value: point.average,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-blue-900 text-white p-3 rounded-lg shadow-lg border border-blue-700">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span style={{ color: "#2563eb" }}>●</span>
            {` Latency: ${formatMilliseconds(payload[0].value)}`}
          </p>
          {payload[0].value > threshold && (
            <p className="text-xs text-red-400 mt-1">⚠️ Above threshold</p>
          )}
        </div>
      );
    }
    return null;
  };

  const stats =
    data.length > 0
      ? {
          min: Math.min(...data.map((d) => d.average)),
          max: Math.max(...data.map((d) => d.average)),
          avg: data.reduce((sum, d) => sum + d.average, 0) / data.length,
          p95:
            data.map((d) => d.average).sort((a, b) => a - b)[
              Math.floor(data.length * 0.95)
            ] || 0,
        }
      : { min: 0, max: 0, avg: 0, p95: 0 };

  const statusColor = getStatusColor(currentValue, threshold);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              Server Latency
            </h3>
            <p className="text-sm text-gray-500">
              Avg latency for Azure Storage to process successful requests
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
          <button
            onClick={fetchData}
            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            title="Refresh"
          >
            🔄
          </button>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${statusColor}`}>
            {formatMilliseconds(currentValue)}
          </span>
          {data.length > 1 && (
            <div
              className={`flex items-center space-x-1 text-sm ${
                change > 0
                  ? "text-red-500"
                  : change < 0
                  ? "text-green-500"
                  : "text-gray-500"
              }`}
            >
              <span>{change > 0 ? "↗️" : change < 0 ? "↘️" : "➡️"}</span>
              <span>{Math.abs(changePercentage).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Threshold: {formatMilliseconds(threshold)}
        </div>
        {currentValue > threshold && (
          <div className="text-sm text-red-600 mt-1 flex items-center">
            <span className="mr-1">⚠️</span>
            Above recommended threshold
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mt-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500">
            <div className="text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div>{error}</div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="formattedTime"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => formatMilliseconds(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
  y={threshold}
  stroke="#ef4444"
  strokeDasharray="5 5"
  label="Threshold"
/>

              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Stats */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Min</div>
              <div className="font-medium">{formatMilliseconds(stats.min)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Avg</div>
              <div className="font-medium">{formatMilliseconds(stats.avg)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">P95</div>
              <div className="font-medium">{formatMilliseconds(stats.p95)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Max</div>
              <div className="font-medium">{formatMilliseconds(stats.max)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessServerLatencyComponent;
