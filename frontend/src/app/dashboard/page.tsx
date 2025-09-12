"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import AWSLogo from "@/assets/images.png";
import AzoreLogo from "@/assets/azure.png";

const sampleBillingData = [
  { date: "2025-09-01", aws: 12, azure: 10 },
  { date: "2025-09-02", aws: 18, azure: 14 },
  { date: "2025-09-03", aws: 20, azure: 15 },
];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [awsDetails, setAwsDetails] = useState({ accessKey: "", secretKey: "", region: "" });
  const [azureDetails, setAzureDetails] = useState({ clientId: "", tenantId: "", secret: "", subscriptionId: "" });
  const [linked, setLinked] = useState({ aws: false, azure: false });
  const [step, setStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"overview" | "aws" | "azure">("overview");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleConnect = (provider: "aws" | "azure") => {
    // for demo: mark linked (replace with API call to store connector)
    setLinked((p) => ({ ...p, [provider]: true }));
    // if both linked go to dashboard
    setStep((s) => {
      const next = provider === "aws" ? (linked.azure ? 3 : 2) : linked.aws ? 3 : 2;
      return next;
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    // after signOut user state will become null and UI will show login block
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-lg w-full p-8 bg-white/80 rounded-2xl shadow-lg backdrop-blur-sm text-center">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-2">Please log in</h2>
          <p className="text-gray-600">You must be logged in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <span>Unified Cloud Dashboard</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">Welcome, {user?.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-sm transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Connectors container */}
      {step === 1 && (
        <section className="bg-gradient-to-r from-blue-100/60 via-indigo-50 to-white p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-indigo-700 mb-4">🔗 Connect your cloud accounts</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AWS Card */}
            <div className="bg-white border border-blue-50 rounded-2xl p-6 shadow-sm flex flex-col min-h-[340px]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Image src={AWSLogo} alt="AWS" width={56} height={24} className="object-contain" />
                  <h3 className="text-lg font-medium text-gray-800">AWS Connector</h3>
                </div>

                <label className="sr-only">Access Key</label>
                <input
                  value={awsDetails.accessKey}
                  onChange={(e) => setAwsDetails({ ...awsDetails, accessKey: e.target.value })}
                  placeholder="Access Key"
                  className="w-full rounded-md border border-gray-200 p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />

                <label className="sr-only">Secret Key</label>
                <input
                  value={awsDetails.secretKey}
                  onChange={(e) => setAwsDetails({ ...awsDetails, secretKey: e.target.value })}
                  placeholder="Secret Key"
                  type="password"
                  className="w-full rounded-md border border-gray-200 p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />

                <label className="sr-only">Region</label>
                <input
                  value={awsDetails.region}
                  onChange={(e) => setAwsDetails({ ...awsDetails, region: e.target.value })}
                  placeholder="Region (e.g. us-east-1)"
                  className="w-full rounded-md border border-gray-200 p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Button placed at bottom to align with Azure's button */}
              <div className="mt-auto">
                <button
                  onClick={() => handleConnect("aws")}
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow transition"
                >
                  Connect AWS
                </button>
              </div>
            </div>

            {/* Azure Card */}
            <div className="bg-white border border-blue-50 rounded-2xl p-6 shadow-sm flex flex-col min-h-[340px]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Image src={AzoreLogo} alt="Azure" width={90} height={30} className="object-contain" />
                  <h3 className="text-lg font-medium text-gray-800">Azure Connector</h3>
                </div>

                <label className="sr-only">Client ID</label>
                <input
                  value={azureDetails.clientId}
                  onChange={(e) => setAzureDetails({ ...azureDetails, clientId: e.target.value })}
                  placeholder="Client ID"
                  className="w-full rounded-md border border-gray-200 p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <label className="sr-only">Tenant ID</label>
                <input
                  value={azureDetails.tenantId}
                  onChange={(e) => setAzureDetails({ ...azureDetails, tenantId: e.target.value })}
                  placeholder="Tenant ID"
                  className="w-full rounded-md border border-gray-200 p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <label className="sr-only">Client Secret</label>
                <input
                  value={azureDetails.secret}
                  onChange={(e) => setAzureDetails({ ...azureDetails, secret: e.target.value })}
                  placeholder="Client Secret"
                  type="password"
                  className="w-full rounded-md border border-gray-200 p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <label className="sr-only">Subscription ID</label>
                <input
                  value={azureDetails.subscriptionId}
                  onChange={(e) => setAzureDetails({ ...azureDetails, subscriptionId: e.target.value })}
                  placeholder="Subscription ID"
                  className="w-full rounded-md border border-gray-200 p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => handleConnect("azure")}
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition"
                >
                  Connect Azure
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 2: quick status */}
      {step === 2 && (
        <section className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-2">AWS</h3>
            <p className="text-sm text-gray-600 mb-4">{linked.aws ? "Connected ✅" : "Not connected"}</p>
            <button className="mt-auto py-2 px-4 rounded bg-indigo-600 text-white" onClick={() => setStep(1)}>
              Edit
            </button>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-2">Azure</h3>
            <p className="text-sm text-gray-600 mb-4">{linked.azure ? "Connected ✅" : "Not connected"}</p>
            <button className="mt-auto py-2 px-4 rounded bg-blue-600 text-white" onClick={() => setStep(1)}>
              Edit
            </button>
          </div>
        </section>
      )}

      {/* Step 3: Analytics */}
      {step === 3 && (
        <section className="space-y-6">
          {/* Tabs */}
          <nav className="flex gap-4">
            {(["overview", "aws", "azure"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-md transition ${
                  activeTab === t ? "bg-indigo-600 text-white" : "text-gray-600 bg-white/60"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </nav>

          {activeTab === "overview" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold text-gray-800 mb-4">Billing Overview</h3>
              <LineChart width={720} height={320} data={sampleBillingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="aws" stroke="#1E40AF" />
                <Line type="monotone" dataKey="azure" stroke="#0EA5E9" />
              </LineChart>
            </div>
          )}

          {activeTab === "aws" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold text-gray-800 mb-2">AWS Metrics</h3>
              <p className="text-gray-600">EC2, S3, AutoScaling insights (placeholder)</p>
            </div>
          )}

          {activeTab === "azure" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold text-gray-800 mb-2">Azure Metrics</h3>
              <p className="text-gray-600">VMs, Blob storage, Cost insights (placeholder)</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
