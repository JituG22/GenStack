import { Octokit } from "@octokit/rest";
import { GitHubAccount } from "../models/GitHubAccount";
import { Project } from "../models/Project-simple";
import crypto from "crypto";
import { decrypt } from "../utils/encryption";
import path from "path";

export interface FileChange {
  path: string;
  content: string;
  encoding?: "utf-8" | "base64";
  sha?: string; // For updates
}

export interface SyncResult {
  success: boolean;
  filesChanged: number;
  errors: string[];
  commitSha?: string;
  commitUrl?: string;
}

export interface BranchInfo {
  name: string;
  sha: string;
  protected: boolean;
  default: boolean;
}

export class GitHubSyncService {
  private octokitInstances: Map<string, Octokit> = new Map();

  private async getOctokit(accountId: string): Promise<Octokit> {
    if (this.octokitInstances.has(accountId)) {
      return this.octokitInstances.get(accountId)!;
    }

    const account = await GitHubAccount.findById(accountId);
    if (!account) {
      throw new Error("GitHub account not found");
    }

    const token = decrypt(account.token);
    const octokit = new Octokit({ auth: token });

    this.octokitInstances.set(accountId, octokit);
    return octokit;
  }

  /**
   * Sync project files to GitHub repository
   */
  async syncFilesToGitHub(
    projectId: string,
    accountId: string,
    files: FileChange[],
    commitMessage: string,
    branch: string = "main"
  ): Promise<SyncResult> {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      if (!project.github?.enabled || !project.github?.repoName) {
        throw new Error("GitHub integration not enabled for this project");
      }

      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const owner = account.username;
      const repo = project.github.repoName;

      // Get the latest commit SHA for the branch
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const latestCommitSha = ref.object.sha;

      // Get the tree of the latest commit
      const { data: commit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha,
      });

      // Create new tree with file changes
      const tree = [];
      const errors: string[] = [];
      let filesChanged = 0;

      for (const file of files) {
        try {
          const content = Buffer.from(file.content).toString("base64");

          tree.push({
            path: file.path,
            mode: "100644" as const,
            type: "blob" as const,
            content: file.content,
          });

          filesChanged++;
        } catch (error) {
          errors.push(`Failed to process file ${file.path}: ${error}`);
        }
      }

      if (tree.length === 0) {
        return {
          success: false,
          filesChanged: 0,
          errors: ["No valid files to sync"],
        };
      }

      // Create new tree
      const { data: newTree } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: commit.tree.sha,
        tree,
      });

      // Create new commit
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // Update branch reference
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      // Update project sync status
      await Project.findByIdAndUpdate(projectId, {
        "github.syncStatus": "synced",
        "github.lastSyncAt": new Date(),
        "github.lastCommitSha": newCommit.sha,
        $unset: { "github.syncErrors": 1 },
      });

      return {
        success: true,
        filesChanged,
        errors,
        commitSha: newCommit.sha,
        commitUrl: newCommit.html_url,
      };
    } catch (error: any) {
      // Update project with sync error
      await Project.findByIdAndUpdate(projectId, {
        "github.syncStatus": "error",
        "github.syncErrors": [error.message],
        "github.lastSyncAt": new Date(),
      });

      return {
        success: false,
        filesChanged: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Pull files from GitHub repository
   */
  async pullFilesFromGitHub(
    projectId: string,
    accountId: string,
    branch: string = "main",
    paths?: string[]
  ): Promise<{ files: FileChange[]; success: boolean; errors: string[] }> {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const owner = account.username;
      const repo = project.github?.repoName;

      if (!repo) {
        throw new Error("No GitHub repository configured");
      }

      // Get repository contents
      const { data: contents } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: "",
        ref: branch,
      });

      const files: FileChange[] = [];
      const errors: string[] = [];

      if (Array.isArray(contents)) {
        for (const item of contents) {
          if (item.type === "file") {
            try {
              // Filter by paths if specified
              if (paths && !paths.some((p) => item.path.startsWith(p))) {
                continue;
              }

              const { data: fileData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: item.path,
                ref: branch,
              });

              if ("content" in fileData && fileData.content) {
                const content = Buffer.from(
                  fileData.content,
                  "base64"
                ).toString("utf-8");
                files.push({
                  path: item.path,
                  content,
                  sha: fileData.sha,
                });
              }
            } catch (error: any) {
              errors.push(`Failed to fetch ${item.path}: ${error.message}`);
            }
          }
        }
      }

      return {
        files,
        success: true,
        errors,
      };
    } catch (error: any) {
      return {
        files: [],
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Get repository branches
   */
  async getBranches(
    accountId: string,
    repoName: string
  ): Promise<BranchInfo[]> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const { data: branches } = await octokit.rest.repos.listBranches({
        owner: account.username,
        repo: repoName,
      });

      const { data: repo } = await octokit.rest.repos.get({
        owner: account.username,
        repo: repoName,
      });

      return branches.map((branch: any) => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected,
        default: branch.name === repo.default_branch,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get branches: ${error.message}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(
    accountId: string,
    repoName: string,
    branchName: string,
    fromBranch: string = "main"
  ): Promise<BranchInfo> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const owner = account.username;

      // Get the SHA of the source branch
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo: repoName,
        ref: `heads/${fromBranch}`,
      });

      // Create new branch
      await octokit.rest.git.createRef({
        owner,
        repo: repoName,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      });

      return {
        name: branchName,
        sha: ref.object.sha,
        protected: false,
        default: false,
      };
    } catch (error: any) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Get file diff between branches
   */
  async getFileDiff(
    accountId: string,
    repoName: string,
    filePath: string,
    baseBranch: string,
    headBranch: string
  ): Promise<string> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const { data: comparison } = await octokit.rest.repos.compareCommits({
        owner: account.username,
        repo: repoName,
        base: baseBranch,
        head: headBranch,
      });

      const file = comparison.files?.find((f: any) => f.filename === filePath);
      return file?.patch || "";
    } catch (error: any) {
      throw new Error(`Failed to get file diff: ${error.message}`);
    }
  }

  /**
   * Clean up Octokit instances
   */
  clearCache(): void {
    this.octokitInstances.clear();
  }
}

export const gitHubSyncService = new GitHubSyncService();
