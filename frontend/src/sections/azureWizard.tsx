import React, { useState } from "react";

interface AzureWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AzureSetupWizard = ({ isOpen, onClose }: AzureWizardModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    azureEmail: "",
    subscriptionId: "",
    tenantId: "",
    clientId: "",
    clientSecret: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  if (!isOpen) return null;

  const progressWidth = `${(step / 5) * 100}%`;

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
            <p className="mb-2 font-medium">🔑 Sign in with your Azure Email</p>
            <p className="text-sm text-gray-600 mb-3">
              Go to{" "}
              <a
                href="https://portal.azure.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                Azure Portal
              </a>{" "}
              and log in with your <strong>Microsoft account email</strong>.
            </p>
            <input
              type="email"
              name="azureEmail"
              placeholder="Enter Azure account email"
              value={formData.azureEmail}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <p className="mb-2 font-medium">🆔 Find your Subscription ID</p>
            <p className="text-sm text-gray-600 mb-3">
              In Azure Portal → Navigate to{" "}
              <strong>Subscriptions</strong>. Select your subscription and copy
              the <strong>Subscription ID</strong>.
            </p>
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
            <p className="mb-2 font-medium">👤 Register an App in Azure AD</p>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              Go to <strong>Azure Active Directory</strong> →{" "}
              <strong>App registrations</strong> → <strong>New registration</strong>.
              <br />
              - Choose a <strong>name</strong> (e.g., <code>cloud-connector</code>) <br />
              - Redirect URI: leave blank or set as needed <br />
              - After creation, note down:
              <ul className="list-disc ml-5">
                <li>✅ <strong>Tenant ID</strong></li>
                <li>✅ <strong>Client ID</strong></li>
              </ul>
            </p>
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
            <p className="mb-2 font-medium">🔐 Create a Client Secret</p>
            <p className="text-sm text-gray-600 mb-3">
              In your App Registration → <strong>Certificates & secrets</strong>{" "}
              → <strong>New client secret</strong>.
              <br />
              Copy the generated <strong>secret value</strong> (⚠️ visible only once).
            </p>
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
              Go to your App Registration → <strong>API Permissions</strong> →
              Add:
              <ul className="list-disc ml-5">
                <li>✅ <code>Azure Service Management (user_impersonation)</code></li>
                <li>✅ Or specific resource-level permissions (VM, Storage, etc.)</li>
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
            <button
              onClick={() => {
                console.log("Azure Submitted:", formData);
                onClose();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AzureSetupWizard;
