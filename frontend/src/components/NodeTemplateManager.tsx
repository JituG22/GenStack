import React, { useState, useEffect } from "react";

interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  properties: Record<string, any>;
  defaultProperties: Record<string, any>;
  validations: ValidationRule[];
  icon?: string;
  color?: string;
  isCustom: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface ValidationRule {
  field: string;
  type:
    | "required"
    | "string"
    | "number"
    | "boolean"
    | "email"
    | "url"
    | "regex";
  message: string;
  pattern?: string;
  min?: number;
  max?: number;
}

interface NodeTemplateManagerProps {
  onTemplateSelect?: (template: NodeTemplate) => void;
  onTemplateCreate?: (template: NodeTemplate) => void;
  onTemplateEdit?: (template: NodeTemplate) => void;
  selectedCategory?: string;
}

export const NodeTemplateManager: React.FC<NodeTemplateManagerProps> = ({
  onTemplateSelect,
  onTemplateCreate,
  selectedCategory = "all",
}) => {
  const [templates, setTemplates] = useState<NodeTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NodeTemplate | null>(
    null
  );

  // Built-in templates
  const builtInTemplates: NodeTemplate[] = [
    {
      id: "react-component",
      name: "React Component",
      description: "A reusable React component with props and state management",
      type: "react",
      category: "Frontend",
      properties: {
        componentName: "",
        hasState: false,
        hasProps: true,
        styling: "css",
        testingEnabled: true,
      },
      defaultProperties: {
        componentName: "MyComponent",
        hasState: false,
        hasProps: true,
        styling: "css",
        testingEnabled: true,
      },
      validations: [
        {
          field: "componentName",
          type: "required",
          message: "Component name is required",
        },
        {
          field: "componentName",
          type: "regex",
          pattern: "^[A-Z][a-zA-Z0-9]*$",
          message: "Component name must start with uppercase letter",
        },
      ],
      icon: "⚛️",
      color: "#61DAFB",
      isCustom: false,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    {
      id: "nodejs-api",
      name: "Node.js API Endpoint",
      description: "RESTful API endpoint with Express.js",
      type: "nodejs-api",
      category: "Backend",
      properties: {
        endpointPath: "",
        method: "GET",
        authentication: false,
        rateLimit: 100,
        documentation: "",
      },
      defaultProperties: {
        endpointPath: "/api/endpoint",
        method: "GET",
        authentication: false,
        rateLimit: 100,
        documentation: "API endpoint description",
      },
      validations: [
        {
          field: "endpointPath",
          type: "required",
          message: "Endpoint path is required",
        },
        {
          field: "endpointPath",
          type: "regex",
          pattern: "^/.*",
          message: "Endpoint path must start with /",
        },
      ],
      icon: "🟢",
      color: "#68A063",
      isCustom: false,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    {
      id: "mongodb-model",
      name: "MongoDB Model",
      description: "MongoDB schema and model definition",
      type: "mongodb",
      category: "Database",
      properties: {
        modelName: "",
        collectionName: "",
        schema: {},
        indexes: [],
        middlewares: [],
      },
      defaultProperties: {
        modelName: "MyModel",
        collectionName: "mymodels",
        schema: {
          name: { type: "String", required: true },
          createdAt: { type: "Date", default: "Date.now" },
        },
        indexes: [],
        middlewares: [],
      },
      validations: [
        {
          field: "modelName",
          type: "required",
          message: "Model name is required",
        },
        {
          field: "collectionName",
          type: "required",
          message: "Collection name is required",
        },
      ],
      icon: "🍃",
      color: "#4DB33D",
      isCustom: false,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    {
      id: "docker-container",
      name: "Docker Container",
      description: "Containerized application deployment",
      type: "docker",
      category: "DevOps",
      properties: {
        imageName: "",
        tag: "latest",
        ports: [],
        environment: {},
        volumes: [],
        networks: [],
      },
      defaultProperties: {
        imageName: "my-app",
        tag: "latest",
        ports: ["3000:3000"],
        environment: {
          NODE_ENV: "production",
        },
        volumes: [],
        networks: [],
      },
      validations: [
        {
          field: "imageName",
          type: "required",
          message: "Image name is required",
        },
      ],
      icon: "🐳",
      color: "#2496ED",
      isCustom: false,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const allCategories = ["all", ...new Set(templates.map((t) => t.category))];
    setCategories(allCategories);
  }, [templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use built-in templates
      // In real implementation, fetch from API
      setTemplates(builtInTemplates);
    } catch (err) {
      setError("Failed to load templates");
      console.error("Template fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = (template: NodeTemplate) => {
    onTemplateSelect?.(template);
  };

  const handleCreateTemplate = () => {
    setIsCreating(true);
  };

  const handleEditTemplate = (template: NodeTemplate) => {
    setEditingTemplate(template);
  };

  const handleSaveTemplate = async (templateData: Partial<NodeTemplate>) => {
    try {
      // In real implementation, save to API
      const newTemplate: NodeTemplate = {
        id: `custom-${Date.now()}`,
        name: templateData.name || "New Template",
        description: templateData.description || "",
        type: templateData.type || "custom",
        category: templateData.category || "Custom",
        properties: templateData.properties || {},
        defaultProperties: templateData.defaultProperties || {},
        validations: templateData.validations || [],
        icon: templateData.icon,
        color: templateData.color,
        isCustom: true,
        createdBy: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      };

      setTemplates((prev) => [...prev, newTemplate]);
      onTemplateCreate?.(newTemplate);
      setIsCreating(false);
      setEditingTemplate(null);
    } catch (err) {
      setError("Failed to save template");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">
            Error loading templates
          </div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
          <button
            onClick={fetchTemplates}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Node Templates</h1>
          <p className="text-gray-600">
            Choose from pre-built templates or create your own
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category === "all" ? "All Categories" : category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleTemplateClick(template)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: template.color + "20" }}
                >
                  {template.icon || "📦"}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {template.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {template.category}
                  </span>
                </div>
              </div>

              {template.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTemplate(template);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                >
                  ✏️
                </button>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {template.description}
            </p>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {template.usageCount} uses
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  template.isCustom
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {template.isCustom ? "Custom" : "Built-in"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || activeCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first template to get started"}
          </p>
          {!searchTerm && activeCategory === "all" && (
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Template Creation/Edit Modal would go here */}
      {(isCreating || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isCreating ? "Create New Template" : "Edit Template"}
            </h2>
            {/* Template form would go here */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveTemplate({})}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
