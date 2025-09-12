import React, { useState } from "react";
import { Check, Loader2 } from "lucide-react";

type Step = {
  title: string;
  description: string;
  content?: React.ReactNode;
};

const AzureWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Fake Test connection
  const testConnection = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setConnected(true);
    }, 1500);
  };

  // Wizard Steps (instructions only)
  const azureSteps: Step[] = [
    {
      title: "Register App",
      description:
        "Go to Azure AD → App Registrations → New. Name it `MyAppConnector`.",
    },
    {
      title: "Get IDs",
      description:
        "From App Registration, copy your **Tenant ID** and **Client ID**. Paste them into the Azure Connector form on the left.",
    },
    {
      title: "Generate Secret",
      description:
        "Go to Certificates & Secrets → New Client Secret → Copy the value and paste it in the Connector form.",
    },
    {
      title: "Assign Roles",
      description: "Assign these roles to your App in your Subscription IAM:",
      content: (
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>
            <strong>Virtual Machine Contributor</strong> → manage VMs
          </li>
          <li>
            <strong>Storage Blob Data Contributor</strong> → manage storage
          </li>
        </ul>
      ),
    },
    {
      title: "Subscription ID",
      description:
        "Go to Azure Subscriptions → Copy your Subscription ID and paste it in the Connector form.",
    },
    {
      title: "Test Connection",
      description:
        "Click **Test Connection** in the Connector form to verify credentials and permissions.",
      content: (
        <button
          className="flex items-center justify-center gap-2 w-full py-2 rounded bg-indigo-600 text-white"
          onClick={testConnection}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Simulate Test"
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Title */}
      <h1 className="text-xl font-bold mb-4">
        ☁️ Azure Setup Wizard ({azureSteps.length} Steps)
      </h1>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${((step + 1) / azureSteps.length) * 100}%` }}
        ></div>
      </div>

      {/* Step Content */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{azureSteps[step].title}</h2>
        <p className="text-gray-600 mb-3">{azureSteps[step].description}</p>
        {azureSteps[step].content}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          className="px-4 py-2 bg-gray-100 rounded"
          disabled={step === 0}
        >
          Back
        </button>
        {step < azureSteps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Next
          </button>
        ) : (
          connected && (
            <div className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
              <Check size={18} /> Connected!
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AzureWizard;
