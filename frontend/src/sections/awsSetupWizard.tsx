import React, { useState, useEffect } from "react";
import { auth } from "@/firebase"; // Adjust path
import axios from "axios";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";

interface AwsWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AwsSetupWizard = ({ isOpen, onClose }: AwsWizardModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    accessKey: "",
    secretKey: "",
    region: "us-east-1",
  });
  const [user, loading] = useAuthState(auth);
  const [idToken, setIdToken] = useState<string | null>(null);

  // Get ID token for API auth
  useEffect(() => {
    if (user) {
      user.getIdToken().then((token) => setIdToken(token));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  if (!isOpen) return null;

  const progressWidth = `${(step / 3) * 100}%`;

  const handleFinish = async () => {
    if (!idToken) {
      toast.error("You must be logged in to connect AWS");
      return;
    }

    try {
      const payload = {
        access_key: formData.accessKey,
        secret_key: formData.secretKey,
        region: formData.region,
      };

      const res = await axios.post("http://127.0.0.1:8000/api/connectors/aws", payload, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      console.log("AWS Connector Added:", res.data);
      toast.success("AWS Connected Successfully!");
      onClose();
    } catch (err: any) {
      console.error("Error adding AWS connector:", err.response?.data || err.message);
      toast.error("Failed to connect AWS: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[480px] relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
          ✖
        </button>

        <h2 className="text-lg font-bold mb-2">🚀 AWS Setup Wizard (Step {step}/3)</h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: progressWidth }}></div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <p className="mb-2 font-medium">👤 Create a new IAM User</p>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              1️⃣ Go to <strong>AWS Console → IAM → Users → Add Users</strong>.<br />
              2️⃣ Username: <code>cloud-connector</code>.<br />
              3️⃣ Access type: <strong>Programmatic access</strong>.<br />
              4️⃣ Attach existing policies: <strong>ReadOnlyAccess</strong> (allows us to read metrics safely).<br />
              5️⃣ Skip tags, review and create user.<br />
              6️⃣ Download the CSV file containing <strong>Access Key ID</strong> and <strong>Secret Access Key</strong>.
            </p>
            <button onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded-md">Next</button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <p className="mb-2 font-medium">🔑 Enter Access Keys</p>
            <input
              type="text"
              name="accessKey"
              placeholder="Enter Access Key ID"
              value={formData.accessKey}
              onChange={handleChange}
              className="w-full border rounded-md p-2 mb-3"
            />
            <input
              type="password"
              name="secretKey"
              placeholder="Enter Secret Access Key"
              value={formData.secretKey}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
            <div className="flex justify-between mt-4">
              <button onClick={prevStep} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
              <button onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded-md">Next</button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <p className="mb-2 font-medium">🌍 Select AWS Region</p>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full border rounded-md p-2 mb-3"
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="ap-south-1">Asia Pacific (Mumbai)</option>
              <option value="eu-west-1">EU (Ireland)</option>
              {/* Add more as needed */}
            </select>
            <div className="flex justify-between mt-4">
              <button onClick={prevStep} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
              <button onClick={handleFinish} className="px-4 py-2 bg-green-600 text-white rounded-md">Finish & Connect</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AwsSetupWizard;
