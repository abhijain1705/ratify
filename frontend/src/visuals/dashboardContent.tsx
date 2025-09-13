"use client"
import React, { useCallback } from 'react'

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
import Availability from "@/visuals/Availability";
import Egress from "@/visuals/egress";
import Ingress from "@/visuals/ingress";
import SuccessE2ELatency from "@/visuals/SuccessE2ELatency";
import VisualsControlPopover, { Group, Visual } from "./VisualsControlPopover";
import SuccessServerLatency from "@/visuals/SuccessServerLatency";
import Transactions from "@/visuals/Transactions";
import UsedCapacity from "@/visuals/UsedCapacity";
import BurstCredits from './VMBurstCredits';
import CPUUsage from './VMCpuUsage';
import DiskLatency from './VMDiskLatency';
import DiskThroughput from './VMDiskThrouhput';
import IOPSUsage from './VMIOPSUsage';
import MemoryUsage from './VMMemoryUsage';
import NetworkTraffic from './VMNetworkTraffic';
import CloudMenu from "@/sections/cloudMenu";
import { useConnector } from '@/context/ConnectorContext';
import AwsCPUUsage from './awsCpuUsage';
import AwsControls from './AwsControls';

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

    const [widgets, setWidgets] = useState<Visual[]>([
        { id: "AWS CPU Usage", label: "AWS CPU Usage", provider: "aws", component: <AwsCPUUsage /> },
        { id: "availability", label: "Availability", provider: "azure", component: <Availability /> },
        { id: "ingress", label: "Ingress", provider: "azure", component: <Ingress /> },
        { id: "egress", label: "Egress", provider: "azure", component: <Egress /> },
        { id: "e2eLatency", label: "End-to-End Latency", provider: "azure", component: <SuccessE2ELatency /> },
        { id: "serverLatency", label: "Server Latency", provider: "azure", component: <SuccessServerLatency /> },
        { id: "transactions", label: "Transactions", provider: "azure", component: <Transactions /> },
        { id: "usedCapacity", label: "Used Capacity", provider: "azure", component: <UsedCapacity /> },
        { id: "cpu", label: "CPU Usage", provider: "azure", component: <CPUUsage /> },
        { id: "memory", label: "Memory Usage", provider: "azure", component: <MemoryUsage /> },
        { id: "diskThroughput", label: "Disk Throughput", provider: "azure", component: <DiskThroughput /> },
        { id: "diskLatency", label: "Disk Latency", provider: "azure", component: <DiskLatency /> },
        { id: "iops", label: "IOPS Usage", provider: "azure", component: <IOPSUsage /> },
        { id: "network", label: "Network Traffic", provider: "azure", component: <NetworkTraffic /> },
        { id: "burstCredits", label: "Burst Credits", provider: "azure", component: <BurstCredits /> },
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

            {<DndProvider backend={HTML5Backend}>
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
            </DndProvider>}


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