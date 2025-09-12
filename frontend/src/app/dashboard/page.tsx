"use client";

import { ConnectorProvider } from "@/context/ConnectorContext";
import DashboardContent from "@/visuals/dashboardContent";

export default function Dashboard() {


  return (
    <ConnectorProvider>
      <DashboardContent />
    </ConnectorProvider>
  );
}
