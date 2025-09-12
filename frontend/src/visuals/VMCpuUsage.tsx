"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const CPUUsage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_group: "ratify-group",
          vm_name: "ratify-vm",
          metric_name: "Percentage CPU",
        }),
      });
      const json = await res.json();
      const timeseries = json.metrics[0].timeseries[0].data
        .filter((d: any) => d.average !== undefined)
        .map((d: any) => ({
          time: new Date(d.time_stamp).toLocaleTimeString(),
          value: d.average * 100,
        }));
      setData(timeseries);
    };
    fetchMetrics();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">CPU Usage (%)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis unit="%" />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CPUUsage;
