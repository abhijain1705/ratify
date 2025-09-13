"use client";
import Image from "next/image";
import AzoreLogo from "@/assets/azure.png";
import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { useConnector } from "@/context/ConnectorContext";

interface BurstCreditsProps {
  data: any[];
  loading: boolean;
  error: string | null;
}


const BurstCredits = ({ data, error, loading }: BurstCreditsProps) => {


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
          <h2 className="text-lg font-semibold mb-2">Burst Credits</h2>
        </div>
        <div className="text-4xl mb-2 text-red-500">⚠️</div>
        <div className="text-lg font-semibold text-red-600 mb-2">Error</div>
        <div className="text-gray-700 text-center">{error}</div>
      </div>
    );
  }


  return (
    <div className="bg-white shadow rounded-xl p-4">
      <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
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
