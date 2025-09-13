"use client"
import React, { useCallback, useEffect } from 'react'

import Image from "next/image";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import AwsSetupWizard from "@/sections/awsSetupWizard";
import AzureWizard from "@/sections/azureWizard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggableCard from "./dragWrapper";

// Assets
import AWSLogo from "@/assets/images.png";
import AzureLogo from "@/assets/azure.png";
import Availability, { fetchAvailabilityMetrics, MetricDataPoint } from "@/visuals/Availability";
import Egress, { fetchEgressMetrics } from "@/visuals/egress";
import Ingress, { fetchIngressMetrics, IgressMetricDataPoint } from "@/visuals/ingress";
import SuccessE2ELatency, { fetchSuccessE2ELatencyMetrics, LatencyMetricDataPoint } from "@/visuals/SuccessE2ELatency";
import VisualsControlPopover, { Group, Visual } from "./VisualsControlPopover";
import SuccessServerLatency, { fetchSuccessServerLatencyMetrics, ServerLatencyMetricDataPoint } from "@/visuals/SuccessServerLatency";
import Transactions, { fetchTransactionsMetrics, TransactionMetricDataPoint } from "@/visuals/Transactions";
import UsedCapacity, { fetchUsedCapacityMetrics, UsedCapacityMetricDataPoint } from "@/visuals/UsedCapacity";
import BurstCredits from './VMBurstCredits';
import CPUUsage, { CPUUsageMetricDataPoint, fetchCPUMetrics } from './VMCpuUsage';
import DiskLatency, { DiskLatencyPoint } from './VMDiskLatency';
import DiskThroughput, { DiskThroughputMetricPoint } from './VMDiskThrouhput';
import IOPSUsage from './VMIOPSUsage';
import MemoryUsage, { fetchMemoryMetrics, MemoryUsageMetricDataPoint } from './VMMemoryUsage';
import NetworkTraffic from './VMNetworkTraffic';
import CloudMenu from "@/sections/cloudMenu";
import { useConnector } from '@/context/ConnectorContext';
import AwsCPUUsage, { AwsInstance, AwsMetric } from './awsCpuUsage';
import AwsControls from './AwsControls';
import AwsBilling, { BillingGroup } from './awsBilling';
import axios from 'axios';

// Simple Modal Component
export function Modal({
    isOpen,
    onClose,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative">
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    ✕
                </button>
                {children}
            </div>
        </div>
    );
}


const DashboardContent = () => {
    const [openModal, setOpenModal] = useState<"aws" | "azure" | null>(null);

    const { connectors, user } = useConnector();

    const handleLogout = async () => {
        await signOut(auth);
    };

    const [awsBillingData, setAwsBillingData] = useState<BillingGroup[]>([]);
    const [loadingBilling, setLoadingBilling] = useState(true);

    const [instances, setInstances] = useState<AwsInstance[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
    const [cpuData, setCpuData] = useState<AwsMetric[]>([]);
    const [cpuLoading, setCpuLoading] = useState(true);
    const [cpuError, setCpuError] = useState<string | null>(null);

    const start = "2025-09-01T06:52:00+00:00";
    const end = "2025-09-14T06:52:00+00:00";

    const [availabilityData, setAvailabilityData] = useState<MetricDataPoint[]>([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(true);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);


    const [igressData, setIgressData] = useState<IgressMetricDataPoint[]>([]);
    const [igressLoading, setIgressLoading] = useState(true);
    const [igressError, setIgressError] = useState<string | null>(null);

    const resourceGroup = "ratify-group";
    const storageAccount = "ratifyhackathon";
    const vmName = 'ratify-vm';
    const [egressData, setEgressData] = useState<MetricDataPoint[]>([]);
    const [egressLoading, setEgressLoading] = useState(true);
    const [egressError, setEgressError] = useState<string | null>(null);

    const [latencyData, setLatencyData] = useState<LatencyMetricDataPoint[]>([]);
    const [latencyLoading, setLatencyLoading] = useState(true);
    const [latencyError, setLatencyError] = useState<string | null>(null);

    const [serverLatencydata, setServerLatencyData] = useState<ServerLatencyMetricDataPoint[]>([]);
    const [serverLatencyloading, setServerLatencyLoading] = useState(true);
    const [serverLatencyerror, setServerLatencyError] = useState<string | null>(null);

    const [transactionData, setTransactionData] = useState<TransactionMetricDataPoint[]>([]);
    const [transactionLoading, setTransactionLoading] = useState(true);
    const [transactionError, setTransactionError] = useState<string | null>(null);

    const [ucdata, setucData] = useState<UsedCapacityMetricDataPoint[]>([]);
    const [ucloading, setucLoading] = useState(true);
    const [ucerror, setucError] = useState<string | null>(null);

    const [cpudata, setcpuData] = useState<CPUUsageMetricDataPoint[]>([]);
    const [cpuloading, setcpuLoading] = useState(true);
    const [cpuerror, setcpuError] = useState<string | null>(null);

    const [mudata, setmuData] = useState<MemoryUsageMetricDataPoint[]>([]);
    const [muloading, setmuLoading] = useState(true);
    const [muerror, setmuError] = useState<string | null>(null);

    const [dtdata, setdtData] = useState<DiskThroughputMetricPoint[]>([]);
    const [dtloading, setdtLoading] = useState(true);
    const [dterror, setdtError] = useState<string | null>(null);

    const [dldata, setdlData] = useState<DiskLatencyPoint[]>([]);
    const [dlloading, setdlLoading] = useState(true);
    const [dlerror, setdlError] = useState<string | null>(null);

    const [iompsdata, setiompsData] = useState([]);
    const [iompsloading, setiompsLoading] = useState(true);
    const [iompserror, setiompsError] = useState<string | null>(null);

    const [ntdata, setntData] = useState([]);
    const [ntloading, setntLoading] = useState(true);
    const [nterror, setntError] = useState<string | null>(null);

    const [bcdata, setbcData] = useState([]);
    const [bcloading, setbcLoading] = useState(true);
    const [bcerror, setbcError] = useState<string | null>(null);

    const fetchbcData = useCallback(async () => {
        setbcLoading(true);
        setbcError(null);
        try {
            const metrics = ["CPU Credits Remaining", "CPU Credits Consumed"];
            const results: any = {};

            const token = user ? await user.getIdToken() : '';
            for (const metric of metrics) {
                const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        resource_group: "ratify-group",
                        vm_name: "ratify-vm",
                        metric_name: metric,
                    }),
                });
                if (!res.ok) throw new Error(`Failed to fetch ${metric}`);
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

            setbcData(merged);
        } catch (err: any) {
            setbcError(err.message || "Failed to fetch data");
        } finally {
            setbcLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchbcData();
    }, [fetchbcData]);


    const fetchntData = useCallback(async () => {
        setntLoading(true);
        setntError(null);
        try {
            const metrics = ["Network In Total", "Network Out Total"];
            const results: any = {};

            const token = user ? await user.getIdToken() : '';
            for (const metric of metrics) {
                const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

            setntData(merged);
        } catch (err: any) {
            setntError("Failed to fetch network traffic data.");
        } finally {
            setntLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchntData();
    }, [fetchntData]);


    const fetchiompsData = useCallback(async () => {
        try {
            setiompsLoading(true);
            setiompsError(null);
            const metrics = ["VM Cached IOPS Consumed Percentage", "VM Uncached IOPS Consumed Percentage"];
            const results: any = {};

            const token = user ? await user.getIdToken() : '';
            for (const metric of metrics) {
                const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

            setiompsData(merged);
        } catch (err: any) {
            setiompsError("Failed to fetch IOPS usage data.");
        } finally {
            setiompsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchiompsData();
    }, [fetchiompsData]);

    const fetchdlData = useCallback(async () => {
        if (!user) return;

        setdlLoading(true);
        setdlError(null);

        try {
            const token = await user.getIdToken();
            const metrics = ["OS Disk Latency", "Data Disk Latency"];
            const results: Record<string, { time: string; value: number }[]> = {};

            for (const metric of metrics) {
                const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        resource_group: "ratify-group",
                        vm_name: "ratify-vm",
                        metric_name: metric,
                    }),
                });

                const json = await res.json();

                results[metric] = json.metrics[0].timeseries[0].data.map((d: any) => ({
                    time: new Date(d.time_stamp).toLocaleTimeString(),
                    value: d.average ?? 0,
                }));
            }

            const allTimes = Array.from(
                new Set([
                    ...results[metrics[0]].map(d => d.time),
                    ...results[metrics[1]].map(d => d.time),
                ])
            ).sort();

            const mergedData: DiskLatencyPoint[] = allTimes.map(time => ({
                time,
                os: results[metrics[0]].find(d => d.time === time)?.value ?? 0,
                data: results[metrics[1]].find(d => d.time === time)?.value ?? 0,
            }));

            setdlData(mergedData);
            setdlLoading(false);
        } catch (err: any) {
            setdlError(err.message || "Failed to fetch data");
            setdlLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchdlData();
    }, [fetchdlData]);


    const fetchdtData = useCallback(async () => {
        if (!user) return;

        setdtLoading(true);
        setdtError(null);

        try {
            const token = await user.getIdToken();
            const metrics = ["OS Disk Read Bytes/sec", "OS Disk Write Bytes/sec"];
            const results: Record<string, { time: string; value: number }[]> = {};

            for (const metric of metrics) {
                const res = await fetch("http://127.0.0.1:8000/api/azure/vm-metrics", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
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

            // Merge by timestamp
            const allTimes = Array.from(
                new Set([
                    ...results[metrics[0]].map(d => d.time),
                    ...results[metrics[1]].map(d => d.time),
                ])
            ).sort();

            const mergedData: DiskThroughputMetricPoint[] = allTimes.map(time => ({
                time,
                read: results[metrics[0]].find(d => d.time === time)?.value ?? 0,
                write: results[metrics[1]].find(d => d.time === time)?.value ?? 0,
            }));

            setdtData(mergedData);
        } catch (err: any) {
            setdtError(err.message || "Failed to fetch data");
        } finally {
            setdtLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchdtData();
    }, [fetchdtData]);


    const fetchvmmemoryData = useCallback(async () => {
        try {
            setmuLoading(true);
            setmuError(null);

            const token = user ? await user.getIdToken() : "";
            const response = await fetchMemoryMetrics(token, resourceGroup, vmName);
            const timeseries = response?.metrics?.[0]?.timeseries?.[0]?.data || [];

            const filteredData = timeseries
                .filter((d: any) => d.average !== undefined)
                .map((d: any) => ({
                    time_stamp: d.time_stamp,
                    average: Number(d.average),
                }));

            setmuData(filteredData);
        } catch (err) {
            setmuError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setmuLoading(false);
        }
    }, [resourceGroup, vmName, user]);

    useEffect(() => {
        fetchvmmemoryData();
    }, [fetchvmmemoryData]);

    const fetchcpuData = useCallback(async () => {
        try {
            setcpuLoading(true);
            setcpuError(null);

            const token = user ? await user.getIdToken() : "";
            const response = await fetchCPUMetrics(token, resourceGroup, vmName);
            const timeseries = response?.metrics?.[0]?.timeseries?.[0]?.data || [];

            const filteredData = timeseries
                .filter((d: any) => d.average !== undefined)
                .map((d: any) => ({
                    time_stamp: d.time_stamp,
                    average: Number(d.average) * 100, // Convert to %
                }));

            setcpuData(filteredData);
        } catch (err) {
            setcpuError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setcpuLoading(false);
        }
    }, [resourceGroup, vmName, user]);

    useEffect(() => {
        fetchcpuData();
    }, [fetchcpuData]);


    const fetchUsedCapacityData = useCallback(async () => {
        try {
            setucLoading(true);
            setucError(null);
            const token = await user?.getIdToken() || "";
            const response = await fetchUsedCapacityMetrics(token, resourceGroup, storageAccount);

            const timeseries = response?.metrics?.[0]?.timeseries;
            if (Array.isArray(timeseries) && timeseries.length > 0) {
                const rawData = timeseries[0]?.data ?? [];
                // Ensure 'average' exists, fallback to 0
                setucData(rawData.map((d: any) => ({
                    time_stamp: d.time_stamp,
                    average: Number(d.average) || 0,
                })));
            } else {
                setucData([]);
            }
        } catch (err) {
            setucError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setucLoading(false);
        }
    }, [resourceGroup, storageAccount, user]);

    useEffect(() => { fetchUsedCapacityData(); }, [fetchUsedCapacityData]);


    const fetchTranData = useCallback(async () => {
        const idToken = await user?.getIdToken() || "";

        try {
            setTransactionLoading(true);
            setTransactionError(null);
            const response = await fetchTransactionsMetrics(idToken, resourceGroup, storageAccount);
            const metrics = response.metrics?.[0];
            const timeseries = metrics?.timeseries?.[0];
            const points: TransactionMetricDataPoint[] = timeseries?.data || [];
            setTransactionData(points);
        } catch (err) {
            setTransactionError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setTransactionLoading(false);
        }
    }, [user, resourceGroup, storageAccount]);

    useEffect(() => {
        fetchTranData();
    }, [fetchTranData]);

    const fetchServerData = useCallback(async () => {
        try {
            setServerLatencyLoading(true);
            setServerLatencyError(null);
            const token = user ? await user.getIdToken() : '';
            const response = await fetchSuccessServerLatencyMetrics(
                token,
                resourceGroup,
                storageAccount
            );

            if (response.metrics && response.metrics.length > 0) {
                const timeseries = response.metrics[0].timeseries;
                if (timeseries && timeseries.length > 0) {
                    // Only include points with an 'average' value
                    const filteredData = (timeseries[0].data || []).filter((d: MetricDataPoint) =>
                        typeof d.average === "number"
                    );
                    setServerLatencyData(filteredData);
                } else {
                    setServerLatencyData([]);
                }
            } else {
                setServerLatencyData([]);
            }
        } catch (err) {
            setServerLatencyError(err instanceof Error ? err.message : "Failed to fetch data");
            setServerLatencyData([]);
        } finally {
            setServerLatencyLoading(false);
        }
    }, [resourceGroup, storageAccount, user]);

    useEffect(() => {
        fetchServerData();
    }, [fetchServerData]);

    const fetchLatencyData = useCallback(async () => {
        try {
            setLatencyLoading(true);
            setLatencyError(null);

            const token = user ? await user.getIdToken() : '';
            const response = await fetchSuccessE2ELatencyMetrics(token,
                resourceGroup,
                storageAccount
            );

            if (response.metrics && response.metrics.length > 0) {
                const timeseries = response.metrics[0].timeseries;
                if (timeseries && timeseries.length > 0) {
                    // Only include points with an 'average' value
                    const filteredData = (timeseries[0].data || []).filter((d: MetricDataPoint) =>
                        typeof d.average === "number"
                    );
                    setLatencyData(filteredData);
                } else {
                    setLatencyData([]);
                }
            } else {
                setLatencyData([]);
            }
        } catch (err) {
            setLatencyError(err instanceof Error ? err.message : 'Failed to fetch data');
            setLatencyData([]);
        } finally {
            setLatencyLoading(false);
        }
    }, [resourceGroup, storageAccount, user]);

    useEffect(() => {
        fetchLatencyData();
    }, [fetchLatencyData]);

    const fetchData = useCallback(async () => {
        try {
            setEgressLoading(true);
            setEgressError(null);
            const token = user ? await user.getIdToken() : '';
            const response = await fetchEgressMetrics(token, resourceGroup, storageAccount);

            if (response.metrics && response.metrics.length > 0) {
                const timeseries = response.metrics[0].timeseries;
                if (timeseries && timeseries.length > 0) {
                    // Only include points with an 'average' value
                    const filteredData = (timeseries[0].data || []).filter((d: MetricDataPoint) =>
                        typeof d.average === "number"
                    );
                    setEgressData(filteredData);
                } else {
                    setEgressData([]);
                }
            } else {
                setEgressData([]);
            }
        } catch (err) {
            setEgressError(err instanceof Error ? err.message : "Failed to fetch data");
            setEgressData([]);
        } finally {
            setEgressLoading(false);
        }
    }, [resourceGroup, storageAccount, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const fetchIgessData = useCallback(async () => {
        try {
            setIgressLoading(true);
            setIgressError(null);
            const token = user ? await user.getIdToken() : "";
            const response = await fetchIngressMetrics(token, resourceGroup, storageAccount);
            if (response.metrics && response.metrics.length > 0) {
                const timeseries = response.metrics[0].timeseries;
                if (timeseries && timeseries.length > 0) {
                    const filteredData = (timeseries[0].data || []).filter(
                        (d: MetricDataPoint) => typeof d.average === "number"
                    );
                    setIgressData(filteredData);
                } else {
                    setIgressData([]);
                }
            } else {
                setIgressData([]);
            }
        } catch (err) {
            setIgressError(err instanceof Error ? err.message : "Failed to fetch data");
            setIgressData([]);
        } finally {
            setIgressLoading(false);
        }
    }, [resourceGroup, storageAccount, user]);

    useEffect(() => {
        fetchIgessData();
    }, [fetchIgessData]);


    const fetchAvailability = useCallback(async () => {
        if (!user) return;
        setAvailabilityLoading(true);
        setAvailabilityError(null);
        try {
            const token = await user.getIdToken();
            const response = await fetchAvailabilityMetrics(token, resourceGroup, storageAccount);
            const timeseries = response.metrics?.[0]?.timeseries?.[0]?.data || [];
            const filteredData = timeseries.filter((d: MetricDataPoint) => typeof d.average === "number");
            setAvailabilityData(filteredData);
        } catch (err) {
            console.error("Error fetching availability metrics:", err);
            setAvailabilityError(err instanceof Error ? err.message : "Failed to fetch");
        } finally {
            setAvailabilityLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    // Fetch AWS billing
    useEffect(() => {
        const fetchBilling = async () => {
            try {
                const res = await axios.post("http://127.0.0.1:8000/api/billing", {
                    start,
                    end,
                });
                setAwsBillingData(res.data[0]?.Groups || []);
            } catch (err) {
                console.error("Failed to fetch AWS billing:", err);
            } finally {
                setLoadingBilling(false);
            }
        };
        fetchBilling();
    }, []);

    // Fetch AWS EC2 instances and metrics
    useEffect(() => {
        const fetchInstancesAndMetrics = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();

                // Instances
                const resInstances = await axios.post(
                    "http://127.0.0.1:8000/aws/instances",
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setInstances(resInstances.data.instances || []);
                if (resInstances.data.instances?.length > 0) {
                    setSelectedInstance(resInstances.data.instances[0].InstanceId);
                }
            } catch (err) {
                console.error("Error fetching AWS instances:", err);
                setCpuError("Failed to fetch AWS instances");
            }
        };
        fetchInstancesAndMetrics();
    }, [user]);

    // Fetch metrics for selected instance
    useEffect(() => {
        if (!selectedInstance || !user) return;

        const fetchMetrics = async () => {
            setCpuLoading(true);
            try {
                const token = await user.getIdToken();
                const res = await axios.post(
                    `http://127.0.0.1:8000/api/aws/metrics/${selectedInstance}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setCpuData(res.data || []);
                setCpuError(null);
            } catch (err) {
                console.error("Error fetching AWS metrics:", err);
                setCpuError("Failed to fetch AWS metrics");
            } finally {
                setCpuLoading(false);
            }
        };
        fetchMetrics();
    }, [selectedInstance, user]);

    useEffect(() => {
        const fetchBilling = async () => {
            try {
                const res = await axios.post("http://127.0.0.1:8000/api/billing", {
                    start,
                    end,
                });
                setAwsBillingData(res.data[0]?.Groups || []);
            } catch (err) {
                console.error("Failed to fetch AWS billing:", err);
            } finally {
                setLoadingBilling(false);
            }
        };

        fetchBilling();
    }, []);


    const [widgets, setWidgets] = useState<Visual[]>([
        { id: "AWS Billing", label: "AWS Billing", provider: "aws", component: <AwsBilling data={awsBillingData} /> },
        { id: "AWS CPU Usage", label: "AWS CPU Usage", provider: "aws", component: <AwsCPUUsage instances={instances} selectedInstance={selectedInstance} data={cpuData} loading={cpuLoading} error={cpuError} onSelectInstance={setSelectedInstance} /> },
        { id: "availability", label: "Availability", provider: "azure", component: <Availability data={availabilityData} loading={availabilityLoading} error={availabilityError} /> },
        { id: "ingress", label: "Ingress", provider: "azure", component: <Ingress data={igressData} loading={igressLoading} error={igressError} /> },
        { id: "egress", label: "Egress", provider: "azure", component: <Egress data={egressData} loading={egressLoading} error={egressError} /> },
        { id: "e2eLatency", label: "End-to-End Latency", provider: "azure", component: <SuccessE2ELatency data={latencyData} error={latencyError} loading={latencyLoading} /> },
        { id: "serverLatency", label: "Server Latency", provider: "azure", component: <SuccessServerLatency data={serverLatencydata} error={serverLatencyerror} loading={serverLatencyloading} /> },
        { id: "transactions", label: "Transactions", provider: "azure", component: <Transactions data={transactionData} loading={transactionLoading} error={transactionError} /> },
        { id: "usedCapacity", label: "Used Capacity", provider: "azure", component: <UsedCapacity data={ucdata} error={ucerror} loading={ucloading} /> },
        { id: "cpu", label: "CPU Usage", provider: "azure", component: <CPUUsage data={cpudata} error={cpuerror} loading={cpuloading} /> },
        { id: "memory", label: "Memory Usage", provider: "azure", component: <MemoryUsage data={mudata} error={muerror} loading={muloading} /> },
        { id: "diskThroughput", label: "Disk Throughput", provider: "azure", component: <DiskThroughput data={dtdata} error={dterror} loading={dtloading} /> },
        { id: "diskLatency", label: "Disk Latency", provider: "azure", component: <DiskLatency data={dldata} loading={dlloading} error={dlerror} /> },
        { id: "iops", label: "IOPS Usage", provider: "azure", component: <IOPSUsage data={iompsdata} loading={iompsloading} error={iompserror} /> },
        { id: "network", label: "Network Traffic", provider: "azure", component: <NetworkTraffic data={ntdata} loading={ntloading} error={nterror} /> },
        { id: "burstCredits", label: "Burst Credits", provider: "azure", component: <BurstCredits data={bcdata} loading={bcloading} error={bcerror} /> },
    ]);


    // Default: all visible
    const [visible, setVisible] = useState<Record<string, boolean>>(
        widgets.reduce((acc, w) => {
            acc[w.id] = true;
            return acc;
        }, {} as Record<string, boolean>)
    );

    const groups: Group[] = [
        { id: "latency", label: "Latency Metrics", provider: "azure", visuals: ["e2eLatency", "serverLatency"] },
        { id: "storage", label: "Storage Metrics", provider: "azure", visuals: ["diskThroughput", "diskLatency", "iops"] },
        { id: "compute", label: "Compute Metrics", provider: "azure", visuals: ["cpu", "memory", "burstCredits"] },
    ];

    const toggleVisual = (id: string) => {
        setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleGroup = (groupId: string) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;
        const allVisible = group.visuals.every((id) => visible[id]);
        setVisible((prev) => {
            const updated = { ...prev };
            group.visuals.forEach((id) => {
                updated[id] = !allVisible;
            });
            return updated;
        });
    };

    const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
        setWidgets((prev) => {
            const newWidgets = [...prev];
            const [removed] = newWidgets.splice(dragIndex, 1);
            newWidgets.splice(hoverIndex, 0, removed);
            return newWidgets;
        });
    }, []);


    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="max-w-lg w-full p-8 bg-white/80 rounded-2xl shadow-lg backdrop-blur-sm text-center">
                    <h2 className="text-2xl font-semibold text-indigo-700 mb-2">
                        Please log in
                    </h2>
                    <p className="text-gray-600">
                        You must be logged in to access the dashboard.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 min-h-screen bg-gray-50">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🌐 Unified Cloud Dashboard</h1>
                <div className="flex items-center gap-4">
                    <CloudMenu />
                    <AwsControls />
                    <VisualsControlPopover
                        visuals={widgets}
                        groups={groups}
                        visible={visible}
                        toggleVisual={toggleVisual}
                        toggleGroup={toggleGroup}
                    />
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow"
                    >
                        Logout
                    </button></div>
            </div>

            <p className="text-gray-600">Welcome back, {user.displayName} 👋</p>

            {/* Connectors Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AWS Card */}
                {!connectors.aws && (
                    <div className="bg-white border rounded-2xl p-6 shadow flex flex-col items-center">
                        <Image src={AWSLogo} alt="AWS" width={80} height={40} />
                        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-6">
                            AWS Connector
                        </h3>
                        <button
                            onClick={() => setOpenModal("aws")}
                            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow transition"
                        >
                            Open AWS Setup
                        </button>
                    </div>
                )}

                {/* Azure Card */}
                {!connectors.azure && (
                    <div className="bg-white border rounded-2xl p-6 shadow flex flex-col items-center">
                        <Image src={AzureLogo} alt="Azure" width={90} height={40} />
                        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-6">
                            Azure Connector
                        </h3>
                        <button
                            onClick={() => setOpenModal("azure")}
                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition"
                        >
                            Open Azure Setup
                        </button>
                    </div>
                )}
            </section>

            <DndProvider backend={HTML5Backend}>
                <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-10">
                    {widgets
                        .filter((widget) => widget.provider === "aws" && !connectors.aws ? false : true)
                        .filter((widget) => widget.provider === "azure" && !connectors.azure ? false : true)
                        .filter((widget) => visible[widget.id]).map((widget, index) => (
                            <div
                                key={widget.id}
                                style={{ cursor: "grab" }}
                            >
                                <DraggableCard
                                    id={widget.id}
                                    index={index}
                                    moveCard={moveCard}
                                >
                                    {widget.component}
                                </DraggableCard>
                            </div>
                        ))}
                </section>
            </DndProvider>


            {/* Popup Modals */}
            <Modal isOpen={openModal === "aws"} onClose={() => setOpenModal(null)}>
                <AwsSetupWizard isOpen={openModal === "aws"} onClose={() => setOpenModal(null)} />
            </Modal>

            <Modal isOpen={openModal === "azure"} onClose={() => setOpenModal(null)}>
                <AzureWizard isOpen={openModal === "azure"} onClose={() => setOpenModal(null)} />
            </Modal>
        </div>
    );
}

export default DashboardContent