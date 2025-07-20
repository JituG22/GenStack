import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import ChatComponent from "./ChatComponent";
import { MessageSquare, X } from "lucide-react";

interface CommunicationPanelProps {
  projectId?: string;
  className?: string;
}

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  projectId,
  className = "",
}) => {
  const { user } = useAuth();
  console.log("🗨️ CommunicationPanel user object:", user);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Use project-specific session or general session
  const sessionId = projectId || "general";

  if (!user) {
    return (
      <div
        className={`bg-gray-100 border-l border-gray-200 ${className} flex items-center justify-center`}
      >
        <div className="text-center p-4">
          <p className="text-sm text-gray-500">
            Please log in to access communication features
          </p>
        </div>
      </div>
    );
  }

  // Ensure user has valid ID for Chat
  if (!user.id) {
    console.error("🔴 User object missing ID:", user);
    return (
      <div
        className={`bg-gray-100 border-l border-gray-200 ${className} flex items-center justify-center`}
      >
        <div className="text-center p-4">
          <p className="text-sm text-red-500">
            User authentication error. Please refresh and try again.
          </p>
        </div>
      </div>
    );
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <div className={`bg-white border-l border-gray-200 ${className}`}>
        <div className="p-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded flex items-center justify-center"
            title="Expand Communication Panel"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border-l border-gray-200 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Collapse Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Session Info */}
        {projectId && (
          <div className="text-xs text-gray-500">
            Project Session: {projectId}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ChatComponent
          sessionId={sessionId}
          currentUserId={user.id}
          className="h-full"
          isCollapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
        />
      </div>
    </div>
  );
};

export default CommunicationPanel;
