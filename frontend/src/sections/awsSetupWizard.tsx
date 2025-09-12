import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Copy } from "lucide-react";

const steps = [
  {
    title: "Sign in to AWS Console",
    content: (
      <p>
        Go to{" "}
        <a
          href="https://console.aws.amazon.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          AWS Management Console
        </a>{" "}
        and log in with your root account or IAM admin.
      </p>
    ),
  },
  {
    title: "Create IAM User",
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>
          Navigate to <b>IAM → Users → Add User</b>
        </li>
        <li>
          Give it a name (e.g. <code>UnifiedCloudUser</code>)
        </li>
        <li>
          Select <b>Programmatic Access</b>
        </li>
        <li>
          ❌ Do <b>NOT</b> enable console access
        </li>
      </ul>
    ),
  },
  {
    title: "Attach Policy",
    content: (
      <>
        <p>
          Copy the following JSON policy and attach it to the IAM user. This
          gives <b>only the minimum permissions</b> required:
        </p>
        <div className="bg-gray-100 p-3 rounded-lg relative mt-2">
          <pre className="text-sm overflow-x-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics",
        "iam:GetUser"
      ],
      "Resource": "*"
    }
  ]
}`}
          </pre>
          <button
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200"
            onClick={() =>
              navigator.clipboard.writeText(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics",
        "iam:GetUser"
      ],
      "Resource": "*"
    }
  ]
}`)
            }
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </>
    ),
  },
  {
    title: "Download Access Keys",
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>
          After creating the user → download the <code>.csv</code> file
        </li>
        <li>
          It contains <b>Access Key ID</b> and <b>Secret Access Key</b>
        </li>
        <li>Keep it safe 🔒</li>
      </ul>
    ),
  },
  {
    title: "Connect in Dashboard",
    content: (
      <p>
        Enter your <b>Access Key</b>, <b>Secret Key</b>, and{" "}
        <b>Region (e.g. us-east-1)</b> into the dashboard → Click{" "}
        <span className="font-semibold">Connect AWS</span>. ✅ Done!
      </p>
    ),
  },
];

const AwsSetupWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">
          🚀 AWS Setup Wizard (5 Steps)
        </h2>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-2">
              {steps[currentStep].title}
            </h3>
            <div className="text-gray-700 space-y-3">
              {steps[currentStep].content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Back
          </button>
          {currentStep === steps.length - 1 ? (
            <button className="px-4 py-2 flex items-center rounded-md bg-green-600 text-white hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finish
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={nextStep}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AwsSetupWizard;
