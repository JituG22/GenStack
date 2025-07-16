import { AuthResponse, User, LoginRequest, RegisterRequest } from '../types';

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || 'An error occurred',
      response.status,
      errorData
    );
  }

  return response.json();
}

// Auth API
export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getProfile(): Promise<User> {
    return fetchApi<User>('/auth/profile');
  },

  async refreshToken(): Promise<{ token: string }> {
    return fetchApi<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
  },
};

// Nodes API
export const nodesApi = {
  async getNodes() {
    return fetchApi('/nodes');
  },

  async createNode(nodeData: any) {
    return fetchApi('/nodes', {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  },

  async updateNode(id: string, nodeData: any) {
    return fetchApi(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(nodeData),
    });
  },

  async deleteNode(id: string) {
    return fetchApi(`/nodes/${id}`, {
      method: 'DELETE',
    });
  },
};

// Templates API
export const templatesApi = {
  async getTemplates() {
    return fetchApi('/templates');
  },

  async createTemplate(templateData: any) {
    return fetchApi('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },

  async updateTemplate(id: string, templateData: any) {
    return fetchApi(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },

  async deleteTemplate(id: string) {
    return fetchApi(`/templates/${id}`, {
      method: 'DELETE',
    });
  },
};

// Projects API
export const projectsApi = {
  async getProjects() {
    return fetchApi('/projects');
  },

  async createProject(projectData: any) {
    return fetchApi('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(id: string, projectData: any) {
    return fetchApi(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  async deleteProject(id: string) {
    return fetchApi(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

export { ApiError };
