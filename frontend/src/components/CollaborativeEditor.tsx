import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Participant {
  userId: string;
  username: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  joinedAt: Date;
}

interface Operation {
  id: string;
  type: "insert" | "delete" | "replace";
  position: {
    line: number;
    column: number;
  };
  content: string;
  userId: string;
  timestamp: Date;
}

interface CollaborativeEditorProps {
  projectId: string;
  fileName: string;
  initialContent?: string;
  language?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  projectId,
  fileName,
  initialContent = "",
  language = "typescript",
  onSave,
  readOnly = false,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [content, setContent] = useState<string>(initialContent);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(0);
  const [isLocalChange, setIsLocalChange] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);
  const pendingOperations = useRef<Operation[]>([]);
  const decorationsRef = useRef<string[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setConnectionError("Authentication token not found");
      return;
    }

    const newSocket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    // Connection handlers
    newSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log("Connected to collaboration server");

      // Join collaborative session
      newSocket.emit("join-session", {
        projectId,
        fileName,
        fileContent: initialContent,
      });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from collaboration server");
    });

    newSocket.on("connect_error", (error) => {
      setConnectionError(`Connection error: ${error.message}`);
      console.error("Socket connection error:", error);
    });

    // Collaboration event handlers
    newSocket.on("file-state", (data) => {
      setContent(data.content);
      setVersion(data.version);
      setParticipants(data.participants || []);
    });

    newSocket.on("participant-joined", (data) => {
      setParticipants((prev) => [...prev, data.participant]);
      console.log(`${data.participant.username} joined the session`);
    });

    newSocket.on("participant-left", (data) => {
      setParticipants((prev) =>
        prev.filter((p) => p.userId !== data.participantId)
      );
    });

    newSocket.on("text-operation", (data) => {
      applyRemoteOperation(data.operation, data.content);
      setVersion(data.version);
    });

    newSocket.on("cursor-change", (data) => {
      updateParticipantCursor(data);
    });

    newSocket.on("selection-change", (data) => {
      updateParticipantSelection(data);
    });

    newSocket.on("file-saved", (data) => {
      setSaveStatus("saved");
      console.log(`File saved by ${data.savedBy}`);
    });

    newSocket.on("operation-ack", (data) => {
      // Remove acknowledged operation from pending list
      pendingOperations.current = pendingOperations.current.filter(
        (op) => op.id !== data.operationId
      );
    });

    newSocket.on("error", (error) => {
      console.error("Collaboration error:", error);
      setConnectionError(error.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [projectId, fileName, initialContent]);

  // Apply remote operation to editor
  const applyRemoteOperation = useCallback(
    (_operation: Operation, newContent: string) => {
      if (editorRef.current && !isLocalChange) {
        setIsLocalChange(true);

        // Save current cursor position
        const position = editorRef.current.getPosition();

        // Update content
        setContent(newContent);

        // Restore cursor position (with adjustments if needed)
        if (position) {
          setTimeout(() => {
            editorRef.current?.setPosition(position);
            setIsLocalChange(false);
          }, 0);
        } else {
          setIsLocalChange(false);
        }
      }
    },
    [isLocalChange]
  );

  // Update participant cursor visualization
  const updateParticipantCursor = useCallback((data: any) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === data.participantId ? { ...p, cursor: data.cursor } : p
      )
    );
    updateCursorDecorations();
  }, []);

  // Update participant selection visualization
  const updateParticipantSelection = useCallback((data: any) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === data.participantId
          ? { ...p, selection: data.selection }
          : p
      )
    );
    updateSelectionDecorations();
  }, []);

  // Update cursor decorations in Monaco editor
  const updateCursorDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = participants
      .filter((p) => p.cursor && p.userId !== socket?.id)
      .map((p) => ({
        range: new monacoRef.current.Range(
          p.cursor!.line,
          p.cursor!.column,
          p.cursor!.line,
          p.cursor!.column + 1
        ),
        options: {
          className: "collaborative-cursor",
          glyphMarginClassName: "collaborative-cursor-glyph",
          stickiness: 1,
          hoverMessage: { value: `${p.username}'s cursor` },
        },
      }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations
    );
  }, [participants, socket?.id]);

  // Update selection decorations in Monaco editor
  const updateSelectionDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = participants
      .filter((p) => p.selection && p.userId !== socket?.id)
      .map((p) => ({
        range: new monacoRef.current.Range(
          p.selection!.startLine,
          p.selection!.startColumn,
          p.selection!.endLine,
          p.selection!.endColumn
        ),
        options: {
          className: "collaborative-selection",
          stickiness: 1,
          hoverMessage: { value: `${p.username}'s selection` },
        },
      }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations
    );
  }, [participants, socket?.id]);

  // Handle editor changes
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (isLocalChange || !value || !socket || readOnly) return;

      const newContent = value;
      const oldContent = content;

      if (newContent === oldContent) return;

      // Create operation for the change
      const operation: Operation = {
        id: `${Date.now()}-${Math.random()}`,
        type: "replace", // Simplified - in production you'd want to detect insert/delete
        position: { line: 1, column: 1 }, // Simplified position
        content: newContent,
        userId: socket.id || "",
        timestamp: new Date(),
      };

      // Add to pending operations
      pendingOperations.current.push(operation);

      // Send operation to server
      socket.emit("text-operation", {
        operation,
        version,
      });

      // Update local content
      setContent(newContent);
      setSaveStatus("unsaved");
    },
    [content, socket, version, isLocalChange, readOnly]
  );

  // Handle cursor position changes
  const handleCursorPositionChange = useCallback(
    (e: editor.ICursorPositionChangedEvent) => {
      if (!socket || readOnly) return;

      socket.emit("cursor-change", {
        line: e.position.lineNumber,
        column: e.position.column,
      });
    },
    [socket, readOnly]
  );

  // Handle selection changes
  const handleSelectionChange = useCallback(
    (e: editor.ICursorSelectionChangedEvent) => {
      if (!socket || readOnly) return;

      const selection = e.selection;
      if (selection.isEmpty()) return;

      socket.emit("selection-change", {
        startLine: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLine: selection.endLineNumber,
        endColumn: selection.endColumn,
      });
    },
    [socket, readOnly]
  );

  // Handle save
  const handleSave = useCallback(() => {
    if (!socket || readOnly) return;

    setSaveStatus("saving");
    socket.emit("save-file", { content });

    if (onSave) {
      onSave(content);
    }
  }, [socket, content, onSave, readOnly]);

  // Handle editor mount
  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Add event listeners
      editor.onDidChangeCursorPosition(handleCursorPositionChange);
      editor.onDidChangeCursorSelection(handleSelectionChange);

      // Add save shortcut
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        handleSave
      );

      // Add custom CSS for collaborative features
      const style = document.createElement("style");
      style.innerHTML = `
      .collaborative-cursor {
        border-left: 2px solid #ff6b6b;
        background-color: rgba(255, 107, 107, 0.2);
      }
      .collaborative-selection {
        background-color: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
      }
      .collaborative-cursor-glyph {
        background-color: #ff6b6b;
        width: 3px !important;
      }
    `;
      document.head.appendChild(style);
    },
    [handleCursorPositionChange, handleSelectionChange, handleSave]
  );

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2 text-sm">
      {isConnected ? (
        <>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className="text-green-700">Connected</span>
        </>
      ) : connectionError ? (
        <>
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
          <span className="text-red-700">Error: {connectionError}</span>
        </>
      ) : (
        <>
          <CloudArrowDownIcon className="h-4 w-4 text-yellow-500 animate-spin" />
          <span className="text-yellow-700">Connecting...</span>
        </>
      )}
    </div>
  );

  // Save status indicator
  const SaveStatus = () => (
    <div className="flex items-center space-x-2 text-sm">
      {saveStatus === "saving" ? (
        <>
          <CloudArrowUpIcon className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="text-blue-700">Saving...</span>
        </>
      ) : saveStatus === "saved" ? (
        <>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className="text-green-700">Saved</span>
        </>
      ) : (
        <>
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-700">Unsaved changes</span>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with collaboration info */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium text-gray-900">{fileName}</h3>
          <ConnectionStatus />
          <SaveStatus />
        </div>

        {/* Participants */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {participants.length} participant
            {participants.length !== 1 ? "s" : ""}
          </span>
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map((participant) => (
              <div
                key={participant.userId}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: participant.color }}
                title={participant.username}
              >
                {participant.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {participants.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-medium text-white">
                +{participants.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          value={content}
          language={language}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            readOnly: readOnly,
            scrollBeyondLastLine: false,
            contextmenu: true,
            selectOnLineNumbers: true,
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: "line",
            theme: "vs",
          }}
        />
      </div>

      {/* Footer with save button */}
      {!readOnly && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            Press Ctrl+S (Cmd+S) to save
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;
