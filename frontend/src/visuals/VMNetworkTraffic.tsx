"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const NetworkTraffic = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const metrics = ["Network In Total", "Network Out Total"];
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

      // Merge by time
      const merged = results["Network In Total"].map((item: any, idx: number) => ({
        time: item.time,
        in: item.value,
        out: results["Network Out Total"][idx]?.value,
      }));

      setData(merged);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">Network Traffic</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="in" stroke="#2563eb" name="Inbound" />
          <Line type="monotone" dataKey="out" stroke="#f97316" name="Outbound" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetworkTraffic;
