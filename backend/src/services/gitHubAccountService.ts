import axios, { AxiosInstance } from "axios";
import { GitHubAccount, IGitHubAccount } from "../models/GitHubAccount";
import { GitHubService } from "./githubService";
import mongoose from "mongoose";

export interface GitHubAccountValidation {
  isValid: boolean;
  user?: {
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
    type: string;
  };
  scopes?: string[];
  error?: string;
}

export interface CreateGitHubAccountRequest {
  nickname: string;
  token: string;
  setAsDefault?: boolean;
}

export interface UpdateGitHubAccountRequest {
  nickname?: string;
  isActive?: boolean;
  setAsDefault?: boolean;
}

export class GitHubAccountService {
  /**
   * Validate a GitHub token and get account information
   */
  async validateGitHubToken(token: string): Promise<GitHubAccountValidation> {
    try {
      const api = axios.create({
        baseURL: "https://api.github.com",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GenStack-App",
        },
        timeout: 10000,
      });

      // Get user information
      const userResponse = await api.get("/user");
      const user = userResponse.data;

      // Get token scopes from response headers
      const scopes = userResponse.headers["x-oauth-scopes"]
        ? userResponse.headers["x-oauth-scopes"].split(", ").filter(Boolean)
        : [];

      return {
        isValid: true,
        user: {
          id: user.id,
          login: user.login,
          name: user.name || user.login,
          email: user.email || "",
          avatar_url: user.avatar_url,
          type: user.type,
        },
        scopes,
      };
    } catch (error: any) {
      console.error(
        "GitHub token validation failed:",
        error.response?.data || error.message
      );

      return {
        isValid: false,
        error:
          error.response?.data?.message || "Invalid token or network error",
      };
    }
  }

  /**
   * Create a new GitHub account for a user
   */
  async createGitHubAccount(
    userId: string,
    organizationId: string,
    data: CreateGitHubAccountRequest
  ): Promise<IGitHubAccount> {
    try {
      // Validate the token first
      const validation = await this.validateGitHubToken(data.token);

      if (!validation.isValid || !validation.user) {
        throw new Error(validation.error || "Invalid GitHub token");
      }

      // Check if account already exists for this GitHub user
      const existingAccount = await GitHubAccount.findOne({
        $or: [
          { githubId: validation.user.id },
          { userId, githubLogin: validation.user.login },
        ],
      });

      if (existingAccount) {
        throw new Error("GitHub account already exists in the system");
      }

      // Analyze token permissions
      const permissions = this.analyzeTokenPermissions(validation.scopes || []);

      // Create the new account
      const accountData = {
        userId,
        organizationId,
        nickname: data.nickname,
        username: validation.user.login,
        email: validation.user.email,
        avatarUrl: validation.user.avatar_url,
        token: data.token, // Will be encrypted in the model
        githubId: validation.user.id,
        githubLogin: validation.user.login,
        githubName: validation.user.name,
        githubType: validation.user.type as "User" | "Organization",
        scopes: validation.scopes || [],
        permissions,
        isActive: true,
        isDefault: data.setAsDefault || false,
        validationStatus: "valid" as const,
        lastValidatedAt: new Date(),
        stats: {
          repositoriesCreated: 0,
          totalApiCalls: 0,
        },
      };

      const newAccount = new GitHubAccount(accountData);
      await newAccount.save();

      // Return account without sensitive data
      const savedAccount = await GitHubAccount.findById(newAccount._id).select(
        "-token -refreshToken"
      );

      return savedAccount!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all GitHub accounts for a user
   */
  async getUserGitHubAccounts(userId: string): Promise<IGitHubAccount[]> {
    return GitHubAccount.find({ userId, isActive: true })
      .select("-token -refreshToken")
      .sort({ isDefault: -1, createdAt: -1 });
  }

  /**
   * Get a specific GitHub account
   */
  async getGitHubAccount(
    accountId: string,
    userId: string
  ): Promise<IGitHubAccount | null> {
    return GitHubAccount.findOne({
      _id: accountId,
      userId,
      isActive: true,
    }).select("-token -refreshToken");
  }

  /**
   * Get the default GitHub account for a user
   */
  async getDefaultGitHubAccount(
    userId: string
  ): Promise<IGitHubAccount | null> {
    return GitHubAccount.findOne({
      userId,
      isDefault: true,
      isActive: true,
    }).select("-token -refreshToken");
  }

  /**
   * Update a GitHub account
   */
  async updateGitHubAccount(
    accountId: string,
    userId: string,
    data: UpdateGitHubAccountRequest
  ): Promise<IGitHubAccount> {
    try {
      const account = await GitHubAccount.findOne({
        _id: accountId,
        userId,
        isActive: true,
      });

      if (!account) {
        throw new Error("GitHub account not found");
      }

      // Update basic fields
      if (data.nickname !== undefined) {
        account.nickname = data.nickname;
      }

      if (data.isActive !== undefined) {
        account.isActive = data.isActive;
      }

      // Handle default account change
      if (data.setAsDefault === true) {
        // Use the static method to properly handle default switching
        await (GitHubAccount as any).setDefault(accountId, userId);
      }

      account.updatedAt = new Date();
      await account.save();

      // Return updated account without sensitive data
      return GitHubAccount.findById(accountId).select(
        "-token -refreshToken"
      ) as any;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a GitHub account
   */
  async deleteGitHubAccount(accountId: string, userId: string): Promise<void> {
    try {
      const account = await GitHubAccount.findOne({
        _id: accountId,
        userId,
        isActive: true,
      });

      if (!account) {
        throw new Error("GitHub account not found");
      }

      // Check if this is the only active account
      const activeAccounts = await GitHubAccount.countDocuments({
        userId,
        isActive: true,
      });

      if (activeAccounts === 1) {
        throw new Error(
          "Cannot delete the last GitHub account. Add another account first."
        );
      }

      // If deleting the default account, set another account as default
      if (account.isDefault) {
        const nextAccount = await GitHubAccount.findOne({
          userId,
          isActive: true,
          _id: { $ne: accountId },
        });

        if (nextAccount) {
          nextAccount.isDefault = true;
          await nextAccount.save();
        }
      }

      // Soft delete - mark as inactive
      account.isActive = false;
      account.isDefault = false;
      account.updatedAt = new Date();
      await account.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set an account as default
   */
  async setDefaultAccount(
    accountId: string,
    userId: string
  ): Promise<IGitHubAccount> {
    const updatedAccount = await (GitHubAccount as any).setDefault(
      accountId,
      userId
    );

    if (!updatedAccount) {
      throw new Error("GitHub account not found");
    }

    return GitHubAccount.findById(accountId).select(
      "-token -refreshToken"
    ) as any;
  }

  /**
   * Validate all accounts for a user
   */
  async validateAllUserAccounts(userId: string): Promise<void> {
    const accounts = await GitHubAccount.find({
      userId,
      isActive: true,
    }).select("+token");

    for (const account of accounts) {
      try {
        const validation = await this.validateGitHubToken(account.token);

        account.validationStatus = validation.isValid ? "valid" : "invalid";
        account.validationError = validation.error;
        account.lastValidatedAt = new Date();

        if (validation.isValid && validation.user) {
          // Update account info if it has changed
          account.email = validation.user.email;
          account.avatarUrl = validation.user.avatar_url;
          account.githubName = validation.user.name;
          account.scopes = validation.scopes || [];
          account.permissions = this.analyzeTokenPermissions(
            validation.scopes || []
          );
        }

        await account.save();
      } catch (error) {
        console.error(`Failed to validate account ${account.id}:`, error);
        account.validationStatus = "invalid";
        account.validationError = "Validation failed";
        account.lastValidatedAt = new Date();
        await account.save();
      }
    }
  }

  /**
   * Get GitHub service instance for a specific account
   */
  async getGitHubServiceForAccount(
    accountId: string,
    userId: string
  ): Promise<GitHubService> {
    const account = await GitHubAccount.findOne({
      _id: accountId,
      userId,
      isActive: true,
    }).select("+token");

    if (!account) {
      throw new Error("GitHub account not found");
    }

    if (account.validationStatus !== "valid") {
      throw new Error(
        "GitHub account is not valid. Please re-validate the token."
      );
    }

    // Update usage stats
    (account as any).updateStats("api_call");
    await account.save();

    // Create a GitHubService instance with this account's token
    // Note: Will need to modify GitHubService to accept custom config
    const GitHubServiceClass = GitHubService as any;
    return new GitHubServiceClass();
  }

  /**
   * Get GitHub service instance for the default account
   */
  async getDefaultGitHubService(userId: string): Promise<GitHubService> {
    const defaultAccount = await GitHubAccount.findOne({
      userId,
      isDefault: true,
      isActive: true,
    }).select("+token");

    if (!defaultAccount) {
      throw new Error(
        "No default GitHub account found. Please configure a GitHub account."
      );
    }

    return this.getGitHubServiceForAccount(
      defaultAccount._id.toString(),
      userId
    );
  }

  /**
   * Analyze token permissions based on scopes
   */
  private analyzeTokenPermissions(scopes: string[]): any {
    const permissions = {
      createRepo: false,
      deleteRepo: false,
      readRepo: false,
      writeRepo: false,
      adminRepo: false,
    };

    for (const scope of scopes) {
      switch (scope) {
        case "repo":
          permissions.createRepo = true;
          permissions.deleteRepo = true;
          permissions.readRepo = true;
          permissions.writeRepo = true;
          permissions.adminRepo = true;
          break;
        case "public_repo":
          permissions.createRepo = true;
          permissions.readRepo = true;
          permissions.writeRepo = true;
          break;
        case "delete_repo":
          permissions.deleteRepo = true;
          break;
        case "read:repo":
          permissions.readRepo = true;
          break;
        case "write:repo":
          permissions.writeRepo = true;
          break;
        case "admin:repo":
          permissions.adminRepo = true;
          break;
      }
    }

    return permissions;
  }

  /**
   * Get usage statistics for a user's GitHub accounts
   */
  async getAccountStatistics(userId: string): Promise<any> {
    const accounts = await GitHubAccount.find({
      userId,
      isActive: true,
    }).select("nickname stats validationStatus lastUsedAt");

    const totalStats = {
      totalAccounts: accounts.length,
      validAccounts: accounts.filter((acc) => acc.validationStatus === "valid")
        .length,
      totalRepositoriesCreated: 0,
      totalApiCalls: 0,
      lastActivity: null as Date | null,
    };

    for (const account of accounts) {
      totalStats.totalRepositoriesCreated += account.stats.repositoriesCreated;
      totalStats.totalApiCalls += account.stats.totalApiCalls;

      if (
        !totalStats.lastActivity ||
        (account.lastUsedAt && account.lastUsedAt > totalStats.lastActivity)
      ) {
        totalStats.lastActivity = account.lastUsedAt || null;
      }
    }

    return {
      summary: totalStats,
      accounts: accounts,
    };
  }
}

export const gitHubAccountService = new GitHubAccountService();
