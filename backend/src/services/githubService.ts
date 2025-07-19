import axios, { AxiosInstance, AxiosResponse } from "axios";
import config from "../config/environment";
import {
  GitHubConfig,
  GitHubRepository,
  CreateRepositoryRequest,
  UpdateRepositoryRequest,
  GitHubApiResponse,
  GitHubError,
} from "../types/github";

export class GitHubService {
  private api: AxiosInstance;
  private config: GitHubConfig;

  constructor() {
    this.config = {
      token: config.github.token,
      username: config.github.username,
      organization: config.github.organization,
      baseUrl: "https://api.github.com",
    };

    this.api = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GenStack-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("GitHub API Error:", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new GitHub repository
   */
  async createRepository(
    projectData: CreateRepositoryRequest,
    useOrganization = false
  ): Promise<GitHubApiResponse<GitHubRepository>> {
    try {
      // Validate repository name
      if (!this.isValidRepoName(projectData.name)) {
        return {
          success: false,
          error: {
            message:
              "Invalid repository name. Must contain only letters, numbers, hyphens, periods, and underscores.",
          },
        };
      }

      // Prepare the repository data
      const repoData: CreateRepositoryRequest = {
        name: this.sanitizeRepoName(projectData.name),
        description: projectData.description || "Created by GenStack",
        private: projectData.private !== false, // Default to private
        has_issues: projectData.has_issues !== false,
        has_projects: projectData.has_projects !== false,
        has_wiki: projectData.has_wiki || false,
        auto_init: projectData.auto_init !== false, // Create with README
        gitignore_template: projectData.gitignore_template || "Node",
        license_template: projectData.license_template,
        allow_squash_merge: projectData.allow_squash_merge !== false,
        allow_merge_commit: projectData.allow_merge_commit !== false,
        allow_rebase_merge: projectData.allow_rebase_merge !== false,
      };

      // Determine the endpoint based on organization usage
      const endpoint =
        useOrganization && this.config.organization
          ? `/orgs/${this.config.organization}/repos`
          : "/user/repos";

      const response: AxiosResponse<GitHubRepository> = await this.api.post(
        endpoint,
        repoData
      );

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError(error, "Failed to create GitHub repository");
    }
  }

  /**
   * Update an existing GitHub repository
   */
  async updateRepository(
    repoName: string,
    updateData: UpdateRepositoryRequest,
    useOrganization = false
  ): Promise<GitHubApiResponse<GitHubRepository>> {
    try {
      const owner =
        useOrganization && this.config.organization
          ? this.config.organization
          : this.config.username;

      const endpoint = `/repos/${owner}/${repoName}`;

      // If renaming the repo, validate the new name
      if (updateData.name && !this.isValidRepoName(updateData.name)) {
        return {
          success: false,
          error: {
            message:
              "Invalid repository name. Must contain only letters, numbers, hyphens, periods, and underscores.",
          },
        };
      }

      // Sanitize the new name if provided
      if (updateData.name) {
        updateData.name = this.sanitizeRepoName(updateData.name);
      }

      const response: AxiosResponse<GitHubRepository> = await this.api.patch(
        endpoint,
        updateData
      );

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError(error, "Failed to update GitHub repository");
    }
  }

  /**
   * Delete a GitHub repository
   */
  async deleteRepository(
    repoName: string,
    useOrganization = false
  ): Promise<GitHubApiResponse<void>> {
    try {
      const owner =
        useOrganization && this.config.organization
          ? this.config.organization
          : this.config.username;

      const endpoint = `/repos/${owner}/${repoName}`;

      const response: AxiosResponse<void> = await this.api.delete(endpoint);

      return {
        success: true,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError(error, "Failed to delete GitHub repository");
    }
  }

  /**
   * Get repository information
   */
  async getRepository(
    repoName: string,
    useOrganization = false
  ): Promise<GitHubApiResponse<GitHubRepository>> {
    try {
      const owner =
        useOrganization && this.config.organization
          ? this.config.organization
          : this.config.username;

      const endpoint = `/repos/${owner}/${repoName}`;

      const response: AxiosResponse<GitHubRepository> = await this.api.get(
        endpoint
      );

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError(error, "Failed to get GitHub repository");
    }
  }

  /**
   * List user/organization repositories
   */
  async listRepositories(
    useOrganization = false,
    page = 1,
    perPage = 30
  ): Promise<GitHubApiResponse<GitHubRepository[]>> {
    try {
      const endpoint =
        useOrganization && this.config.organization
          ? `/orgs/${this.config.organization}/repos`
          : "/user/repos";

      const response: AxiosResponse<GitHubRepository[]> = await this.api.get(
        endpoint,
        {
          params: {
            page,
            per_page: perPage,
            sort: "updated",
            direction: "desc",
          },
        }
      );

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleApiError(error, "Failed to list GitHub repositories");
    }
  }

  /**
   * Check if repository exists
   */
  async repositoryExists(
    repoName: string,
    useOrganization = false
  ): Promise<boolean> {
    try {
      const result = await this.getRepository(repoName, useOrganization);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique repository name if the desired name already exists
   */
  async generateUniqueRepoName(
    baseName: string,
    useOrganization = false
  ): Promise<string> {
    const sanitizedName = this.sanitizeRepoName(baseName);
    let repoName = sanitizedName;
    let counter = 1;

    while (await this.repositoryExists(repoName, useOrganization)) {
      repoName = `${sanitizedName}-${counter}`;
      counter++;

      // Prevent infinite loop
      if (counter > 100) {
        repoName = `${sanitizedName}-${Date.now()}`;
        break;
      }
    }

    return repoName;
  }

  /**
   * Create initial project structure in repository
   */
  async initializeProjectStructure(
    repoName: string,
    projectType: string = "genstack",
    useOrganization = false
  ): Promise<GitHubApiResponse<any>> {
    try {
      const owner =
        useOrganization && this.config.organization
          ? this.config.organization
          : this.config.username;

      // Create basic project structure files
      const files = await this.getProjectTemplateFiles(projectType);

      const results = [];
      for (const file of files) {
        const result = await this.createFile(
          owner,
          repoName,
          file.path,
          file.content,
          file.message
        );
        results.push(result);
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return this.handleApiError(
        error,
        "Failed to initialize project structure"
      );
    }
  }

  /**
   * Create a file in the repository
   */
  private async createFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string
  ): Promise<any> {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}`;

    const response = await this.api.put(endpoint, {
      message,
      content: Buffer.from(content).toString("base64"),
    });

    return response.data;
  }

  /**
   * Get project template files based on project type
   */
  private async getProjectTemplateFiles(
    projectType: string
  ): Promise<Array<{ path: string; content: string; message: string }>> {
    const files = [];

    // README.md
    files.push({
      path: "README.md",
      content: this.generateReadmeContent(projectType),
      message: "Initial README",
    });

    // .gitignore
    files.push({
      path: ".gitignore",
      content: this.generateGitignoreContent(projectType),
      message: "Add .gitignore",
    });

    // GenStack project configuration
    files.push({
      path: "genstack.config.json",
      content: this.generateGenStackConfig(projectType),
      message: "Add GenStack configuration",
    });

    return files;
  }

  /**
   * Generate README content based on project type
   */
  private generateReadmeContent(projectType: string): string {
    return `# GenStack Project

This project was created using GenStack - a visual low-code platform for building applications.

## Project Type
${projectType}

## Getting Started

1. Clone this repository
2. Open in GenStack platform
3. Start building with drag-and-drop nodes

## About GenStack

GenStack allows you to:
- Build applications visually with drag-and-drop nodes
- Generate code automatically
- Manage templates and reusable components
- Collaborate in real-time

---
Generated by GenStack Platform
`;
  }

  /**
   * Generate .gitignore content
   */
  private generateGitignoreContent(projectType: string): string {
    return `# GenStack generated files
.genstack/
*.genstack.tmp

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;
  }

  /**
   * Generate GenStack configuration
   */
  private generateGenStackConfig(projectType: string): string {
    return JSON.stringify(
      {
        version: "1.0.0",
        projectType,
        genstack: {
          version: "1.0.0",
          created: new Date().toISOString(),
          nodes: [],
          templates: [],
          settings: {
            autoSave: true,
            realTimeSync: true,
          },
        },
      },
      null,
      2
    );
  }

  /**
   * Validate repository name according to GitHub rules
   */
  private isValidRepoName(name: string): boolean {
    // GitHub repository name rules:
    // - Can contain alphanumeric characters, hyphens, periods, and underscores
    // - Cannot start or end with special characters
    // - Cannot contain consecutive special characters
    // - Must be between 1 and 100 characters
    const regex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
    return regex.test(name) && name.length >= 1 && name.length <= 100;
  }

  /**
   * Sanitize repository name to make it GitHub-compatible
   */
  private sanitizeRepoName(name: string): string {
    // Replace spaces and special characters with hyphens
    let sanitized = name
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/[-_.]{2,}/g, "-") // Replace consecutive special chars with single hyphen
      .replace(/^[-_.]|[-_.]$/g, ""); // Remove leading/trailing special chars

    // Ensure it starts and ends with alphanumeric
    sanitized = sanitized.replace(/^[^a-zA-Z0-9]+/, "");
    sanitized = sanitized.replace(/[^a-zA-Z0-9]+$/, "");

    // Ensure minimum length
    if (sanitized.length < 1) {
      sanitized = "genstack-project";
    }

    // Ensure maximum length
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    return sanitized;
  }

  /**
   * Handle API errors consistently
   */
  private handleApiError(
    error: any,
    defaultMessage: string
  ): GitHubApiResponse {
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    let errorMessage = defaultMessage;
    let githubError: GitHubError = { message: errorMessage };

    if (errorData) {
      githubError = {
        message: errorData.message || defaultMessage,
        documentation_url: errorData.documentation_url,
        errors: errorData.errors,
      };
      errorMessage = errorData.message || defaultMessage;
    }

    // Provide user-friendly error messages for common scenarios
    switch (statusCode) {
      case 401:
        errorMessage =
          "GitHub authentication failed. Please check your access token.";
        break;
      case 403:
        errorMessage =
          "Permission denied. Check your GitHub token permissions.";
        break;
      case 404:
        errorMessage = "Repository not found or you don't have access to it.";
        break;
      case 422:
        errorMessage =
          errorData?.errors?.[0]?.message ||
          "Repository name already exists or is invalid.";
        break;
      case 429:
        errorMessage =
          "GitHub API rate limit exceeded. Please try again later.";
        break;
      default:
        errorMessage = githubError.message;
    }

    githubError.message = errorMessage;

    return {
      success: false,
      error: githubError,
      statusCode,
    };
  }

  /**
   * Test GitHub connection and permissions
   */
  async testConnection(): Promise<GitHubApiResponse<any>> {
    try {
      const response = await this.api.get("/user");
      return {
        success: true,
        data: {
          user: response.data,
          message: "GitHub connection successful",
        },
      };
    } catch (error: any) {
      return this.handleApiError(error, "Failed to connect to GitHub");
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();
