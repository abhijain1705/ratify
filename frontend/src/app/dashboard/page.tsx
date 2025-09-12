"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/firebase";

// Sections
import AwsSetupWizard from "@/sections/awsSetupWizard";
import AzureWizard from "@/sections/azureWizard";

// Visuals
import Availability from "@/visuals/Availability";
import Egress from "@/visuals/egress";
import Ingress from "@/visuals/ingress";
import SuccessE2ELatency from "@/visuals/SuccessE2ELatency";
import SuccessServerLatency from "@/visuals/SuccessServerLatency";
import Transactions from "@/visuals/Transactions";
import UsedCapacity from "@/visuals/UsedCapacity";

// Assets
import AWSLogo from "@/assets/images.png";
import AzureLogo from "@/assets/azure.png";

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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [openModal, setOpenModal] = useState<"aws" | "azure" | null>(null);
  const [awsConnected, setAwsConnected] = useState(false);
  const [azureConnected, setAzureConnected] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🌐 Unified Cloud Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow"
        >
          Logout
        </button>
      </div>

      <p className="text-gray-600">Welcome back, {user.displayName} 👋</p>

      {/* Connectors Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AWS Card */}
        <div className="bg-white border rounded-2xl p-6 shadow flex flex-col items-center">
          <Image src={AWSLogo} alt="AWS" width={80} height={40} />
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-6">
            AWS Connector
          </h3>
          <button
            onClick={() => setOpenModal("aws")}
            className={`w-full py-3 rounded-lg ${
              awsConnected
                ? "bg-green-600 hover:bg-green-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white font-medium shadow transition`}
          >
            {awsConnected ? "Connected ✅" : "Open AWS Setup"}
          </button>
        </div>

        {/* Azure Card */}
        <div className="bg-white border rounded-2xl p-6 shadow flex flex-col items-center">
          <Image src={AzureLogo} alt="Azure" width={100} height={50} />
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-6">
            Azure Connector
          </h3>
          <button
            onClick={() => setOpenModal("azure")}
            className={`w-full py-3 rounded-lg ${
              azureConnected
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-medium shadow transition`}
          >
            {azureConnected ? "Connected ✅" : "Open Azure Setup"}
          </button>
        </div>
      </section>

      {/* Show Visuals only if connected */}
      {(awsConnected || azureConnected) && (
        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-10">
          <Availability />
          <Ingress />
          <Egress />
          <SuccessE2ELatency />
          <SuccessServerLatency />
          <Transactions />
          <UsedCapacity />
        </section>
      )}

      {/* Popup Modals */}
      <Modal isOpen={openModal === "aws"} onClose={() => setOpenModal(null)}>
        <AwsSetupWizard
          isOpen={openModal === "aws"}
          onClose={() => {
            setOpenModal(null);
            setAwsConnected(true); // mark AWS as connected after closing
          }}
        />
      </Modal>

      <Modal isOpen={openModal === "azure"} onClose={() => setOpenModal(null)}>
        <AzureWizard
          isOpen={openModal === "azure"}
          onClose={() => {
            setOpenModal(null);
            setAzureConnected(true); // mark Azure as connected after closing
          }}
        />
      </Modal>
    </div>
  );
}
