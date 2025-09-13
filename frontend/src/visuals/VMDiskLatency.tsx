"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import AzoreLogo from "@/assets/azure.png";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useConnector } from "@/context/ConnectorContext";

export interface DiskLatencyPoint {
  time: string;
  os: number;
  data: number;
}

interface DiskLatencyProps {
  data: DiskLatencyPoint[];
  loading: boolean;
  error: string | null;
}

const DiskLatency = ({ data, error, loading }: DiskLatencyProps) => {

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
          <h2 className="text-lg font-semibold mb-2">Disk Latency</h2>
        </div>
        <div className="text-4xl mb-2 text-red-500">⚠️</div>
        <div className="text-lg font-semibold text-red-600 mb-2">Error</div>
        <div className="text-gray-700 text-center">{error}</div>

      </div>
    );
  }



  return (
    <div className="bg-white shadow rounded-xl p-4">
      <div className="flex items-center mb-2">
        <Image src={AzoreLogo} alt="Azure logo" className="h-6 w-6 mr-2" />
        <h2 className="text-lg font-semibold">Disk Latency (ms)</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip formatter={(value: any) => value.toFixed(2)} />
          <Legend />
          <Line type="monotone" dataKey="os" stroke="#0ea5e9" name="OS Disk" />
          <Line type="monotone" dataKey="data" stroke="#a855f7" name="Data Disk" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DiskLatency;
