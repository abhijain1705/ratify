import React, { useState, useEffect, useCallback } from "react";
import AzoreLogo from "@/assets/azure.png";
import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useConnector } from "@/context/ConnectorContext";

// Types
export interface UsedCapacityMetricDataPoint {
  time_stamp: string;
  average: number;
}

interface UsedCapacityProps {
  resourceGroup?: string;
  storageAccount?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Utility functions
const formatBytes = (bytes: number): string => {
  if (!bytes || isNaN(bytes)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const fetchUsedCapacityMetrics = async (
  token: string,
  resourceGroup: string,
  storageAccount: string
) => {
  const response = await fetch(
    "http://127.0.0.1:8000/api/azure/storage-metrics",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        resource_group: resourceGroup,
        storage_account: storageAccount,
        metric_name: "UsedCapacity",
      }),
    }
  );
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

interface UsedCapacityProps {
  data: UsedCapacityMetricDataPoint[];
  loading: boolean;
  error: string | null;
}

export const UsedCapacityComponent: React.FC<UsedCapacityProps> = ({
  data, error, loading
}) => {


  const currentValue = data.length > 0 ? data[data.length - 1].average : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].average : 0;
  const change = currentValue - previousValue;
  const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  const chartData = data.map((point) => ({
    ...point,
    formattedTime: formatTimestamp(point.time_stamp),
    value: point.average,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span style={{ color: "#3B82F6" }}>●</span>
            {` Used Capacity: ${formatBytes(payload[0]?.value ?? 0)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const stats = data.length > 0
    ? {
      min: Math.min(...data.map((d) => d.average)),
      max: Math.max(...data.map((d) => d.average)),
      avg: data.reduce((sum, d) => sum + d.average, 0) / Math.max(data.length, 1),
    }
    : { min: 0, max: 0, avg: 0 };


  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-6 flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500">.........</div>
      </div>
    )
  }

  // Error conditional rendering
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-6 flex flex-col items-center justify-center h-96">
        <div className="flex items-center mb-4 gap-3">
          <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
          <h2 className="text-lg font-semibold mb-2">Used Capacity</h2>
        </div>
        <div className="text-4xl mb-2 text-red-500">⚠️</div>
        <div className="text-lg font-semibold text-red-600 mb-2">Error</div>
        <div className="text-gray-700 text-center">{error}</div>

      </div>
    );
  }


  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📊</span>
          <div>
            <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
            <h3 className="text-lg font-semibold text-gray-900">Used Capacity</h3>
            <p className="text-sm text-gray-500">
              The amount of storage used by the storage account
            </p>
          </div>
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-blue-600">{formatBytes(currentValue)}</span>
          {data.length > 1 && (
            <div className={`flex items-center space-x-1 text-sm ${change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-gray-500"}`}>
              <span>{change > 0 ? "↗️" : change < 0 ? "↘️" : "➡️"}</span>
              <span>{Math.abs(changePercentage).toFixed(1)}%</span>
            </div>
          )}
        </div>
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
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="gradientUsedCapacity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="formattedTime" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={{ stroke: "#e5e7eb" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={{ stroke: "#e5e7eb" }} tickFormatter={(value) => formatBytes(Number(value) || 0)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#gradientUsedCapacity)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Stats */}
      {
        data.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-500">Min</div>
                <div className="font-medium">{formatBytes(stats.min)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Max</div>
                <div className="font-medium">{formatBytes(stats.max)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Avg</div>
                <div className="font-medium">{formatBytes(stats.avg)}</div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default UsedCapacityComponent;
