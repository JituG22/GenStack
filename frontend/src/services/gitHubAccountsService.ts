import {
  GitHubAccount,
  GitHubAccountValidation,
  CreateGitHubAccountRequest,
  UpdateGitHubAccountRequest,
  GitHubAccountStatistics,
} from "../types";
import { ApiResponse } from "../lib/api";

const API_BASE_URL = "/api";

// Helper function to make authenticated API calls
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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    throw new Error(errorData.message || "An error occurred");
  }

  return response.json();
}

class GitHubAccountsService {
  private baseUrl = "/github-accounts";

  /**
   * Get all GitHub accounts for the current user
   */
  async getAccounts(): Promise<GitHubAccount[]> {
    const response = await fetchApi<ApiResponse<GitHubAccount[]>>(this.baseUrl);
    return response.data || [];
  }

  /**
   * Get the default GitHub account
   */
  async getDefaultAccount(): Promise<GitHubAccount | null> {
    try {
      const response = await fetchApi<ApiResponse<GitHubAccount>>(
        `${this.baseUrl}/default`
      );
      return response.data || null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get a specific GitHub account
   */
  async getAccount(id: string): Promise<GitHubAccount> {
    const response = await fetchApi<ApiResponse<GitHubAccount>>(
      `${this.baseUrl}/${id}`
    );
    return response.data!;
  }

  /**
   * Validate a GitHub token
   */
  async validateToken(token: string): Promise<GitHubAccountValidation> {
    const response = await fetchApi<ApiResponse<GitHubAccountValidation>>(
      `${this.baseUrl}/validate-token`,
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );
    return response.data!;
  }

  /**
   * Create a new GitHub account
   */
  async createAccount(
    data: CreateGitHubAccountRequest
  ): Promise<GitHubAccount> {
    const response = await fetchApi<ApiResponse<GitHubAccount>>(this.baseUrl, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  /**
   * Update a GitHub account
   */
  async updateAccount(
    id: string,
    data: UpdateGitHubAccountRequest
  ): Promise<GitHubAccount> {
    const response = await fetchApi<ApiResponse<GitHubAccount>>(
      `${this.baseUrl}/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  /**
   * Set an account as default
   */
  async setDefaultAccount(id: string): Promise<GitHubAccount> {
    const response = await fetchApi<ApiResponse<GitHubAccount>>(
      `${this.baseUrl}/${id}/set-default`,
      {
        method: "POST",
      }
    );
    return response.data!;
  }

  /**
   * Delete a GitHub account
   */
  async deleteAccount(id: string): Promise<void> {
    await fetchApi<ApiResponse<{ id: string }>>(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Validate all user accounts
   */
  async validateAllAccounts(): Promise<void> {
    await fetchApi<ApiResponse<{}>>(`${this.baseUrl}/validate-all`, {
      method: "POST",
    });
  }

  /**
   * Get usage statistics
   */
  async getStatistics(): Promise<GitHubAccountStatistics> {
    const response = await fetchApi<ApiResponse<GitHubAccountStatistics>>(
      `${this.baseUrl}/statistics`
    );
    return response.data!;
  }

  /**
   * Helper method to get token scopes description
   */
  getScopesDescription(scopes: string[]): string[] {
    const descriptions: string[] = [];

    if (scopes.includes("repo")) {
      descriptions.push("Full repository access");
    } else {
      if (scopes.includes("public_repo")) {
        descriptions.push("Public repository access");
      }
      if (scopes.includes("read:repo")) {
        descriptions.push("Read repository access");
      }
      if (scopes.includes("write:repo")) {
        descriptions.push("Write repository access");
      }
    }

    if (scopes.includes("delete_repo")) {
      descriptions.push("Delete repositories");
    }
    if (scopes.includes("admin:repo_hook")) {
      descriptions.push("Repository webhooks");
    }
    if (scopes.includes("user:email")) {
      descriptions.push("User email access");
    }
    if (scopes.includes("read:user")) {
      descriptions.push("User profile access");
    }

    return descriptions.length > 0 ? descriptions : ["Limited access"];
  }

  /**
   * Helper method to check if account has sufficient permissions
   */
  hasRequiredPermissions(account: GitHubAccount): {
    canCreateRepo: boolean;
    canDeleteRepo: boolean;
    missingPermissions: string[];
  } {
    const missingPermissions: string[] = [];

    if (!account.permissions.createRepo) {
      missingPermissions.push("Create repositories");
    }
    if (!account.permissions.readRepo) {
      missingPermissions.push("Read repositories");
    }
    if (!account.permissions.writeRepo) {
      missingPermissions.push("Write to repositories");
    }

    return {
      canCreateRepo: account.permissions.createRepo,
      canDeleteRepo: account.permissions.deleteRepo,
      missingPermissions,
    };
  }

  /**
   * Helper method to format validation status
   */
  getValidationStatusDisplay(status: string): {
    text: string;
    color: string;
    icon: string;
  } {
    switch (status) {
      case "valid":
        return {
          text: "Valid",
          color: "text-green-600 bg-green-100",
          icon: "✓",
        };
      case "invalid":
        return {
          text: "Invalid",
          color: "text-red-600 bg-red-100",
          icon: "✗",
        };
      case "expired":
        return {
          text: "Expired",
          color: "text-orange-600 bg-orange-100",
          icon: "⚠",
        };
      case "pending":
      default:
        return {
          text: "Pending",
          color: "text-yellow-600 bg-yellow-100",
          icon: "⏳",
        };
    }
  }
}

export const gitHubAccountsService = new GitHubAccountsService();
export default gitHubAccountsService;
