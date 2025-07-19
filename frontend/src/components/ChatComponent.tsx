import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChatMessage,
  ChatThread,
  TypingIndicator,
  UserPresence,
  communicationService,
} from "../services/communicationService";
import {
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  MessageSquare,
  Code,
  Users,
  Hash,
} from "lucide-react";

interface ChatComponentProps {
  sessionId: string;
  currentUserId: string;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  sessionId,
  currentUserId,
  className = "",
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [messageType, setMessageType] = useState<"text" | "code">("text");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize chat connection
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        await communicationService.connectToChat(token);
        await communicationService.joinChatSession(sessionId);

        // Load initial messages and threads
        const [messagesData, threadsData] = await Promise.all([
          communicationService.getChatMessages(sessionId, 50),
          communicationService.getChatThreads(sessionId),
        ]);

        setMessages(messagesData);
        setThreads(threadsData);
        setIsConnected(true);

        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Failed to initialize chat:", err);
        setError(
          err instanceof Error ? err.message : "Failed to connect to chat"
        );
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (sessionId) {
        communicationService.leaveChatSession(sessionId);
      }
    };
  }, [sessionId, scrollToBottom]);

  // Set up event listeners
  useEffect(() => {
    const handleMessageReceived = (message: ChatMessage) => {
      if (message.sessionId === sessionId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleMessageUpdated = (message: ChatMessage) => {
      if (message.sessionId === sessionId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === message.id ? message : msg))
        );
      }
    };

    const handleMessageDeleted = (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };

    const handleUserTyping = (indicator: TypingIndicator) => {
      if (
        indicator.sessionId === sessionId &&
        indicator.userId !== currentUserId
      ) {
        setTypingUsers((prev) => {
          const existing = prev.find((t) => t.userId === indicator.userId);
          if (existing) return prev;
          return [...prev, indicator];
        });
      }
    };

    const handleUserStoppedTyping = (indicator: TypingIndicator) => {
      if (indicator.sessionId === sessionId) {
        setTypingUsers((prev) =>
          prev.filter((t) => t.userId !== indicator.userId)
        );
      }
    };

    const handleUserJoined = (presence: UserPresence) => {
      if (presence.currentSession === sessionId) {
        setOnlineUsers((prev) => {
          const existing = prev.find((u) => u.userId === presence.userId);
          if (existing) {
            return prev.map((u) =>
              u.userId === presence.userId ? presence : u
            );
          }
          return [...prev, presence];
        });
      }
    };

    const handleUserLeft = (userId: string) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    const handlePresenceUpdated = (presence: UserPresence) => {
      setOnlineUsers((prev) =>
        prev.map((u) => (u.userId === presence.userId ? presence : u))
      );
    };

    const handleThreadCreated = (thread: ChatThread) => {
      if (thread.sessionId === sessionId) {
        setThreads((prev) => [...prev, thread]);
      }
    };

    const handleThreadUpdated = (thread: ChatThread) => {
      if (thread.sessionId === sessionId) {
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? thread : t))
        );
      }
    };

    // Register event listeners
    communicationService.on("message_received", handleMessageReceived);
    communicationService.on("message_updated", handleMessageUpdated);
    communicationService.on("message_deleted", handleMessageDeleted);
    communicationService.on("user_typing", handleUserTyping);
    communicationService.on("user_stopped_typing", handleUserStoppedTyping);
    communicationService.on("user_joined", handleUserJoined);
    communicationService.on("user_left", handleUserLeft);
    communicationService.on("presence_updated", handlePresenceUpdated);
    communicationService.on("thread_created", handleThreadCreated);
    communicationService.on("thread_updated", handleThreadUpdated);

    return () => {
      // Cleanup event listeners
      communicationService.off("message_received", handleMessageReceived);
      communicationService.off("message_updated", handleMessageUpdated);
      communicationService.off("message_deleted", handleMessageDeleted);
      communicationService.off("user_typing", handleUserTyping);
      communicationService.off("user_stopped_typing", handleUserStoppedTyping);
      communicationService.off("user_joined", handleUserJoined);
      communicationService.off("user_left", handleUserLeft);
      communicationService.off("presence_updated", handlePresenceUpdated);
      communicationService.off("thread_created", handleThreadCreated);
      communicationService.off("thread_updated", handleThreadUpdated);
    };
  }, [sessionId, currentUserId, scrollToBottom]);

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      communicationService.startTyping(sessionId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      communicationService.stopTyping(sessionId);
    }, 1000);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    try {
      await communicationService.sendMessage(
        sessionId,
        newMessage.trim(),
        messageType,
        activeThread || undefined
      );
      setNewMessage("");
      setMessageType("text");

      if (isTyping) {
        setIsTyping(false);
        communicationService.stopTyping(sessionId);
      }

      messageInputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add reaction to message
  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await communicationService.addReaction(messageId, emoji);
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Filter messages by active thread
  const filteredMessages = activeThread
    ? messages.filter((msg) => msg.threadId === activeThread)
    : messages.filter((msg) => !msg.threadId);

  if (isCollapsed) {
    return (
      <div className={`bg-white border-l border-gray-200 ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onToggleCollapse}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
            {typingUsers.length > 0 && (
              <div className="flex -space-x-1">
                {typingUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.userId}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`bg-white border-l border-gray-200 ${className} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white border-l border-gray-200 ${className} flex items-center justify-center`}
      >
        <div className="text-center p-4">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Reload
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="text-gray-500 hover:text-gray-700"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-sm font-medium text-gray-900">
              {activeThread
                ? `Thread: ${threads.find((t) => t.id === activeThread)?.title}`
                : "Team Chat"}
            </h3>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-500">
                {onlineUsers.length} online
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Users className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thread selector */}
        {threads.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => setActiveThread(null)}
              className={`px-2 py-1 text-xs rounded ${
                !activeThread
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Hash className="h-3 w-3 inline mr-1" />
              General
            </button>
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setActiveThread(thread.id)}
                className={`px-2 py-1 text-xs rounded ${
                  activeThread === thread.id
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Hash className="h-3 w-3 inline mr-1" />
                {thread.title}
                <span className="ml-1 text-xs">({thread.messageCount})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.map((message, index) => {
          const isOwn = message.userId === currentUserId;
          const showAvatar =
            index === 0 ||
            filteredMessages[index - 1].userId !== message.userId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md ${
                  isOwn ? "order-1" : "order-2"
                }`}
              >
                {showAvatar && !isOwn && (
                  <div className="text-xs text-gray-500 mb-1">
                    {message.username}
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-lg ${
                    isOwn
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.type === "code" ? (
                    <pre
                      className={`text-xs font-mono whitespace-pre-wrap ${
                        isOwn ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {message.content}
                    </pre>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}

                  {/* Reactions */}
                  {message.reactions &&
                    Object.keys(message.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(message.reactions).map(
                          ([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() =>
                                handleAddReaction(message.id, emoji)
                              }
                              className="flex items-center space-x-1 px-1.5 py-0.5 bg-white bg-opacity-20 rounded-full text-xs"
                            >
                              <span>{emoji}</span>
                              <span>{(users as string[]).length}</span>
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>
                <div
                  className={`text-xs text-gray-500 mt-1 ${
                    isOwn ? "text-right" : "text-left"
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {typingUsers.map((u) => u.username).join(", ")} typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => setMessageType("text")}
                className={`px-2 py-1 text-xs rounded ${
                  messageType === "text"
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setMessageType("code")}
                className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                  messageType === "code"
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Code className="h-3 w-3" />
                <span>Code</span>
              </button>
            </div>
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                activeThread ? `Message in thread...` : `Message the team...`
              }
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                messageType === "code" ? "font-mono text-sm" : ""
              }`}
              rows={messageType === "code" ? 4 : 2}
              disabled={!isConnected}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Smile className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
