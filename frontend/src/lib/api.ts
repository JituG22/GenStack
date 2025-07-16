import { AuthResponse, User, LoginRequest, RegisterRequest } from "../types";

const API_BASE_URL = "/api";

// Enhanced API response types
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sort?: {
    sortBy: string;
    sortOrder: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ValidationError {
  success: false;
  message: string;
  errors: Array<{
    type: string;
    value: any;
    msg: string;
    path: string;
    location: string;
  }>;
}

// Query parameters for list endpoints
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any; // For entity-specific filters
}

class ApiError extends Error {
  constructor(message: string, public status: number, public response?: any) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function to build query string
function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || "An error occurred",
      response.status,
      errorData
    );
  }

  return response.json();
}

// Auth API
export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async getProfile(): Promise<User> {
    return fetchApi<User>("/auth/profile");
  },

  async refreshToken(): Promise<{ token: string }> {
    return fetchApi<{ token: string }>("/auth/refresh", {
      method: "POST",
    });
  },
};

// Enhanced Nodes API
export const nodesApi = {
  async getNodes(params: QueryParams = {}): Promise<PaginatedResponse<any>> {
    const queryString = buildQueryString(params);
    return fetchApi<PaginatedResponse<any>>(`/nodes${queryString}`);
  },

  async getNode(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/nodes/${id}`);
  },

  async createNode(nodeData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/nodes", {
      method: "POST",
      body: JSON.stringify(nodeData),
    });
  },

  async updateNode(id: string, nodeData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/nodes/${id}`, {
      method: "PUT",
      body: JSON.stringify(nodeData),
    });
  },

  async deleteNode(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/nodes/${id}`, {
      method: "DELETE",
    });
  },
};

// Enhanced Templates API
export const templatesApi = {
  async getTemplates(params: QueryParams = {}): Promise<PaginatedResponse<any>> {
    const queryString = buildQueryString(params);
    return fetchApi<PaginatedResponse<any>>(`/templates${queryString}`);
  },

  async getTemplate(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/templates/${id}`);
  },

  async createTemplate(templateData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/templates", {
      method: "POST",
      body: JSON.stringify(templateData),
    });
  },

  async updateTemplate(id: string, templateData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(templateData),
    });
  },

  async deleteTemplate(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/templates/${id}`, {
      method: "DELETE",
    });
  },
};

// Enhanced Projects API
export const projectsApi = {
  async getProjects(params: QueryParams = {}): Promise<PaginatedResponse<any>> {
    const queryString = buildQueryString(params);
    return fetchApi<PaginatedResponse<any>>(`/projects${queryString}`);
  },

  async getProject(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects/${id}`);
  },

  async createProject(projectData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(id: string, projectData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    });
  },

  async deleteProject(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects/${id}`, {
      method: "DELETE",
    });
  },

  async bulkDeleteProjects(ids: string[]): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/projects/bulk", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },
};

export { ApiError };
