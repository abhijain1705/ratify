import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

export interface BillingGroup {
    Keys: string[];
    Metrics: {
        UnblendedCost: {
            Amount: string;
            Unit: string;
        };
    };
}

interface AwsBillingProps {
    data: BillingGroup[];
}

const AwsBilling: React.FC<AwsBillingProps> = ({ data }) => {
    // Transform data for recharts
    const chartData = data.map((group) => {
        const amount = parseFloat(group.Metrics.UnblendedCost.Amount);
        return {
            service: group.Keys[0],
            cost: isNaN(amount) ? 0 : amount,
        };
    });

    // Filter out 0-cost services to avoid noise in visuals
    const filteredData = chartData.filter((d) => d.cost !== 0);

    const COLORS = [
        "#4ade80", // green
        "#60a5fa", // blue
        "#f87171", // red
        "#facc15", // yellow
        "#a78bfa", // purple
        "#fb923c", // orange
        "#34d399", // teal
        "#f472b6", // pink
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">AWS Billing</h3>

            {/* Table */}
            <table className="w-full table-auto border mb-6">
                <thead>
                    <tr className="border-b">
                        <th className="px-2 py-1 text-left">Service</th>
                        <th className="px-2 py-1 text-right">Cost (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    {chartData.map((group) => (
                        <tr key={group.service} className="border-b">
                            <td className="px-2 py-1">{group.service}</td>
                            <td className="px-2 py-1 text-right">
                                {group.cost.toFixed(6)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Bar Chart */}
            <div className="h-64 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData}>
                        <XAxis dataKey="service" hide />
                        <YAxis />
                        <Tooltip formatter={(value: number) => value.toFixed(6) + " USD"} />
                        <Bar dataKey="cost" fill="#60a5fa" />
                    </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-gray-500 mt-2">
                    Bar chart: AWS cost per service
                </p>
            </div>

        </div>
    );
};

export default AwsBilling;
