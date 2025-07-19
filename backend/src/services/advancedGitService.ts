import { Octokit } from "@octokit/rest";
import { GitHubAccount } from "../models/GitHubAccount";
import { Project } from "../models/Project-simple";
import { decrypt } from "../utils/encryption";
import simpleGit, { SimpleGit } from "simple-git";
import path from "path";
import fs from "fs/promises";

export interface GitConfig {
  user: {
    name: string;
    email: string;
  };
  remote: {
    origin: string;
  };
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  files: Array<{
    filename: string;
    status: "added" | "modified" | "removed";
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

export interface BranchInfo {
  name: string;
  sha: string;
  isDefault: boolean;
  isProtected: boolean;
  ahead: number;
  behind: number;
  lastCommit: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface MergeConflict {
  file: string;
  content: string;
  conflictMarkers: {
    start: number;
    middle: number;
    end: number;
  }[];
}

export interface PullRequestPreview {
  title: string;
  description: string;
  changes: {
    additions: number;
    deletions: number;
    changedFiles: number;
  };
  conflicts: MergeConflict[];
  checks: Array<{
    name: string;
    status: "pending" | "success" | "failure";
    description: string;
  }>;
}

class AdvancedGitService {
  private async getOctokit(accountId: string): Promise<Octokit> {
    const account = await GitHubAccount.findById(accountId);
    if (!account) {
      throw new Error("GitHub account not found");
    }

    const decryptedToken = decrypt(account.token);
    return new Octokit({
      auth: decryptedToken,
    });
  }

  /**
   * Initialize local Git repository with advanced configuration
   */
  async initializeRepository(
    projectId: string,
    accountId: string,
    gitConfig: GitConfig
  ): Promise<{ success: boolean; message: string; path?: string }> {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      const repoPath = path.join(process.cwd(), "temp", "repos", projectId);

      // Create directory if it doesn't exist
      await fs.mkdir(repoPath, { recursive: true });

      const git: SimpleGit = simpleGit(repoPath);

      // Initialize repository
      await git.init();

      // Configure Git
      await git.addConfig("user.name", gitConfig.user.name);
      await git.addConfig("user.email", gitConfig.user.email);

      // Add remote origin
      await git.addRemote("origin", gitConfig.remote.origin);

      return {
        success: true,
        message: "Repository initialized successfully",
        path: repoPath,
      };
    } catch (error: any) {
      console.error("Error initializing repository:", error);
      return {
        success: false,
        message: error.message || "Failed to initialize repository",
      };
    }
  }

  /**
   * Get detailed commit history with statistics
   */
  async getCommitHistory(
    accountId: string,
    repoName: string,
    options: {
      branch?: string;
      limit?: number;
      since?: string;
      until?: string;
      author?: string;
    } = {}
  ): Promise<CommitInfo[]> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const { branch = "main", limit = 50 } = options;

      // Get commits
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner: account.username,
        repo: repoName,
        sha: branch,
        per_page: limit,
        since: options.since,
        until: options.until,
        author: options.author,
      });

      // Get detailed commit information
      const commitDetails = await Promise.all(
        commits.map(async (commit) => {
          const { data: commitDetail } = await octokit.rest.repos.getCommit({
            owner: account.username,
            repo: repoName,
            ref: commit.sha,
          });

          return {
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author?.name || "Unknown",
              email: commit.commit.author?.email || "unknown@example.com",
              date: commit.commit.author?.date || new Date().toISOString(),
            },
            stats: {
              additions: commitDetail.stats?.additions || 0,
              deletions: commitDetail.stats?.deletions || 0,
              total: commitDetail.stats?.total || 0,
            },
            files:
              commitDetail.files?.map((file) => ({
                filename: file.filename,
                status: file.status as "added" | "modified" | "removed",
                additions: file.additions || 0,
                deletions: file.deletions || 0,
                changes: file.changes || 0,
              })) || [],
          };
        })
      );

      return commitDetails;
    } catch (error: any) {
      console.error("Error getting commit history:", error);
      throw new Error(error.message || "Failed to get commit history");
    }
  }

  /**
   * Get advanced branch information with comparison data
   */
  async getBranchDetails(
    accountId: string,
    repoName: string
  ): Promise<BranchInfo[]> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      // Get repository info for default branch
      const { data: repo } = await octokit.rest.repos.get({
        owner: account.username,
        repo: repoName,
      });

      // Get all branches
      const { data: branches } = await octokit.rest.repos.listBranches({
        owner: account.username,
        repo: repoName,
        per_page: 100,
      });

      // Get detailed branch information
      const branchDetails = await Promise.all(
        branches.map(async (branch) => {
          try {
            // Get branch protection status
            let isProtected = false;
            try {
              await octokit.rest.repos.getBranchProtection({
                owner: account.username,
                repo: repoName,
                branch: branch.name,
              });
              isProtected = true;
            } catch (error) {
              // Branch is not protected
              isProtected = false;
            }

            // Compare with default branch to get ahead/behind counts
            let ahead = 0;
            let behind = 0;

            if (branch.name !== repo.default_branch) {
              try {
                const { data: comparison } =
                  await octokit.rest.repos.compareCommits({
                    owner: account.username,
                    repo: repoName,
                    base: repo.default_branch,
                    head: branch.name,
                  });
                ahead = comparison.ahead_by;
                behind = comparison.behind_by;
              } catch (error) {
                // Comparison failed, use default values
              }
            }

            // Get last commit
            const { data: lastCommit } = await octokit.rest.repos.getCommit({
              owner: account.username,
              repo: repoName,
              ref: branch.commit.sha,
            });

            return {
              name: branch.name,
              sha: branch.commit.sha,
              isDefault: branch.name === repo.default_branch,
              isProtected,
              ahead,
              behind,
              lastCommit: {
                sha: lastCommit.sha,
                message: lastCommit.commit.message,
                author: lastCommit.commit.author?.name || "Unknown",
                date:
                  lastCommit.commit.author?.date || new Date().toISOString(),
              },
            };
          } catch (error) {
            console.error(`Error processing branch ${branch.name}:`, error);
            return {
              name: branch.name,
              sha: branch.commit.sha,
              isDefault: branch.name === repo.default_branch,
              isProtected: false,
              ahead: 0,
              behind: 0,
              lastCommit: {
                sha: branch.commit.sha,
                message: "Unable to fetch commit details",
                author: "Unknown",
                date: new Date().toISOString(),
              },
            };
          }
        })
      );

      return branchDetails;
    } catch (error: any) {
      console.error("Error getting branch details:", error);
      throw new Error(error.message || "Failed to get branch details");
    }
  }

  /**
   * Create branch with protection rules
   */
  async createProtectedBranch(
    accountId: string,
    repoName: string,
    branchName: string,
    sourceRef: string = "main",
    protectionRules?: {
      requirePullRequest: boolean;
      requireCodeOwnerReviews: boolean;
      requireStatusChecks: string[];
      enforceAdmins: boolean;
    }
  ): Promise<{ success: boolean; message: string; branch?: any }> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      // Get source ref
      const { data: sourceCommit } = await octokit.rest.repos.getCommit({
        owner: account.username,
        repo: repoName,
        ref: sourceRef,
      });

      // Create branch
      const { data: branch } = await octokit.rest.git.createRef({
        owner: account.username,
        repo: repoName,
        ref: `refs/heads/${branchName}`,
        sha: sourceCommit.sha,
      });

      // Apply protection rules if specified
      if (protectionRules) {
        await octokit.rest.repos.updateBranchProtection({
          owner: account.username,
          repo: repoName,
          branch: branchName,
          required_status_checks:
            protectionRules.requireStatusChecks.length > 0
              ? {
                  strict: true,
                  contexts: protectionRules.requireStatusChecks,
                }
              : null,
          enforce_admins: protectionRules.enforceAdmins,
          required_pull_request_reviews: protectionRules.requirePullRequest
            ? {
                required_approving_review_count: 1,
                require_code_owner_reviews:
                  protectionRules.requireCodeOwnerReviews,
                dismiss_stale_reviews: true,
              }
            : null,
          restrictions: null,
        });
      }

      return {
        success: true,
        message: `Branch "${branchName}" created successfully${
          protectionRules ? " with protection rules" : ""
        }`,
        branch,
      };
    } catch (error: any) {
      console.error("Error creating protected branch:", error);
      return {
        success: false,
        message: error.message || "Failed to create branch",
      };
    }
  }

  /**
   * Preview pull request before creation
   */
  async previewPullRequest(
    accountId: string,
    repoName: string,
    headBranch: string,
    baseBranch: string = "main"
  ): Promise<PullRequestPreview> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      // Compare branches
      const { data: comparison } = await octokit.rest.repos.compareCommits({
        owner: account.username,
        repo: repoName,
        base: baseBranch,
        head: headBranch,
      });

      // Generate PR title and description
      const commits = comparison.commits;
      const title =
        commits.length === 1
          ? commits[0].commit.message.split("\n")[0]
          : `Merge ${headBranch} into ${baseBranch}`;

      const description =
        commits.length > 1
          ? `## Changes\n\n${commits
              .map((c) => `- ${c.commit.message.split("\n")[0]}`)
              .join("\n")}`
          : commits[0]?.commit.message || "";

      // Check for conflicts (simplified)
      const conflicts: MergeConflict[] = [];

      // Get status checks for the head commit
      const checks: Array<{
        name: string;
        status: "pending" | "success" | "failure";
        description: string;
      }> = [];

      try {
        const { data: checkRuns } = await octokit.rest.checks.listForRef({
          owner: account.username,
          repo: repoName,
          ref: headBranch,
        });

        checks.push(
          ...checkRuns.check_runs.map((check) => ({
            name: check.name,
            status: check.status as "pending" | "success" | "failure",
            description:
              check.output?.summary || check.conclusion || "No description",
          }))
        );
      } catch (error) {
        // No checks available
      }

      return {
        title,
        description,
        changes: {
          additions: comparison.ahead_by,
          deletions: comparison.behind_by,
          changedFiles: comparison.files?.length || 0,
        },
        conflicts,
        checks,
      };
    } catch (error: any) {
      console.error("Error previewing pull request:", error);
      throw new Error(error.message || "Failed to preview pull request");
    }
  }

  /**
   * Advanced merge with conflict resolution
   */
  async performAdvancedMerge(
    accountId: string,
    repoName: string,
    pullNumber: number,
    mergeMethod: "merge" | "squash" | "rebase" = "merge",
    mergeMessage?: string
  ): Promise<{ success: boolean; message: string; merge?: any }> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      // Get PR details
      const { data: pr } = await octokit.rest.pulls.get({
        owner: account.username,
        repo: repoName,
        pull_number: pullNumber,
      });

      // Check if PR is mergeable
      if (!pr.mergeable) {
        return {
          success: false,
          message:
            "Pull request has conflicts and cannot be merged automatically",
        };
      }

      // Perform merge
      const { data: merge } = await octokit.rest.pulls.merge({
        owner: account.username,
        repo: repoName,
        pull_number: pullNumber,
        commit_title:
          mergeMessage ||
          `Merge pull request #${pullNumber} from ${pr.head.ref}`,
        commit_message: pr.body || "",
        merge_method: mergeMethod,
      });

      return {
        success: true,
        message: `Pull request #${pullNumber} merged successfully using ${mergeMethod}`,
        merge,
      };
    } catch (error: any) {
      console.error("Error performing merge:", error);
      return {
        success: false,
        message: error.message || "Failed to merge pull request",
      };
    }
  }

  /**
   * Create release with automated changelog
   */
  async createRelease(
    accountId: string,
    repoName: string,
    tagName: string,
    releaseName: string,
    description: string,
    isDraft: boolean = false,
    isPrerelease: boolean = false,
    generateChangelog: boolean = true
  ): Promise<{ success: boolean; message: string; release?: any }> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      let body = description;

      // Generate changelog if requested
      if (generateChangelog) {
        try {
          // Get latest release to compare from
          const { data: releases } = await octokit.rest.repos.listReleases({
            owner: account.username,
            repo: repoName,
            per_page: 1,
          });

          let sinceDate: string | undefined;
          if (releases.length > 0) {
            sinceDate = releases[0].created_at;
          }

          // Get commits since last release
          const commits = await this.getCommitHistory(accountId, repoName, {
            since: sinceDate,
            limit: 100,
          });

          if (commits.length > 0) {
            const changelog = commits
              .map(
                (commit) =>
                  `- ${commit.message.split("\n")[0]} (${commit.sha.substring(
                    0,
                    7
                  )})`
              )
              .join("\n");

            body = `${description}\n\n## What's Changed\n\n${changelog}`;
          }
        } catch (error) {
          console.error("Error generating changelog:", error);
          // Continue without changelog
        }
      }

      // Create release
      const { data: release } = await octokit.rest.repos.createRelease({
        owner: account.username,
        repo: repoName,
        tag_name: tagName,
        name: releaseName,
        body,
        draft: isDraft,
        prerelease: isPrerelease,
      });

      return {
        success: true,
        message: `Release "${releaseName}" created successfully`,
        release,
      };
    } catch (error: any) {
      console.error("Error creating release:", error);
      return {
        success: false,
        message: error.message || "Failed to create release",
      };
    }
  }
}

export const advancedGitService = new AdvancedGitService();
