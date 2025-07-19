import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import ChatComponent from "./ChatComponent";
import WebRTCComponent from "./WebRTCComponent";
import { MessageSquare, Video, X, Maximize2, Minimize2 } from "lucide-react";

interface CommunicationPanelProps {
  projectId?: string;
  className?: string;
}

type PanelView = "chat" | "webrtc" | "both";

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  projectId,
  className = "",
}) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<PanelView>("chat");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isWebRTCCollapsed, setIsWebRTCCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  if (!isExpanded) {
    return (
      <div className={`bg-white border-l border-gray-200 ${className}`}>
        <div className="p-2 flex flex-col space-y-2">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded flex items-center justify-center"
            title="Open Communication Panel"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setActiveView("webrtc");
              setIsExpanded(true);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded flex items-center justify-center"
            title="Open Video Call"
          >
            <Video className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  const renderTabButton = (
    view: PanelView,
    icon: React.ReactNode,
    label: string,
    disabled = false
  ) => (
    <button
      onClick={() => !disabled && setActiveView(view)}
      disabled={disabled}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${
          activeView === view
            ? "bg-blue-100 text-blue-700"
            : disabled
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderContent = () => {
    if (isFullscreen && activeView === "webrtc") {
      return (
        <div className="fixed inset-0 z-50 bg-white">
          <WebRTCComponent
            currentUserId={user.id}
            className="h-full"
            isCollapsed={false}
          />
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 z-10"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>
      );
    }

    switch (activeView) {
      case "chat":
        return (
          <ChatComponent
            sessionId={sessionId}
            currentUserId={user.id}
            className="h-full"
            isCollapsed={isChatCollapsed}
            onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
          />
        );

      case "webrtc":
        return (
          <WebRTCComponent
            currentUserId={user.id}
            className="h-full"
            isCollapsed={isWebRTCCollapsed}
            onToggleCollapse={() => setIsWebRTCCollapsed(!isWebRTCCollapsed)}
          />
        );

      case "both":
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 border-b border-gray-200">
              <ChatComponent
                sessionId={sessionId}
                currentUserId={user.id}
                className="h-full"
                isCollapsed={isChatCollapsed}
                onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              />
            </div>
            <div className="flex-1">
              <WebRTCComponent
                currentUserId={user.id}
                className="h-full"
                isCollapsed={isWebRTCCollapsed}
                onToggleCollapse={() =>
                  setIsWebRTCCollapsed(!isWebRTCCollapsed)
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white border-l border-gray-200 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Communication</h2>
          <div className="flex items-center space-x-1">
            {activeView === "webrtc" && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Fullscreen Video"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Collapse Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1">
          {renderTabButton(
            "chat",
            <MessageSquare className="h-4 w-4" />,
            "Chat"
          )}
          {renderTabButton("webrtc", <Video className="h-4 w-4" />, "Video")}
          {renderTabButton(
            "both",
            <div className="flex space-x-1">
              <MessageSquare className="h-3 w-3" />
              <Video className="h-3 w-3" />
            </div>,
            "Both"
          )}
        </div>

        {/* Session Info */}
        {projectId && (
          <div className="mt-2 text-xs text-gray-500">
            Project Session: {projectId}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default CommunicationPanel;
