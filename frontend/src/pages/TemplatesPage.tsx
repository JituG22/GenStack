import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { templatesService, Template } from "../services/templatesService";
import {
  Search,
  Plus,
  Eye,
  Download,
  Star,
  Clock,
  User,
  Grid,
  List,
  RefreshCw,
  X,
  Save,
} from "lucide-react";

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Create template modal state
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "component",
    tags: [] as string[],
    isPublic: false,
    configuration: {},
  });
  const [newTag, setNewTag] = useState("");
  const [configText, setConfigText] = useState("");

  const categories = [
    { value: "all", label: "All Templates", icon: "📦" },
    { value: "component", label: "Components", icon: "🧩" },
    { value: "workflow", label: "Workflows", icon: "⚡" },
    { value: "integration", label: "Integrations", icon: "🔗" },
    { value: "custom", label: "Custom", icon: "🛠️" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Updated Date" },
    { value: "name", label: "Name" },
    { value: "downloads", label: "Downloads" },
    { value: "rating.average", label: "Rating" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [sortBy, sortOrder, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const query: any = {
        page: 1,
        limit: 50,
        sortBy,
        sortOrder,
      };

      if (selectedCategory !== "all") {
        query.category = selectedCategory;
      }

      if (searchTerm.trim()) {
        query.search = searchTerm;
      }

      const response = await templatesService.getTemplates(query);

      if (response.success) {
        const formattedTemplates = response.data.map((template: any) =>
          templatesService.formatTemplate(template)
        );
        setTemplates(formattedTemplates);
      } else {
        setError(response.message || "Failed to load templates");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTemplates();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Create template functions
  const handleCreateTemplate = () => {
    setIsCreating(true);
  };

  const handleSaveTemplate = async () => {
    try {
      let configuration = {};
      if (configText.trim()) {
        try {
          configuration = JSON.parse(configText);
        } catch (e) {
          setError("Invalid JSON in configuration field");
          return;
        }
      }

      const templateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        isPublic: formData.isPublic,
        configuration,
      };

      const response = await templatesService.createTemplate(templateData);
      
      if (response.success) {
        // Refresh templates list
        await fetchTemplates();
        // Reset form and close modal
        handleCloseCreateModal();
        setError(null);
      } else {
        setError(response.message || "Failed to create template");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create template");
      console.error("Template creation error:", err);
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreating(false);
    setFormData({
      name: "",
      description: "",
      category: "component",
      tags: [],
      isPublic: false,
      configuration: {},
    });
    setConfigText("");
    setNewTag("");
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchTerm === "" ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{
                backgroundColor: templatesService.getCategoryColor(
                  template.category
                ),
              }}
            >
              {templatesService.getCategoryIcon(template.category)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500">{template.category}</p>
            </div>
          </div>
          {template.isPublic && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Public
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Download size={14} />
            <span>{template.downloads}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star size={14} />
            <span>{template.rating.average.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{formatDate(template.createdAt)}</span>
          </div>
        </div>

        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{template.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <User size={14} />
            <span>{template.createdBy?.firstName || "Unknown"}</span>
          </div>
          <Link
            to={`/templates/${template.id}`}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
          >
            <Eye size={14} />
            <span>View</span>
          </Link>
        </div>
      </div>
    </div>
  );

  const TemplateListItem: React.FC<{ template: Template }> = ({ template }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
            style={{
              backgroundColor: templatesService.getCategoryColor(
                template.category
              ),
            }}
          >
            {templatesService.getCategoryIcon(template.category)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-500">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <span>{template.category}</span>
          <span>{template.downloads} downloads</span>
          <span>{formatDate(template.createdAt)}</span>
          <Link
            to={`/templates/${template.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
                <p className="text-gray-600 mt-1">
                  Discover and use pre-built templates for your projects
                </p>
              </div>
              <button 
                onClick={handleCreateTemplate}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Create Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={`Sort ${
                  sortOrder === "asc" ? "Descending" : "Ascending"
                }`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchTemplates}
                disabled={loading}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchTemplates}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-gray-400" size={32} />
            <span className="ml-2 text-gray-500">Loading templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "No templates available yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredTemplates.length} template
                {filteredTemplates.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <TemplateListItem key={template.id} template={template} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Template Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Template</h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveTemplate();
              }}
              className="space-y-6"
            >
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="component">Component</option>
                    <option value="workflow">Workflow</option>
                    <option value="integration">Integration</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this template does..."
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!formData.isPublic}
                      onChange={() =>
                        setFormData({ ...formData, isPublic: false })
                      }
                      className="mr-2"
                    />
                    Private
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      checked={formData.isPublic}
                      onChange={() =>
                        setFormData({ ...formData, isPublic: true })
                      }
                      className="mr-2"
                    />
                    Public
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Configuration (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration (JSON)
                </label>
                <textarea
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder='{"inputs": [], "outputs": [], "settings": {}}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Define template configuration in JSON format
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || !formData.description}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
