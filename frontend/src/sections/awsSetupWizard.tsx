import React, { useState } from "react";

interface AwsWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AwsSetupWizard = ({ isOpen, onClose }: AwsWizardModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    rootEmail: "",
    accountId: "",
    iamUser: "",
    accessKey: "",
    secretKey: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  if (!isOpen) return null;

  const progressWidth = `${(step / 5) * 100}%`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-[480px] relative max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-lg font-bold mb-2">
          🚀 AWS Setup Wizard (Step {step}/5)
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-4 overflow-hidden">
          <div
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: progressWidth }}
          ></div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <p className="mb-2 font-medium">🔑 Sign in with your AWS Root Email</p>
            <p className="text-sm text-gray-600 mb-3">
              Go to{" "}
              <a
                href="https://console.aws.amazon.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                AWS Management Console
              </a>{" "}
              and log in with your <strong>root account email</strong>.
            </p>
            <input
              type="email"
              name="rootEmail"
              placeholder="Enter AWS root email"
              value={formData.rootEmail}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <p className="mb-2 font-medium">🆔 Find your AWS Account ID</p>
            <input
              type="text"
              name="accountId"
              placeholder="Enter Account ID (12 digits)"
              value={formData.accountId}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <p className="mb-2 font-medium">👤 Create an IAM User</p>
            <input
              type="text"
              name="iamUser"
              placeholder="Enter IAM Username"
              value={formData.iamUser}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <>
            <p className="mb-2 font-medium">🔐 Enter Access Key ID</p>
            <input
              type="text"
              name="accessKey"
              placeholder="Enter Access Key ID"
              value={formData.accessKey}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <>
            <p className="mb-2 font-medium">🔑 Enter Secret Access Key</p>
            <input
              type="password"
              name="secretKey"
              placeholder="Enter Secret Key"
              value={formData.secretKey}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                console.log("Submitted:", formData);
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

export default AwsSetupWizard;
