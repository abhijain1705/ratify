"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AzoreLogo from "@/assets/azure.png";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useConnector } from "@/context/ConnectorContext";

// Types
export interface MemoryUsageMetricDataPoint {
  time_stamp: string;
  average: number;
}

interface MemoryUsageProps {
  resourceGroup?: string;
  vmName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Utility
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

export const fetchMemoryMetrics = async (token: string, resourceGroup: string, vmName: string) => {
  const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      resource_group: resourceGroup,
      vm_name: vmName,
      metric_name: "Available Memory Percentage",
    }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
};


interface MemoryUsageProps {
  data: MemoryUsageMetricDataPoint[];
  loading: boolean;
  error: string | null;
}



const MemoryUsage: React.FC<MemoryUsageProps> = ({
  data, error, loading
}) => {


  // Stats
  const stats =
    data.length > 0
      ? {
        min: Math.min(...data.map((d) => d.average)),
        max: Math.max(...data.map((d) => d.average)),
        avg: data.reduce((sum, d) => sum + d.average, 0) / data.length,
      }
      : { min: 0, max: 0, avg: 0 };

  const chartData = data.map((d) => ({
    time: formatTimestamp(d.time_stamp),
    value: d.average,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span style={{ color: "#16a34a" }}>●</span>
            {` Memory Available: ${payload[0]?.value.toFixed(2)}%`}
          </p>
        </div>
      );
    }
    return null;
  };


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
          <h2 className="text-lg font-semibold mb-2">Memory Usage</h2>
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
          <span className="text-2xl">🧠</span>
          <div>
            <Image src={AzoreLogo} alt="Azure logo" className="logo-ticker-image" />
            <h3 className="text-lg font-semibold text-gray-900">Available Memory</h3>
            <p className="text-sm text-gray-500">
              Amount of memory available for allocation to processes in the VM (%)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">

        </div>
      </div>

      {/* Chart */}
      <div className="mt-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500 text-center">
            <div>
              <div className="text-2xl mb-2">⚠️</div>
              <div>{error}</div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#16a34a" fill="#bbf7d0" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Stats */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-sm text-center">
          <div>
            <div className="text-gray-500">Min</div>
            <div className="font-medium">{stats.min.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Max</div>
            <div className="font-medium">{stats.max.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Avg</div>
            <div className="font-medium">{stats.avg.toFixed(2)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryUsage;
