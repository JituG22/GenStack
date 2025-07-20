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

export interface GitHubHealthResponse {
  success: boolean;
  message: string;
  config: {
    enabled: boolean;
    hasToken: boolean;
    hasUsername: boolean;
    ready: boolean;
  };
  timestamp: string;
}

// Query parameters for list endpoints
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
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

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.log("API returned 401, clearing auth data");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Reload the page to trigger auth flow
      window.location.href = "/login";
    }

    throw new ApiError(
      errorData.message || "An error occurred",
      response.status,
      errorData
    );
  }

  return response.json();
}

// General API instance
export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: "DELETE" }),
};

// Auth API
export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetchApi<{ data: AuthResponse }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetchApi<{ data: AuthResponse }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await fetchApi<ApiResponse<any>>("/auth/me");
    // Transform MongoDB _id to id for frontend consistency
    const user = response.data;
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organization: user.organization,
    };
  },

  async refreshToken(): Promise<{ token: string }> {
    return fetchApi<{ token: string }>("/auth/refresh", {
      method: "POST",
    });
  },

  async logout(): Promise<void> {
    try {
      await fetchApi<{ success: boolean }>("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn(
        "Server logout failed, continuing with client cleanup:",
        error
      );
    }
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
  async getTemplates(
    params: QueryParams = {}
  ): Promise<PaginatedResponse<any>> {
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

  async updateTemplate(
    id: string,
    templateData: any
  ): Promise<ApiResponse<any>> {
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

  async filterProjects(filters: any): Promise<any> {
    return fetchApi<any>("/projects/filter", {
      method: "POST",
      body: JSON.stringify(filters),
    });
  },

  async getFilterSuggestions(
    field: string,
    query?: string
  ): Promise<ApiResponse<any>> {
    const queryString = query ? `?query=${encodeURIComponent(query)}` : "";
    return fetchApi<ApiResponse<any>>(
      `/projects/suggestions/${field}${queryString}`
    );
  },
};

// Analytics API
export const analyticsApi = {
  async getDashboard(timeRange = "7d"): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(
      `/analytics/dashboard?timeRange=${timeRange}`
    );
  },

  async getFilters(timeRange = "7d"): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(
      `/analytics/filters?timeRange=${timeRange}`
    );
  },

  async getPerformance(timeRange = "7d"): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(
      `/analytics/performance?timeRange=${timeRange}`
    );
  },

  async getBehavior(timeRange = "7d"): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(
      `/analytics/behavior?timeRange=${timeRange}`
    );
  },

  async trackEvent(eventData: {
    eventType: string;
    eventCategory: string;
    eventAction: string;
    eventLabel?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/analytics/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  },

  async trackFilterUsage(filterData: {
    filterType: string;
    filterValues: any;
    appliedFilters: any;
    resultsCount: number;
    queryTime: number;
    queryComplexity?: number;
  }): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/analytics/filter-usage", {
      method: "POST",
      body: JSON.stringify(filterData),
    });
  },
};

// GitHub-enabled Projects API
export const githubProjectsApi = {
  async getHealth(): Promise<GitHubHealthResponse> {
    return fetchApi<GitHubHealthResponse>("/projects-github/health");
  },

  async createProjectWithGitHub(projectData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/projects-github", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  },

  async updateProjectWithGitHub(
    id: string,
    projectData: any
  ): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects-github/${id}`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    });
  },

  async deleteProjectWithGitHub(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects-github/${id}`, {
      method: "DELETE",
    });
  },

  async syncProjectWithGitHub(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects-github/${id}/sync`, {
      method: "POST",
    });
  },

  async getProjectGitHubStatus(id: string): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects-github/${id}/github-status`);
  },
};

// Enhanced GitHub Projects API
export const enhancedGitHubProjectsApi = {
  async getHealthWithAccounts(): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/projects-github/health");
  },

  async getAvailableAccounts(): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/github-accounts");
  },

  async updateProjectGitHub(
    projectId: string,
    githubConfig: {
      accountId: string;
      repositoryName: string;
      autoSync: boolean;
      isPrivate: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>(`/projects-github/${projectId}/github`, {
      method: "PUT",
      body: JSON.stringify(githubConfig),
    });
  },

  async createProjectWithGitHub(projectData: any): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>("/projects-github", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  },
};

export { ApiError };
