import React, { useState, useEffect, useCallback } from "react";
import AzoreLogo from "@/assets/azure.png";
import Image from "next/image";
import { useConnector } from "@/context/ConnectorContext";

// Types
export interface MetricDataPoint {
  time_stamp: string;
  average?: number; // allow optional
}

interface AvailabilityProps {
  resourceGroup?: string;
  storageAccount?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Utility functions
const formatPercentage = (percent: number): string => {
  return `${percent.toFixed(3)}%`;
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getStatusColor = (value: number, threshold: number = 99.9): string => {
  if (value >= threshold) return "text-green-600";
  if (value >= threshold - 0.5) return "text-yellow-600";
  return "text-red-600";
};

const getGaugeColor = (value: number, threshold: number = 99.9): string => {
  if (value >= threshold) return "#0284C7"; // blue-600
  if (value >= threshold - 0.5) return "#F59E0B"; // amber-500
  return "#EF4444"; // red-500
};


// API fetch
export const fetchAvailabilityMetrics = async (
  token: string | null,
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
          metric_name: "Availability",
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

// Gauge Chart
const GaugeChart: React.FC<{ value: number; threshold: number }> = ({
  value,
  threshold,
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  const strokeColor = getGaugeColor(value, threshold);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-40 h-40 mb-4">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={strokeColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getStatusColor(value, threshold)}`}>
            {formatPercentage(value)}
          </span>
          <span className="text-sm text-gray-500">Uptime</span>
        </div>
      </div>
    </div>
  );
};

interface AvailabilityProps {
  data: MetricDataPoint[];
  loading: boolean;
  error: string | null;
  lastUpdated?: Date | null;
}

const AvailabilityComponent: React.FC<AvailabilityProps> = ({
  data,
  loading,
  error,
  lastUpdated,
}) => {
  const threshold = 99.9;

  const validData = data;
  const currentValue = validData.length > 0 ? validData[validData.length - 1].average! : 0;
  const previousValue = validData.length > 1 ? validData[validData.length - 2].average! : 0;
  const change = currentValue - previousValue;
  const changePercentage =
    previousValue !== 0 ? (change / previousValue) * 100 : 0;

  const stats =
    validData.length > 0
      ? {
        min: Math.min(...validData.map((d) => d.average!)),
        max: Math.max(...validData.map((d) => d.average!)),
        avg: validData.reduce((sum, d) => sum + d.average!, 0) / validData.length,
        uptime:
          (validData.filter((d) => d.average! >= threshold).length / validData.length) *
          100,
      }
      : { min: 0, max: 0, avg: 0, uptime: 0 };

  const slaStatus = currentValue >= threshold;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-6 flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Conditional rendering for error
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center h-96">
        <div className="flex items-center mb-4 gap-3">
          <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
          <h2 className="text-lg font-semibold mb-2">Availability</h2>
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
          <span className="text-2xl">✅</span>
          <div>
            <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
            <h3 className="text-lg font-semibold text-gray-900">
              Availability
            </h3>
            <p className="text-sm text-gray-500">
              Percentage of availability for storage service
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
          )}

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
          <span className={`text-2xl font-bold ${getStatusColor(currentValue, threshold)}`}>
            {formatPercentage(currentValue)}
          </span>
          {validData.length > 1 && (
            <div
              className={`flex items-center space-x-1 text-sm ${change > 0
                ? "text-green-500"
                : change < 0
                  ? "text-red-500"
                  : "text-gray-500"
                }`}
            >
              <span>{change > 0 ? "↗️" : change < 0 ? "↘️" : "➡️"}</span>
              <span>{Math.abs(changePercentage).toFixed(3)}%</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          SLA Target: {formatPercentage(threshold)}
        </div>
        <div
          className={`text-sm mt-1 flex items-center ${slaStatus ? "text-green-600" : "text-red-600"
            }`}
        >
          <span className="mr-1">{slaStatus ? "✅" : "⚠️"}</span>
          {slaStatus ? "Meeting SLA" : "Below SLA threshold"}
        </div>
      </div>

      {/* Gauge */}
      <div className="mt-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <GaugeChart value={currentValue} threshold={threshold} />
        )}
      </div>

      {/* Recent History */}
      {validData.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Recent History
          </h4>
          <div className="grid grid-cols-12 gap-1 h-8">
            {validData.slice(-12).map((point, index) => {
              const isGood = point.average! >= threshold;
              const isWarning =
                point.average! >= threshold - 0.5 && point.average! < threshold;
              return (
                <div
                  key={index}
                  className={`rounded-sm ${isGood
                    ? "bg-cyan-600"
                    : isWarning
                      ? "bg-yellow-500"
                      : "bg-red-500"
                    }`}
                  title={`${formatTimestamp(point.time_stamp)}: ${formatPercentage(
                    point.average!
                  )}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{validData.length >= 12 ? "12 periods ago" : "Start"}</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {validData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Min */}
            <div className="text-center p-2 bg-white rounded shadow">
              <div className="text-gray-500">Min</div>
              <div className="font-medium">{formatPercentage(stats.min)}</div>
            </div>

            {/* Avg */}
            <div className="text-center p-2 bg-white rounded shadow">
              <div className="text-gray-500">Avg</div>
              <div className="font-medium">{formatPercentage(stats.avg)}</div>
            </div>

            {/* Max */}
            <div className="text-center p-2 bg-white rounded shadow">
              <div className="text-gray-500">Max</div>
              <div className="font-medium">{formatPercentage(stats.max)}</div>
            </div>

            {/* Uptime */}
            <div className="text-center p-2 bg-white rounded shadow">
              <div className="text-gray-500">Uptime %</div>
              <div className="font-medium">{formatPercentage(stats.uptime)}</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AvailabilityComponent;