"use client";
import { useCallback, useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import axios from "axios";
import AWSLogo from "@/assets/images.png";
import Image from "next/image";

export interface AwsMetric {
    Timestamp: string;
    Average: number;
    Unit: string;
}

export interface AwsInstance {
    InstanceId: string;
    State: string;
    Name: string;
}

interface AwsCPUUsageProps {
    instances: AwsInstance[];
    selectedInstance: string | null;
    data: AwsMetric[];
    loading: boolean;
    error: string | null;
    onSelectInstance: (id: string) => void;
}

const AwsCPUUsage: React.FC<AwsCPUUsageProps> = ({
    instances,
    selectedInstance,
    data,
    loading,
    error,
    onSelectInstance,
}) => {

    if (loading && data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-6 flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center h-96">
                <div className="flex items-center mb-4 gap-3">
                    <Image src={AWSLogo} alt="AWS logo" className="logo-ticker-image" />
                    <h2 className="text-lg font-semibold mb-2">Availability</h2>
                </div>
                <div className="text-4xl mb-2 text-red-500">⚠️</div>
                <div className="text-lg font-semibold text-red-600 mb-2">Error</div>
                <div className="text-gray-700 text-center">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg shadow bg-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">AWS CPU Usage (%)</h3>
                {instances.length > 0 && (
                    <select
                        value={selectedInstance || ""}
                        onChange={(e) => onSelectInstance(e.target.value)}
                        className="border rounded-md p-2 text-sm"
                    >
                        {instances.map((inst) => (
                            <option key={inst.InstanceId} value={inst.InstanceId}>
                                {inst.Name} ({inst.InstanceId}) – {inst.State}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} />
                    <YAxis domain={[0, "auto"]} />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                    <Line type="monotone" dataKey="Average" stroke="#16a34a" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AwsCPUUsage;
