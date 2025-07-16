import React, { useState } from "react";
import { NodeTemplateManager } from "../components/NodeTemplateManager";
import { NodePropertyEditor } from "../components/NodePropertyEditor";
import { ProjectVersionControl } from "../components/ProjectVersionControl";

interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  properties: Record<string, any>;
  defaultProperties: Record<string, any>;
  validations: any[];
  icon?: string;
  color?: string;
  isCustom: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface PropertyValue {
  type:
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object"
    | "select"
    | "color"
    | "file";
  value: any;
  label: string;
  description?: string;
  required?: boolean;
  options?: string[];
}

export const EnhancedTemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "templates" | "properties" | "versions"
  >("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<NodeTemplate | null>(
    null
  );
  const [selectedNodeId] = useState("demo-node-123");

  // Sample property schema for demonstration
  const sampleProperties: Record<string, PropertyValue> = {
    name: {
      type: "string",
      value: "Sample Component",
      label: "Component Name",
      description: "The display name for this component",
      required: true,
    },
    port: {
      type: "number",
      value: 3000,
      label: "Port Number",
      description: "The port number for the service",
    },
    enabled: {
      type: "boolean",
      value: true,
      label: "Enabled",
      description: "Whether this component is enabled",
    },
    environment: {
      type: "select",
      value: "development",
      label: "Environment",
      description: "The deployment environment",
      options: ["development", "staging", "production"],
    },
    primaryColor: {
      type: "color",
      value: "#3B82F6",
      label: "Primary Color",
      description: "The primary color for UI elements",
    },
    tags: {
      type: "array",
      value: ["react", "frontend", "web"],
      label: "Tags",
      description: "Tags for categorization",
    },
    configuration: {
      type: "object",
      value: {
        timeout: "30s",
        retries: "3",
        debug: "false",
      },
      label: "Configuration",
      description: "Key-value configuration pairs",
    },
  };

  const handleTemplateSelect = (template: NodeTemplate) => {
    setSelectedTemplate(template);
    console.log("Selected template:", template);
  };

  const handleTemplateCreate = (template: NodeTemplate) => {
    console.log("Created template:", template);
  };

  const handlePropertiesChange = (
    properties: Record<string, PropertyValue>
  ) => {
    console.log("Properties changed:", properties);
  };

  const handleVersionSelect = (version: any) => {
    console.log("Selected version:", version);
  };

  const handleVersionCreate = (name: string, description: string) => {
    console.log("Created version:", { name, description });
  };

  const handleVersionCompare = (version1: string, version2: string) => {
    console.log("Comparing versions:", version1, "vs", version2);
  };

  const tabs = [
    { id: "templates", label: "Node Templates", icon: "📦" },
    { id: "properties", label: "Property Editor", icon: "⚙️" },
    { id: "versions", label: "Version Control", icon: "📚" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Enhanced Project Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Advanced tools for template management, property editing, and
                  version control
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">Project:</span>{" "}
                  Demo Project
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">
                    Last modified:
                  </span>{" "}
                  2 hours ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "templates" && (
          <div className="py-6">
            <div className="mb-6 px-4 sm:px-6 lg:px-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-500 text-xl">💡</div>
                  <div>
                    <h3 className="text-blue-900 font-medium mb-1">
                      Template Management
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Browse built-in templates or create custom ones for your
                      project. Templates define reusable node configurations
                      with properties and validations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <NodeTemplateManager
              onTemplateSelect={handleTemplateSelect}
              onTemplateCreate={handleTemplateCreate}
            />

            {selectedTemplate && (
              <div className="mt-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Selected Template: {selectedTemplate.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {selectedTemplate.type}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span>{" "}
                          {selectedTemplate.category}
                        </div>
                        <div>
                          <span className="font-medium">Created by:</span>{" "}
                          {selectedTemplate.createdBy}
                        </div>
                        <div>
                          <span className="font-medium">Usage:</span>{" "}
                          {selectedTemplate.usageCount} times
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Description
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "properties" && (
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-green-500 text-xl">⚙️</div>
                  <div>
                    <h3 className="text-green-900 font-medium mb-1">
                      Property Editor
                    </h3>
                    <p className="text-green-700 text-sm">
                      Configure node properties with advanced validation and
                      type-specific inputs. Changes are validated in real-time
                      and can be saved to update the node configuration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <NodePropertyEditor
              nodeId={selectedNodeId}
              nodeName="Demo Node"
              nodeType="React Component"
              properties={sampleProperties}
              onPropertiesChange={handlePropertiesChange}
              onSave={() => console.log("Properties saved")}
              onCancel={() => console.log("Edit cancelled")}
            />
          </div>
        )}

        {activeTab === "versions" && (
          <div className="py-6">
            <div className="mb-6 px-4 sm:px-6 lg:px-8">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-purple-500 text-xl">📚</div>
                  <div>
                    <h3 className="text-purple-900 font-medium mb-1">
                      Version Control
                    </h3>
                    <p className="text-purple-700 text-sm">
                      Track project changes over time with version snapshots.
                      Compare different versions, create new releases, and
                      manage project history.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ProjectVersionControl
              projectId="demo-project-123"
              onVersionSelect={handleVersionSelect}
              onVersionCreate={handleVersionCreate}
              onVersionCompare={handleVersionCompare}
            />
          </div>
        )}
      </div>

      {/* Feature Overview */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Available Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📦</span>
                <h3 className="font-medium text-gray-900">Template System</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Built-in templates for common components</li>
                <li>• Custom template creation and editing</li>
                <li>• Template categorization and search</li>
                <li>• Usage tracking and analytics</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚙️</span>
                <h3 className="font-medium text-gray-900">Property Editor</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Type-specific property inputs</li>
                <li>• Real-time validation and error handling</li>
                <li>• Array and object property support</li>
                <li>• Color picker and file upload inputs</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📚</span>
                <h3 className="font-medium text-gray-900">Version Control</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Project version snapshots</li>
                <li>• Change tracking and history</li>
                <li>• Version comparison and diff views</li>
                <li>• Release management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
