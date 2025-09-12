"use client";
import Image from "next/image";
import AzoreLogo from "@/assets/azure.png";
import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useConnector } from "@/context/ConnectorContext";

interface MetricPoint {
  time: string;
  read: number;
  write: number;
}

const DiskThroughput = () => {
  const [data, setData] = useState<MetricPoint[]>([]);
  const { user } = useConnector();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const metrics = ["OS Disk Read Bytes/sec", "OS Disk Write Bytes/sec"];
      const results: Record<string, { time: string; value: number }[]> = {};

      for (const metric of metrics) {
        const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resource_group: "ratify-group",
            vm_name: "ratify-vm",
            metric_name: metric,
          }),
        });

        const json = await res.json();

        results[metric] = json.metrics[0].timeseries[0].data
          .filter((d: any) => d.average !== undefined)
          .map((d: any) => ({
            time: new Date(d.time_stamp).toLocaleTimeString(),
            value: d.average,
          }));
      }

      // Merge by timestamp
      const allTimes = Array.from(
        new Set([
          ...results[metrics[0]].map(d => d.time),
          ...results[metrics[1]].map(d => d.time),
        ])
      ).sort();

      const mergedData: MetricPoint[] = allTimes.map(time => ({
        time,
        read: results[metrics[0]].find(d => d.time === time)?.value ?? 0,
        write: results[metrics[1]].find(d => d.time === time)?.value ?? 0,
      }));

      setData(mergedData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


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
          <h2 className="text-lg font-semibold mb-2">Disk Throughput</h2>
        </div>
        <div className="text-4xl mb-2 text-red-500">⚠️</div>
        <div className="text-lg font-semibold text-red-600 mb-2">Error</div>
        <div className="text-gray-700 text-center">{error}</div>
        <button
          onClick={fetchData}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }



  return (
    <div className="bg-white shadow rounded-xl p-4">
      <div className="flex items-center mb-2">
        <Image src={AzoreLogo} alt="Azure logo" className="h-6 w-6 mr-2" />
        <h2 className="text-lg font-semibold">Disk Throughput (Bytes/sec)</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip formatter={(value: any) => new Intl.NumberFormat().format(value)} />
          <Legend />
          <Area
            type="monotone"
            dataKey="read"
            stroke="#22c55e"
            fill="#bbf7d0"
            name="Read"
          />
          <Area
            type="monotone"
            dataKey="write"
            stroke="#ef4444"
            fill="#fecaca"
            name="Write"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DiskThroughput;
