import React from "react";
import { AnalyticsDashboard } from "../components";

const AnalyticsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <AnalyticsDashboard />
      </div>
    </div>
  );
};

export default AnalyticsPage;
