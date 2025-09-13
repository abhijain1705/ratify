import React, { useState, useEffect, useCallback } from 'react';
import AzoreLogo from "@/assets/azure.png";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useConnector } from '@/context/ConnectorContext';

// Types
export interface LatencyMetricDataPoint {
  time_stamp: string;
  average?: number; // average can be missing
}

interface SuccessE2ELatencyProps {
  resourceGroup?: string;
  storageAccount?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Utility functions
const formatMilliseconds = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const formatTimestamp = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const getStatusColor = (value: number, threshold: number = 200): string => {
  if (value <= threshold) return 'text-green-600';
  if (value <= threshold * 1.5) return 'text-yellow-600';
  return 'text-red-600';
};

export const fetchSuccessE2ELatencyMetrics = async (
  token: string,
  resourceGroup: string,
  storageAccount: string
) => {
  try {
    const response = await fetch(
      'http://127.0.0.1:8000/api/azure/storage-metrics',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          resource_group: resourceGroup,
          storage_account: storageAccount,
          metric_name: 'SuccessE2ELatency',
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
};

interface LatencyProps {
  data: LatencyMetricDataPoint[];
  loading: boolean;
  error: string | null;
}

// Main Component
export const SuccessE2ELatencyComponent: React.FC<
  LatencyProps
> = ({
  data, error, loading
}) => {
    const threshold = 200; // 200ms threshold

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
          <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
            <p className="font-medium">{label}</p>
            <p className="text-sm">
              <span style={{ color: '#EC4899' }}>●</span>
              {` E2E Latency: ${formatMilliseconds(payload[0].value)}`}
            </p>
            {payload[0].value > threshold && (
              <p className="text-xs text-red-400 mt-1">⚠️ Above threshold</p>
            )}
          </div>
        );
      }
      return null;
    };

    // Stats use only validData
    const stats =
      validData.length > 0
        ? {
          min: Math.min(...validData.map((d) => d.average!)),
          max: Math.max(...validData.map((d) => d.average!)),
          avg: validData.reduce((sum, d) => sum + d.average!, 0) / validData.length,
          p95:
            validData
              .map((d) => d.average!)
              .sort((a, b) => a - b)[Math.floor(validData.length * 0.95)] || 0,
          p99:
            validData
              .map((d) => d.average!)
              .sort((a, b) => a - b)[Math.floor(validData.length * 0.99)] || 0,
        }
        : { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };

    const statusColor = getStatusColor(currentValue, threshold);


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
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center h-96">
          <div className="flex items-center mb-4">
            <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
            <h2 className="text-lg font-semibold mb-2">Success E2E Latency</h2>
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
            <span className="text-2xl">🎯</span>
            <div>
              <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
              <h3 className="text-lg font-semibold text-gray-900">
                End-to-End Latency
              </h3>
              <p className="text-sm text-gray-500">
                The average end-to-end latency of successful requests
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
            )}
            
          </div>
        </div>

        {/* Current Value */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${statusColor}`}>
              {formatMilliseconds(currentValue)}
            </span>
            {validData.length > 1 && (
              <div
                className={`flex items-center space-x-1 text-sm ${change > 0
                  ? 'text-red-500'
                  : change < 0
                    ? 'text-green-500'
                    : 'text-gray-500'
                  }`}
              >
                <span>{change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️'}</span>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
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
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={{ stroke: '#e5e7eb' }}
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
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ fill: '#EC4899', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#EC4899' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer Stats */}
        {validData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-5 gap-2 text-sm">
              <div className="text-center">
                <div className="text-gray-500">Min</div>
                <div className="font-medium">
                  {formatMilliseconds(stats.min)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Avg</div>
                <div className="font-medium">
                  {formatMilliseconds(stats.avg)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">P95</div>
                <div className="font-medium">
                  {formatMilliseconds(stats.p95)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">P99</div>
                <div className="font-medium">
                  {formatMilliseconds(stats.p99)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Max</div>
                <div className="font-medium">
                  {formatMilliseconds(stats.max)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default SuccessE2ELatencyComponent;