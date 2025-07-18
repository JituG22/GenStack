import React from "react";
import { NotificationCenter } from "../components";

const NotificationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <NotificationCenter />
      </div>
    </div>
  );
};

export default NotificationsPage;
