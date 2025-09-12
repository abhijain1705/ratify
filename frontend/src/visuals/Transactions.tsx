import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import AzoreLogo from '@/assets/azure.png';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useConnector } from '@/context/ConnectorContext';

// Types
interface MetricDataPoint {
  time_stamp: string;
  average: number;
}

interface TransactionsProps {
  resourceGroup?: string;
  storageAccount?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Helpers
const formatNumber = (num: number) => {
  if (num === 0) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

// Fetch function
const fetchTransactionsMetrics = async (
  token: string,
  resourceGroup: string,
  storageAccount: string
) => {
  const res = await fetch('http://127.0.0.1:8000/api/azure/storage-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      resource_group: resourceGroup,
      storage_account: storageAccount,
      metric_name: 'Transactions',
    }),
  });
  if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
  return res.json();
};

// Main Component
const TransactionsComponent: React.FC<TransactionsProps> = ({
  resourceGroup = 'ratify-group',
  storageAccount = 'ratifyhackathon',
  autoRefresh = true,
  refreshInterval = 60000,
}) => {
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useConnector();

  const fetchData = useCallback(async () => {
    const idToken = await user?.getIdToken() || "";

    try {
      setLoading(true);
      setError(null);
      const response = await fetchTransactionsMetrics(idToken, resourceGroup, storageAccount);
      const metrics = response.metrics?.[0];
      const timeseries = metrics?.timeseries?.[0];
      const points: MetricDataPoint[] = timeseries?.data || [];
      setData(points);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [user, resourceGroup, storageAccount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh, refreshInterval]);

  // Compute stats
  const stats = data.length
    ? {
      min: Math.min(...data.map(d => d.average)),
      max: Math.max(...data.map(d => d.average)),
      avg: data.reduce((sum, d) => sum + d.average, 0) / data.length,
      total: data.reduce((sum, d) => sum + d.average, 0),
      uptime: data.filter(d => d.average > 0).length / data.length, // percentage of time non-zero
    }
    : { min: 0, max: 0, avg: 0, total: 0, uptime: 0 };

  const currentValue = data.length > 0 ? data[data.length - 1].average : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].average : 0;
  const change = currentValue - previousValue;
  const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  const chartData = data.map(point => ({
    ...point,
    formattedTime: formatTimestamp(point.time_stamp),
    value: point.average,
  }));

  const CustomTooltip = ({ active, payload, label }: any) =>
    active && payload?.length ? (
      <div className="bg-blue-900 text-white p-3 rounded-lg shadow-lg border border-blue-700">
        <p className="font-medium">{label}</p>
        <p className="text-sm">
          <span style={{ color: '#2563eb' }}>●</span> Transactions: {formatNumber(payload[0].value)}
        </p>
      </div>
    ) : null;



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
          <h2 className="text-lg font-semibold mb-2">Transactions</h2>
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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📊</span>
          <div>
            <Image src={AzoreLogo} alt="Azure logo" className="logo-ticker-image" />
            <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
            <p className="text-sm text-gray-500">Requests made to the storage service</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
          <button
            onClick={fetchData}
            className="p-1 text-gray-500 hover:text-blue-600 transition"
            title="Refresh"
          >
            🔄
          </button>
          {lastUpdated && <span className="text-xs text-gray-400">{lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-blue-600">{formatNumber(currentValue)}</span>
          {data.length > 1 && (
            <div
              className={`flex items-center space-x-1 text-sm ${change > 0 ? 'text-blue-500' : change < 0 ? 'text-red-500' : 'text-gray-500'
                }`}
            >
              <span>{change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️'}</span>
              <span>{Math.abs(changePercentage).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-1">Total in period: {formatNumber(stats.total)}</div>
      </div>

      {/* Chart */}
      <div className="mt-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500 text-center">
            <div>
              <div className="text-2xl mb-2">⚠️</div>
              {error}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="formattedTime" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Stats (2x2 grid: Min, Max, Avg, Uptime%) */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Min</div>
              <div className="font-medium">{formatNumber(stats.min)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Max</div>
              <div className="font-medium">{formatNumber(stats.max)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Avg</div>
              <div className="font-medium">{formatNumber(stats.avg)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Uptime %</div>
              <div className="font-medium">{(stats.uptime * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsComponent;
