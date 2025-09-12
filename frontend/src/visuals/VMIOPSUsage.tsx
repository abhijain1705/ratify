"use client";
import Image from "next/image";
import AzoreLogo from "@/assets/azure.png";
import { useCallback, useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useConnector } from "@/context/ConnectorContext";

const IOPSUsage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useConnector();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = ["VM Cached IOPS Consumed Percentage", "VM Uncached IOPS Consumed Percentage"];
      const results: any = {};

      const token = user ? await user.getIdToken() : '';
      for (const metric of metrics) {
        const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

      const merged = results["VM Cached IOPS Consumed Percentage"].map((item: any, idx: number) => ({
        time: item.time,
        cached: item.value,
        uncached: results["VM Uncached IOPS Consumed Percentage"][idx]?.value,
      }));

      setData(merged);
    } catch (err: any) {
      setError("Failed to fetch IOPS usage data.");
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
          <h2 className="text-lg font-semibold mb-2">IOPS Usage</h2>
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
      <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
      <h2 className="text-lg font-semibold mb-2">IOPS Usage (Cached vs Uncached)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cached" stroke="#22c55e" name="Cached" />
          <Line type="monotone" dataKey="uncached" stroke="#ef4444" name="Uncached" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IOPSUsage;
