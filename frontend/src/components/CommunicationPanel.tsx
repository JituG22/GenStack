import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ChatComponent from "./ChatComponent";
import { MessageSquare, X } from "lucide-react";

interface CommunicationPanelProps {
  projectId?: string;
  className?: string;
  isExpanded?: boolean;
  onToggleCollapse?: (expanded: boolean) => void;
}

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  projectId,
  className = "",
  isExpanded = true,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Use project-specific session or general session
  const sessionId = projectId || "general";

  // Handle collapse
  const handleToggleExpand = (expanded: boolean) => {
    onToggleCollapse?.(expanded);
  };

  // Simulate new message indicator (you can connect this to actual message events)
  useEffect(() => {
    if (!isExpanded) {
      // You can add logic here to detect new messages and set hasNewMessages to true
      // For now, we'll just simulate it occasionally
      const interval = setInterval(() => {
        if (Math.random() > 0.8) {
          // setHasNewMessages(true); // Removed for now
        }
      }, 5000);
      return () => clearInterval(interval);
    } else {
      // setHasNewMessages(false); // Removed for now
    }
  }, [isExpanded]);

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

  if (!isExpanded) {
    return null; // Return null so component takes no space in layout
  }

  return (
    <div
      className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Communication</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleToggleExpand(false)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors duration-200"
              title="Collapse Chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Only Label */}
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Team Chat</span>
        </div>

        {/* Session Info */}
        {projectId && (
          <div className="mt-2 text-xs text-gray-500">
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
