import { templatesApi } from "../lib/api";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  isOfficial: boolean;
  version: string;
  downloads: number;
  rating: {
    average: number;
    count: number;
  };
  organization: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  nodes: string[];
  configuration: any;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCreateRequest {
  name: string;
  description: string;
  category: string;
  tags?: string[];
  isPublic?: boolean;
  configuration?: any;
  nodes?: string[];
}

export interface TemplateUpdateRequest extends Partial<TemplateCreateRequest> {
  id: string;
}

export interface TemplatesQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isPublic?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class TemplatesService {
  async getTemplates(query: TemplatesQuery = {}) {
    try {
      const response = await templatesApi.getTemplates(query);
      return response;
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  }

  async getTemplate(id: string) {
    try {
      const response = await templatesApi.getTemplate(id);
      return response;
    } catch (error) {
      console.error("Error fetching template:", error);
      throw error;
    }
  }

  async createTemplate(templateData: TemplateCreateRequest) {
    try {
      const response = await templatesApi.createTemplate(templateData);
      return response;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }

  async updateTemplate(
    id: string,
    templateData: Partial<TemplateCreateRequest>
  ) {
    try {
      const response = await templatesApi.updateTemplate(id, templateData);
      return response;
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  }

  async deleteTemplate(id: string) {
    try {
      const response = await templatesApi.deleteTemplate(id);
      return response;
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  }

  // Utility methods
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      component: "🧩",
      workflow: "⚡",
      integration: "🔗",
      custom: "🛠️",
      frontend: "🎨",
      backend: "⚙️",
      database: "🗄️",
      devops: "🚀",
    };
    return iconMap[category.toLowerCase()] || "📦";
  }

  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      component: "#3B82F6",
      workflow: "#10B981",
      integration: "#F59E0B",
      custom: "#6366F1",
      frontend: "#EC4899",
      backend: "#8B5CF6",
      database: "#06B6D4",
      devops: "#EF4444",
    };
    return colorMap[category.toLowerCase()] || "#6B7280";
  }

  formatTemplate(template: any): Template {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags || [],
      isPublic: template.isPublic || false,
      isOfficial: template.isOfficial || false,
      version: template.version || "1.0.0",
      downloads: template.downloads || 0,
      rating: template.rating || { average: 0, count: 0 },
      organization: template.organization,
      createdBy: template.createdBy,
      nodes: template.nodes || [],
      configuration: template.configuration || {},
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}

export const templatesService = new TemplatesService();
