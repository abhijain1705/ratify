"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import { useConnector } from "@/context/ConnectorContext";

interface AzureWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AzureSetupWizard = ({ isOpen, onClose }: AzureWizardModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    subscriptionId: "",
    tenantId: "",
    clientId: "",
    clientSecret: "",
  });
  const [user, loading] = useAuthState(auth);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loader, setloader] = useState(false)
  const { setConnector } = useConnector()

  useEffect(() => {
    if (user) {
      user.getIdToken().then((token) => setIdToken(token));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  if (!isOpen) return null;

  const progressWidth = `${(step / 5) * 100}%`;

  const handleFinish = async () => {
    if (!idToken) {
      toast.error("You must be logged in to connect Azure");
      return;
    }

    try {
      const payload = {
        tenant_id: formData.tenantId,
        client_id: formData.clientId,
        client_secret: formData.clientSecret,
        subscription_id: formData.subscriptionId,
      };

      setloader(true)
      const res = await axios.post(
        "http://127.0.0.1:8000/api/connectors/azure",
        payload,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      setConnector("azure", true)
      console.log("Azure Connector Added:", res.data);
      toast.success("Azure Connected Successfully!");
    } catch (err: any) {
      console.error("Error adding Azure connector:", err.response?.data || err.message);
      toast.error("Failed to connect Azure: " + (err.response?.data?.detail || err.message));
    } finally {
      onClose();
      setloader(false)
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[480px] relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-lg font-bold mb-2">
          ☁ Azure Setup Wizard (Step {step}/5)
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: progressWidth }}
          ></div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <p className="mb-2 font-medium">🔑 Setup Azure for Secure Access</p>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              Our platform connects to your Azure subscription securely using{" "}
              <strong>Azure AD App Registration</strong>. This avoids giving us
              your root credentials — you stay in control 🔐.
            </p>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              Steps you’ll follow:
              <ul className="list-disc ml-5 mt-1">
                <li>Login to the{" "}
                  <a
                    href="https://portal.azure.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline"
                  >
                    Azure Portal
                  </a>
                </li>
                <li>Register a new application in{" "}
                  <strong>Azure Active Directory → App registrations</strong>
                </li>
                <li>Collect the <strong>Tenant ID</strong> & <strong>Client ID</strong></li>
                <li>Create a <strong>Client Secret</strong> (password for the app)</li>
                <li>Copy your <strong>Subscription ID</strong> from{" "}
                  <strong>Subscriptions</strong>
                </li>
              </ul>
              Don’t worry, the next steps guide you one by one. 🚀
            </p>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <p className="mb-2 font-medium">🆔 Enter Subscription ID</p>
            <input
              type="text"
              name="subscriptionId"
              placeholder="Enter Subscription ID"
              value={formData.subscriptionId}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <p className="mb-2 font-medium">👤 Enter Tenant & Client ID</p>
            <input
              type="text"
              name="tenantId"
              placeholder="Enter Tenant ID"
              value={formData.tenantId}
              onChange={handleChange}
              className="w-full border rounded-md p-2 mb-2"
            />
            <input
              type="text"
              name="clientId"
              placeholder="Enter Client ID"
              value={formData.clientId}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <>
            <p className="mb-2 font-medium">🔐 Enter Client Secret</p>
            <input
              type="password"
              name="clientSecret"
              placeholder="Enter Client Secret"
              value={formData.clientSecret}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <>
            <p className="mb-2 font-medium">⚙ Assign Permissions</p>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              Make sure your app has:
              <ul className="list-disc ml-5">
                <li>
                  ✅ <code>Azure Service Management (user_impersonation)</code>
                </li>
                <li>✅ Any resource-level permissions you want us to monitor (VM, Storage, etc.)</li>
              </ul>
              Then click <strong>Grant admin consent</strong>.
            </p>
            <p className="text-green-600 font-medium">✅ Setup Complete</p>
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Next
            </button>
          ) : (
            <button disabled={loader}
              onClick={handleFinish}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              {loader ? "Connecting..." : "Finish & Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AzureSetupWizard;
