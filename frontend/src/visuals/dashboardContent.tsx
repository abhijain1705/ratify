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

// Generic hook for fetching data
function useMetric<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchFn();
                if (!cancelled) setData(result);
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Failed to fetch");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [fetchFn]);

    return { data, loading, error };
}

// Helper to call Azure single-metric endpoint and return timeseries points (filtered)
const fetchAzureMetric = async (token: string, resourceGroup: string, storageAccount: string, metricName: string) => {
    const res = await axios.post(
        "http://127.0.0.1:8000/api/azure/storage-metrics",
        {
            resource_group: resourceGroup,
            storage_account: storageAccount,
            metric_name: metricName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const metrics = res.data?.metrics;
    const points = metrics?.[0]?.timeseries?.[0]?.data || [];
    return points.filter((p: any) => typeof p.average === "number");
};

const fetchAzureVMMetrics = async (token: string, resourceGroup: string, vmName: string, metricName: string) => {
    const res = await axios.post(
        "http://127.0.0.1:8000/api/azure/vm-metrics",
        {
            resource_group: resourceGroup,
            vm_name: vmName,
            metric_name: metricName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const metrics = res.data?.metrics;
    const points = metrics?.[0]?.timeseries?.[0]?.data || [];
    return points.filter((p: any) => typeof p.average === "number");
};

const fetchAwsBilling = async (token: string, start: string, end: string) => {
    const res = await axios.post(
        "http://127.0.0.1:8000/api/billing",
        { start, end },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.[0]?.Groups || [];
};

const fetchAwsInstances = async (token: string) => {
    const res = await axios.post(
        "http://127.0.0.1:8000/aws/instances",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.instances || [];
};


const DashboardContent = () => {
    const [openModal, setOpenModal] = useState<"aws" | "azure" | null>(null);

    const handleLogout = async () => {
        await signOut(auth);
    };


    const { connectors, user } = useConnector();

    // Common params
    const resourceGroup = "ratify-group";
    const storageAccount = "ratifyhackathon";
    const vmName = "ratify-vm";
    const start = "2025-09-01T06:52:00+00:00";
    const end = "2025-09-14T06:52:00+00:00";

    // AWS: instances (special case because we auto-select first instance)
    const [instances, setInstances] = useState<any[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
    const [instancesLoading, setInstancesLoading] = useState(true);
    const [instancesError, setInstancesError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            if (!user || !connectors.aws) return setInstancesLoading(false);
            setInstancesLoading(true);
            try {
                const token = await user.getIdToken();
                const inst = await fetchAwsInstances(token);
                setInstances(inst);
                if (inst.length > 0) setSelectedInstance(inst[0].InstanceId);
            } catch (err: any) {
                setInstancesError(err.message || "Failed to fetch instances");
            } finally {
                setInstancesLoading(false);
            }
        };
        fetch();
    }, [user, connectors]);

    // AWS billing
    const billing = useMetric(async () => {
        if (!connectors.aws || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAwsBilling(token, start, end) : Promise.resolve([] as any[]);
    }, [user, connectors, start, end]);

    // AWS cpu metrics for selected instance
    const cpuMetrics = useMetric(() => {
        if (!connectors.aws || !selectedInstance) return Promise.resolve([] as any[]);
        return user
            ? axios
                .post(
                    `http://127.0.0.1:8000/api/aws/metrics/${selectedInstance}`,
                    {},
                    { headers: { Authorization: `Bearer ${user ? user.getIdToken() : ""}` } }
                )
                .then((r) => r.data)
            : Promise.resolve([] as any[]);
    }, [user, connectors, selectedInstance]);

    // Azure metrics (use generic fetcher)
    const availability = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureMetric(token, resourceGroup, storageAccount, "Availability") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, storageAccount]);

    const ingress = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureMetric(token, resourceGroup, storageAccount, "Ingress") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, storageAccount]);

    const egress = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureMetric(token, resourceGroup, storageAccount, "Egress") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, storageAccount]);

    const usedCapacity = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureMetric(token, resourceGroup, storageAccount, "UsedCapacity") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, storageAccount]);

    // VM-level metrics
    const cpuUsage = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureVMMetrics(token, resourceGroup, vmName, "Percentage CPU") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, vmName]);

    const memoryUsage = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureVMMetrics(token, resourceGroup, vmName, "Memory Percentage") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, vmName]);

    const diskThroughput = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureVMMetrics(token, resourceGroup, vmName, "OS Disk Read Bytes/sec") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, vmName]);

    const diskLatency = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureVMMetrics(token, resourceGroup, vmName, "OS Disk Latency") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, vmName]);

    const iopsUsage = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureVMMetrics(token, resourceGroup, vmName, "VM Cached IOPS Consumed Percentage") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, vmName]);

    const networkTraffic = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureVMMetrics(token, resourceGroup, vmName, "Network In Total") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, vmName]);

    const burstCredits = useMetric(async () => {
        if (!connectors.azure || !user) return Promise.resolve([] as any[]);
        const token = await user.getIdToken();
        return user ? fetchAzureVMMetrics(token, resourceGroup, vmName, "CPU Credits Remaining") : Promise.resolve([] as any[]);
    }, [user, connectors, resourceGroup, vmName]);

    // Compose widgets — components are pure presentational and receive data/loading/error as props
    const [widgets, setWidgets] = useState<Visual[]>([
        {
            id: "AWS Billing",
            label: "AWS Billing",
            provider: "aws",
            component: (
                <AwsBilling data={billing.data || []} />
            ),
        },
        {
            id: "AWS CPU Usage",
            label: "AWS CPU Usage",
            provider: "aws",
            component: (
                <AwsCPUUsage
                    instances={instances}
                    selectedInstance={selectedInstance}
                    data={cpuMetrics.data || []}
                    loading={cpuMetrics.loading || instancesLoading}
                    error={cpuMetrics.error || instancesError}
                    onSelectInstance={setSelectedInstance}
                />
            ),
        },
        {
            id: "availability",
            label: "Availability",
            provider: "azure",
            component: <Availability data={availability.data || []} loading={availability.loading} error={availability.error} />,
        },
        {
            id: "ingress",
            label: "Ingress",
            provider: "azure",
            component: <Ingress data={ingress.data || []} loading={ingress.loading} error={ingress.error} />,
        },
        {
            id: "egress",
            label: "Egress",
            provider: "azure",
            component: <Egress data={egress.data || []} loading={egress.loading} error={egress.error} />,
        },
        {
            id: "usedCapacity",
            label: "Used Capacity",
            provider: "azure",
            component: <UsedCapacity data={usedCapacity.data || []} loading={usedCapacity.loading} error={usedCapacity.error} />,
        },
        {
            id: "cpu",
            label: "CPU Usage (VM)",
            provider: "azure",
            component: <CPUUsage data={cpuUsage.data || []} loading={cpuUsage.loading} error={cpuUsage.error} />,
        },
        {
            id: "memory",
            label: "Memory Usage",
            provider: "azure",
            component: <MemoryUsage data={memoryUsage.data || []} loading={memoryUsage.loading} error={memoryUsage.error} />,
        },
        {
            id: "diskThroughput",
            label: "Disk Throughput",
            provider: "azure",
            component: <DiskThroughput data={diskThroughput.data || []} loading={diskThroughput.loading} error={diskThroughput.error} />,
        },
        {
            id: "diskLatency",
            label: "Disk Latency",
            provider: "azure",
            component: <DiskLatency data={diskLatency.data || []} loading={diskLatency.loading} error={diskLatency.error} />,
        },
        {
            id: "iops",
            label: "IOPS Usage",
            provider: "azure",
            component: <IOPSUsage data={iopsUsage.data || []} loading={iopsUsage.loading} error={iopsUsage.error} />,
        },
        {
            id: "network",
            label: "Network Traffic",
            provider: "azure",
            component: <NetworkTraffic data={networkTraffic.data || []} loading={networkTraffic.loading} error={networkTraffic.error} />,
        },
        {
            id: "burstCredits",
            label: "Burst Credits",
            provider: "azure",
            component: <BurstCredits data={burstCredits.data || []} loading={burstCredits.loading} error={burstCredits.error} />,
        },
    ])

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