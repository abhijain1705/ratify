"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const IOPSUsage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const metrics = ["VM Cached IOPS Consumed Percentage", "VM Uncached IOPS Consumed Percentage"];
      const results: any = {};

      for (const metric of metrics) {
        const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
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
