"use client";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const DiskThroughput = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const metrics = ["OS Disk Read Bytes/sec", "OS Disk Write Bytes/sec"];
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

      const merged = results["OS Disk Read Bytes/sec"].map((item: any, idx: number) => ({
        time: item.time,
        read: item.value,
        write: results["OS Disk Write Bytes/sec"][idx]?.value,
      }));

      setData(merged);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2">Disk Throughput (Bytes/sec)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="read" stroke="#22c55e" fill="#bbf7d0" name="Read" />
          <Area type="monotone" dataKey="write" stroke="#ef4444" fill="#fecaca" name="Write" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DiskThroughput;
