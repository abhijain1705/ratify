"use client";
import React, { useState } from "react";
import axios from "axios";
import Image from "next/image";
import AWSLogo from "@/assets/images.png";
import { useConnector } from "@/context/ConnectorContext";

// Simple Modal Component
function Modal({
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
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl relative">
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

const AwsControls = () => {
    const { user } = useConnector();
    const [asg, setAsg] = useState("my-demo-asg");
    const [capacity, setCapacity] = useState(2);
    const [sgId, setSgId] = useState("sg-07b9313650a586cf8");
    const [port, setPort] = useState(22);
    const [protocol, setProtocol] = useState("tcp");
    const [cidr, setCidr] = useState("0.0.0.0/0");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [open, setOpen] = useState(false);

    const handleScale = async () => {
        try {
            setLoading(true);
            const token = user ? await user.getIdToken() : "";
            const res = await axios.post(
                "http://127.0.0.1:8000/api/aws/scale",
                { asg, desired_capacity: capacity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMsg(`✅ ${res.data.msg || "ASG scaled successfully"}`);
        } catch (err: any) {
            setMsg(`❌ ${err.response?.data?.detail || "Scaling failed"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFirewall = async () => {
        try {
            setLoading(true);
            const token = user ? await user.getIdToken() : "";
            const res = await axios.post(
                "http://127.0.0.1:8000/api/aws/security/firewall",
                { sg_id: sgId, port, protocol, cidr },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMsg(`✅ ${res.data.msg}`);
        } catch (err: any) {
            setMsg(`❌ ${err.response?.data?.detail || "Firewall update failed"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Open Modal Button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-3 px-5 py-3 bg-[#FF9900] text-white font-semibold rounded-lg shadow hover:bg-[#e68a00] transition"
            >
                <Image src={AWSLogo} alt="AWS" width={28} height={28} />
                <span>Manage AWS Scaling & Firewall</span>
            </button>

            {/* Modal */}
            <Modal isOpen={open} onClose={() => setOpen(false)}>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* ASG Scaling */}
                    <div className="bg-gray-50 rounded-xl p-5 shadow">
                        <h2 className="text-lg font-semibold mb-4">Auto Scaling Group</h2>
                        <label>Auto Scaling Group</label>
                        <input
                            type="text"
                            placeholder="ASG Name"
                            value={asg}
                            onChange={(e) => setAsg(e.target.value)}
                            className="w-full border p-2 rounded mb-3"
                        />
                        <label>Desired Instance</label>
                        <input
                            type="number"
                            placeholder="Desired Capacity"
                            value={capacity}

                            onChange={(e) => setCapacity(Number(e.target.value))}
                            className="w-full border p-2 rounded mb-3"
                        />
                        <button
                            onClick={handleScale}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {loading ? "Scaling..." : "Scale ASG"}
                        </button>
                    </div>

                    {/* Firewall Rules */}
                    <div className="bg-gray-50 rounded-xl p-5 shadow">
                        <h2 className="text-lg font-semibold mb-4">Firewall Rules</h2>
                        <input
                            type="text"
                            placeholder="Security Group ID"
                            value={sgId}
                            onChange={(e) => setSgId(e.target.value)}
                            className="w-full border p-2 rounded mb-3"
                        />
                        <input
                            type="number"
                            placeholder="Port"
                            value={port}
                            onChange={(e) => setPort(Number(e.target.value))}
                            className="w-full border p-2 rounded mb-3"
                        />
                        <select
                            value={protocol}
                            onChange={(e) => setProtocol(e.target.value)}
                            className="w-full border p-2 rounded mb-3"
                        >
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                            <option value="icmp">ICMP</option>
                        </select>
                        <input
                            type="text"
                            placeholder="CIDR (e.g., 0.0.0.0/0)"
                            value={cidr}
                            onChange={(e) => setCidr(e.target.value)}
                            className="w-full border p-2 rounded mb-3"
                        />
                        <button
                            onClick={handleFirewall}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            {loading ? "Applying..." : "Add Firewall Rule"}
                        </button>
                    </div>

                    {/* Feedback */}
                    {msg && (
                        <div className="col-span-2 bg-gray-100 border rounded-lg p-3 text-sm text-center">
                            {msg}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default AwsControls;
