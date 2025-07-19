import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string;
  html_url?: string;
  size?: number;
}

interface FileEditorProps {
  file: FileItem;
  content: string;
  onSave: (content: string) => void;
  syncStatus: "idle" | "syncing" | "success" | "error";
}

export const FileEditor: React.FC<FileEditorProps> = ({
  file,
  content,
  onSave,
  syncStatus,
}) => {
  const [editedContent, setEditedContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedContent(content);
    setHasChanges(false);
  }, [content]);

  useEffect(() => {
    setHasChanges(editedContent !== content);
  }, [editedContent, content]);

  const handleSave = () => {
    onSave(editedContent);
  };

  const handleRevert = () => {
    setEditedContent(content);
    setHasChanges(false);
  };

  const getLanguage = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "java":
        return "java";
      case "cpp":
      case "c":
        return "cpp";
      case "cs":
        return "csharp";
      case "go":
        return "go";
      case "rs":
        return "rust";
      case "php":
        return "php";
      case "rb":
        return "ruby";
      case "json":
        return "json";
      case "xml":
        return "xml";
      case "html":
        return "html";
      case "css":
        return "css";
      case "scss":
      case "sass":
        return "scss";
      case "md":
        return "markdown";
      case "yaml":
      case "yml":
        return "yaml";
      case "sql":
        return "sql";
      case "sh":
      case "bash":
        return "bash";
      default:
        return "plaintext";
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case "error":
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case "syncing":
        return "Saving...";
      case "success":
        return "Saved";
      case "error":
        return "Error saving";
      default:
        return "";
    }
  };

  const isTextFile = (filename: string) => {
    const textExtensions = [
      "txt",
      "md",
      "json",
      "xml",
      "yaml",
      "yml",
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "cs",
      "go",
      "rs",
      "php",
      "rb",
      "html",
      "css",
      "scss",
      "sass",
      "sql",
      "sh",
      "bash",
      "dockerfile",
      "gitignore",
    ];
    const extension = filename.split(".").pop()?.toLowerCase();
    return textExtensions.includes(extension || "");
  };

  if (!isTextFile(file.name)) {
    return (
      <div className="bg-white rounded-lg shadow border h-96 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">This file type cannot be edited</p>
          <p className="text-sm text-gray-400 mt-2">{file.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
        </div>

        <div className="flex items-center space-x-3">
          {syncStatus !== "idle" && (
            <div className="flex items-center space-x-2 text-sm">
              {getSyncStatusIcon()}
              <span
                className={
                  syncStatus === "success"
                    ? "text-green-600"
                    : syncStatus === "error"
                    ? "text-red-600"
                    : "text-blue-600"
                }
              >
                {getSyncStatusText()}
              </span>
            </div>
          )}

          {hasChanges && (
            <>
              <button
                onClick={handleRevert}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Revert
              </button>
              <button
                onClick={handleSave}
                disabled={syncStatus === "syncing"}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-0">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-full p-4 border-none resize-none focus:outline-none font-mono text-sm leading-relaxed"
          style={{ minHeight: "400px" }}
          placeholder="Edit your file content here..."
        />
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <div>Language: {getLanguage(file.name)}</div>
        <div>
          {editedContent.split("\n").length} lines • {editedContent.length}{" "}
          characters
        </div>
      </div>
    </div>
  );
};
