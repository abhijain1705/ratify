"use client";
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
export interface EgressMetricDataPoint {
  time_stamp: string;
  average?: number; // average can be missing
}

interface EgressProps {
  resourceGroup?: string;
  storageAccount?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Utility functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};



export const fetchEgressMetrics = async (
  token: string,
  resourceGroup: string,
  storageAccount: string
) => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/azure/storage-metrics",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          resource_group: resourceGroup,
          storage_account: storageAccount,
          metric_name: "Egress",
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

interface EgressProps {
  data: EgressMetricDataPoint[];
  loading: boolean;
  error: string | null;
}

// Main Component
export const EgressComponent: React.FC<EgressProps> = ({ data, loading, error }: EgressProps) => {


  // Only use data points with an 'average'
  const validData = data;

  const currentValue = validData.length > 0 ? validData[validData.length - 1].average! : 0;
  const previousValue = validData.length > 1 ? validData[validData.length - 2].average! : 0;
  const change = currentValue - previousValue;
  const changePercentage =
    previousValue !== 0 ? (change / previousValue) * 100 : 0;

  const chartData = validData.map((point) => ({
    ...point,
    formattedTime: formatTimestamp(point.time_stamp),
    value: point.average!
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-blue-900 text-white p-3 rounded-lg shadow-lg border border-blue-700">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span style={{ color: "#2563eb" }}>●</span>
            {` Egress: ${formatBytes(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const stats =
    validData.length > 0
      ? {
        min: Math.min(...validData.map((d) => d.average!)),
        max: Math.max(...validData.map((d) => d.average!)),
        avg: validData.reduce((sum, d) => sum + d.average!, 0) / validData.length,
        total: validData.reduce((sum, d) => sum + d.average!, 0),
      }
      : { min: 0, max: 0, avg: 0, total: 0 };



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
          <h2 className="text-lg font-semibold mb-2">Egress</h2>
        </div>
        <div className="text-4xl mb-2 text-red-500">⚠️</div>
        <div className="text-lg font-semibold text-red-600 mb-2">Error</div>
        <div className="text-gray-700 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⬆️</span>
          <div>
            <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
            <h3 className="text-lg font-semibold text-blue-800">Egress</h3>
            <p className="text-sm text-gray-500">
              Amount of egress data in bytes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-blue-600">
            {formatBytes(currentValue)}
          </span>
          {validData.length > 1 && (
            <div
              className={`flex items-center space-x-1 text-sm ${change > 0
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
          Total egress: {formatBytes(stats.total)}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradientEgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="formattedTime"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => formatBytes(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#gradientEgress)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Stats */}
      {validData.length > 0 && (
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
      )}
    </div>
  );
};

export default EgressComponent;