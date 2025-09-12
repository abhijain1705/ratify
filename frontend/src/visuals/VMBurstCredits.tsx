"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const BurstCredits = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const metrics = ["CPU Credits Remaining", "CPU Credits Consumed"];
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

      const merged = results["CPU Credits Remaining"].map((item: any, idx: number) => ({
        time: item.time,
        remaining: item.value,
        consumed: results["CPU Credits Consumed"][idx]?.value,
      }));

      setData(merged);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">CPU Burst Credits</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="remaining" fill="#22c55e" name="Remaining" />
          <Bar dataKey="consumed" fill="#ef4444" name="Consumed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BurstCredits;
