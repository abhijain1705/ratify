"use client";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MemoryUsage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_group: "ratify-group",
          vm_name: "ratify-vm",
          metric_name: "Available Memory Percentage",
        }),
      });
      const json = await res.json();
      const timeseries = json.metrics[0].timeseries[0].data
        .filter((d: any) => d.average !== undefined)
        .map((d: any) => ({
          time: new Date(d.time_stamp).toLocaleTimeString(),
          value: d.average,
        }));
      setData(timeseries);
    };
    fetchMetrics();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">Available Memory (%)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis unit="%" />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#16a34a" fill="#bbf7d0" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MemoryUsage;
