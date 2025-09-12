"use client";
import AzoreLogo from "@/assets/azure.png";
import AWSLogo from "@/assets/images.png";
import Image from "next/image";                                                   
import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
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
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleConnect = (provider: "aws" | "azure") => {
    setLinked((prev) => ({ ...prev, [provider]: true }));
    if ((provider === "aws" && linked.azure) || (provider === "azure" && linked.aws)) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-xl font-bold mb-4">You must be logged in to access this page.</h1>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-2xl font-bold">🌐 Unified Cloud Dashboard</h1>
      <p className="text-gray-600">Welcome, {user?.email}</p>

      {/* Step 1: Enter Connector Details */}
      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* AWS */}
          <div className="border rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-3">
                
                <Image src={AWSLogo} alt="celestial logo" className="logo-ticker-image" />
                 AWS Connector</h2>
            <input className="w-full p-2 border rounded mb-2" placeholder="Access Key"
              value={awsDetails.accessKey} onChange={(e) => setAwsDetails({ ...awsDetails, accessKey: e.target.value })} />
            <input className="w-full p-2 border rounded mb-2" placeholder="Secret Key" type="password"
              value={awsDetails.secretKey} onChange={(e) => setAwsDetails({ ...awsDetails, secretKey: e.target.value })} />
            <input className="w-full p-2 border rounded mb-4" placeholder="Region (e.g. us-east-1)"
              value={awsDetails.region} onChange={(e) => setAwsDetails({ ...awsDetails, region: e.target.value })} />
            <button className="w-full bg-blue-600 text-white p-2 rounded" onClick={() => handleConnect("aws")}>
              Connect AWS
            </button>
          </div>

          {/* Azure */}
          <div className="border rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-3">
                <Image src={AzoreLogo} alt="Echo logo" className="logo-ticker-image" />
                 Azure Connector</h2>
            <input className="w-full p-2 border rounded mb-2" placeholder="Client ID"
              value={azureDetails.clientId} onChange={(e) => setAzureDetails({ ...azureDetails, clientId: e.target.value })} />
            <input className="w-full p-2 border rounded mb-2" placeholder="Tenant ID"
              value={azureDetails.tenantId} onChange={(e) => setAzureDetails({ ...azureDetails, tenantId: e.target.value })} />
            <input className="w-full p-2 border rounded mb-2" placeholder="Client Secret" type="password"
              value={azureDetails.secret} onChange={(e) => setAzureDetails({ ...azureDetails, secret: e.target.value })} />
            <input className="w-full p-2 border rounded mb-4" placeholder="Subscription ID"
              value={azureDetails.subscriptionId} onChange={(e) => setAzureDetails({ ...azureDetails, subscriptionId: e.target.value })} />
            <button className="w-full bg-green-600 text-white p-2 rounded" onClick={() => handleConnect("azure")}>
              Connect Azure
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Show linked accounts */}
      {step === 2 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold">AWS</h2>
            {linked.aws ? <p className="text-green-600">✅ Connected</p> : <p className="text-red-500">❌ Not Connected</p>}
          </div>
          <div className="border rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold">Azure</h2>
            {linked.azure ? <p className="text-green-600">✅ Connected</p> : <p className="text-red-500">❌ Not Connected</p>}
          </div>
          {linked.aws && linked.azure && (
            <div className="col-span-2">
              <button onClick={() => setStep(3)} className="w-full bg-indigo-600 text-white p-2 rounded">
                View Analytics Dashboard →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Analytics */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex space-x-4 border-b">
            {["overview", "aws", "azure"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 ${activeTab === tab ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="border rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold mb-2">💰 Billing Overview</h2>
              <LineChart width={600} height={300} data={sampleBillingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="aws" stroke="#2563eb" />
                <Line type="monotone" dataKey="azure" stroke="#16a34a" />
              </LineChart>
            </div>
          )}

          {activeTab === "aws" && (
            <div className="border rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold">AWS Metrics</h2>
              <p className="text-gray-500">[Placeholder: EC2 CPU / S3 storage charts]</p>
            </div>
          )}

          {activeTab === "azure" && (
            <div className="border rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold">Azure Metrics</h2>
              <p className="text-gray-500">[Placeholder: VM CPU / Blob storage charts]</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
