import { githubProjectsApi } from "../lib/api";
import { gitHubAccountsService } from "./gitHubAccountsService";
import { GitHubAccount } from "../types";

export interface EnhancedProjectRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  github?: {
    enabled: boolean;
    accountId: string;
    repositoryName: string;
    isPrivate?: boolean;
    autoSync?: boolean;
    createReadme?: boolean;
    gitignoreTemplate?: string;
    license?: string;
  };
}

export interface GitHubAccountOption {
  id: string;
  nickname: string;
  username: string;
  avatarUrl?: string;
  isDefault: boolean;
  isActive: boolean;
  canCreateRepos: boolean;
  canCreatePrivateRepos: boolean;
}

class EnhancedGitHubProjectsService {
  /**
   * Get available GitHub accounts for project creation
   */
  async getAvailableAccounts(): Promise<GitHubAccountOption[]> {
    try {
      const accounts = await gitHubAccountsService.getAccounts();

      return accounts
        .filter(
          (account: GitHubAccount) =>
            account.isActive && account.validationStatus === "valid"
        )
        .map((account: GitHubAccount) => ({
          id: account.id,
          nickname: account.nickname,
          username: account.username,
          avatarUrl: account.avatarUrl,
          isDefault: account.isDefault,
          isActive: account.isActive,
          canCreateRepos: account.permissions.createRepo,
          canCreatePrivateRepos: account.permissions.createRepo,
        }));
    } catch (error) {
      console.error("Error fetching GitHub accounts:", error);
      return [];
    }
  }

  /**
   * Create project with enhanced GitHub integration
   */
  async createProjectWithGitHub(projectData: EnhancedProjectRequest) {
    // For now, use the existing API with enhanced metadata
    // Later this can be extended when backend supports account selection
    const apiRequest = {
      name: projectData.name,
      description: projectData.description,
      isPublic: projectData.isPublic,
      tags: projectData.tags,
      enableGitHub: projectData.github?.enabled || false,
      githubConfig: projectData.github
        ? {
            repositoryName: projectData.github.repositoryName,
            autoSync: projectData.github.autoSync || true,
            createReadme: projectData.github.createReadme || true,
          }
        : undefined,
      // Store metadata for future use
      _enhancedGitHubConfig: projectData.github,
    };

    return githubProjectsApi.createProjectWithGitHub(apiRequest);
  }

  /**
   * Get GitHub integration health with account information
   */
  async getHealthWithAccounts() {
    try {
      const [healthResponse, accounts] = await Promise.all([
        githubProjectsApi.getHealth(),
        this.getAvailableAccounts(),
      ]);

      return {
        ...healthResponse,
        accounts,
        accountsAvailable: accounts.length,
        hasActiveAccounts: accounts.length > 0,
        hasDefaultAccount: accounts.some(
          (acc: GitHubAccountOption) => acc.isDefault
        ),
      };
    } catch (error) {
      console.error("Error getting GitHub health:", error);
      return {
        success: false,
        config: { ready: false },
        accounts: [],
        accountsAvailable: 0,
        hasActiveAccounts: false,
        hasDefaultAccount: false,
      };
    }
  }

  /**
   * Update project GitHub integration
   */
  async updateProjectGitHub(
    projectId: string,
    githubConfig: {
      accountId: string;
      repositoryName: string;
      autoSync: boolean;
      isPrivate: boolean;
    }
  ) {
    // For now, use existing API - can be enhanced later
    return githubProjectsApi.updateProjectWithGitHub(projectId, {
      repositoryName: githubConfig.repositoryName,
      autoSync: githubConfig.autoSync,
      _enhancedConfig: githubConfig,
    });
  }

  /**
   * Delete project with GitHub repository cleanup
   */
  async deleteProjectWithGitHub(projectId: string) {
    return githubProjectsApi.deleteProjectWithGitHub(projectId);
  }

  /**
   * Sync project with GitHub repository
   */
  async syncProjectWithGitHub(projectId: string) {
    return githubProjectsApi.syncProjectWithGitHub(projectId);
  }

  /**
   * Get project GitHub status
   */
  async getProjectGitHubStatus(projectId: string) {
    return githubProjectsApi.getProjectGitHubStatus(projectId);
  }

  /**
   * Check if GitHub accounts are configured and ready
   */
  async checkAccountsReadiness() {
    try {
      const accounts = await this.getAvailableAccounts();
      const activeAccounts = accounts.filter((acc) => acc.isActive);
      const defaultAccount = accounts.find((acc) => acc.isDefault);

      return {
        hasAccounts: accounts.length > 0,
        hasActiveAccounts: activeAccounts.length > 0,
        hasDefaultAccount: !!defaultAccount,
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        defaultAccount: defaultAccount || null,
        canCreateRepos: activeAccounts.some((acc) => acc.canCreateRepos),
        recommendations: this.getAccountRecommendations(accounts),
      };
    } catch (error) {
      console.error("Error checking account readiness:", error);
      return {
        hasAccounts: false,
        hasActiveAccounts: false,
        hasDefaultAccount: false,
        totalAccounts: 0,
        activeAccounts: 0,
        defaultAccount: null,
        canCreateRepos: false,
        recommendations: ["Add a GitHub account to enable repository creation"],
      };
    }
  }

  /**
   * Get recommendations for GitHub account setup
   */
  private getAccountRecommendations(accounts: GitHubAccountOption[]): string[] {
    const recommendations: string[] = [];

    if (accounts.length === 0) {
      recommendations.push(
        "Add a GitHub account to enable repository creation"
      );
      return recommendations;
    }

    const activeAccounts = accounts.filter((acc) => acc.isActive);
    if (activeAccounts.length === 0) {
      recommendations.push("Activate at least one GitHub account");
    }

    const accountsWithRepoPermissions = activeAccounts.filter(
      (acc) => acc.canCreateRepos
    );
    if (accountsWithRepoPermissions.length === 0) {
      recommendations.push(
        "Ensure your GitHub token has repository creation permissions"
      );
    }

    const hasDefaultAccount = accounts.some((acc) => acc.isDefault);
    if (!hasDefaultAccount && activeAccounts.length > 1) {
      recommendations.push(
        "Set a default GitHub account for easier project creation"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Your GitHub configuration is ready for project creation"
      );
    }

    return recommendations;
  }
}

export const enhancedGitHubProjectsService =
  new EnhancedGitHubProjectsService();
