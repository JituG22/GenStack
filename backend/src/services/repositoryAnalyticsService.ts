import { Octokit } from "@octokit/rest";
import { GitHubAccount } from "../models/GitHubAccount";
import { Project } from "../models/Project-simple";
import { decrypt } from "../utils/encryption";

export interface RepositoryMetrics {
  overview: {
    totalCommits: number;
    totalContributors: number;
    totalBranches: number;
    totalPullRequests: number;
    totalIssues: number;
    codeQuality: {
      linesOfCode: number;
      technicalDebt: number;
      coverage: number;
    };
  };
  activity: {
    commitsPerDay: Array<{ date: string; commits: number }>;
    pullRequestsPerDay: Array<{ date: string; pullRequests: number }>;
    issuesPerDay: Array<{ date: string; issues: number }>;
    contributorActivity: Array<{
      author: string;
      commits: number;
      additions: number;
      deletions: number;
    }>;
  };
  performance: {
    buildTimes: Array<{ date: string; duration: number; status: string }>;
    deploymentFrequency: Array<{ date: string; deployments: number }>;
    leadTime: Array<{ date: string; hours: number }>;
    failureRate: number;
    recoveryTime: number;
  };
  collaboration: {
    reviewTimes: Array<{ pr: number; hours: number }>;
    approvalRates: Array<{ date: string; approved: number; rejected: number }>;
    teamVelocity: Array<{ sprint: string; points: number }>;
  };
}

export interface CodeQualityReport {
  files: Array<{
    path: string;
    language: string;
    lines: number;
    complexity: number;
    maintainability: number;
    issues: Array<{
      type: "bug" | "vulnerability" | "code_smell";
      severity: "high" | "medium" | "low";
      message: string;
      line: number;
    }>;
  }>;
  overall: {
    rating: "A" | "B" | "C" | "D" | "E";
    technicalDebt: number;
    coverage: number;
    duplicatedLines: number;
    bugs: number;
    vulnerabilities: number;
    codeSmells: number;
  };
  trends: Array<{
    date: string;
    rating: string;
    technicalDebt: number;
    coverage: number;
  }>;
}

export interface SecurityAnalysis {
  vulnerabilities: Array<{
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    type: string;
    description: string;
    file: string;
    line: number;
    recommendation: string;
    status: "open" | "fixed" | "dismissed";
  }>;
  dependencies: Array<{
    name: string;
    version: string;
    vulnerabilities: number;
    license: string;
    outdated: boolean;
  }>;
  secrets: Array<{
    type: string;
    file: string;
    line: number;
    masked: string;
    severity: "high" | "medium" | "low";
  }>;
  compliance: {
    score: number;
    checks: Array<{
      name: string;
      status: "pass" | "fail" | "warning";
      description: string;
    }>;
  };
}

class RepositoryAnalyticsService {
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
   * Get comprehensive repository metrics
   */
  async getRepositoryMetrics(
    accountId: string,
    repoName: string,
    timeRange: "7d" | "30d" | "90d" | "1y" = "30d"
  ): Promise<RepositoryMetrics> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const owner = account.username;
      const since = this.getDateFromRange(timeRange);

      // Get repository stats
      const [
        { data: repo },
        { data: branches },
        { data: contributors },
        { data: commits },
        { data: pullRequests },
        { data: issues },
      ] = await Promise.all([
        octokit.rest.repos.get({ owner, repo: repoName }),
        octokit.rest.repos.listBranches({
          owner,
          repo: repoName,
          per_page: 100,
        }),
        octokit.rest.repos.listContributors({
          owner,
          repo: repoName,
          per_page: 100,
        }),
        octokit.rest.repos.listCommits({
          owner,
          repo: repoName,
          since,
          per_page: 100,
        }),
        octokit.rest.pulls.list({
          owner,
          repo: repoName,
          state: "all",
          per_page: 100,
        }),
        octokit.rest.issues.listForRepo({
          owner,
          repo: repoName,
          state: "all",
          per_page: 100,
        }),
      ]);

      // Process activity data
      const commitsPerDay = this.groupByDay(commits, "commit.author.date");
      const pullRequestsPerDay = this.groupPullRequestsByDay(
        pullRequests,
        "created_at"
      );
      const issuesPerDay = this.groupIssuesByDay(
        issues.filter((i) => !i.pull_request),
        "created_at"
      );

      // Calculate contributor activity
      const contributorActivity = await this.getContributorActivity(
        octokit,
        owner,
        repoName,
        since
      );

      // Get workflow runs for performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(
        octokit,
        owner,
        repoName,
        timeRange
      );

      // Get collaboration metrics
      const collaborationMetrics = await this.getCollaborationMetrics(
        octokit,
        owner,
        repoName,
        pullRequests
      );

      return {
        overview: {
          totalCommits: commits.length,
          totalContributors: contributors.length,
          totalBranches: branches.length,
          totalPullRequests: pullRequests.length,
          totalIssues: issues.filter((i) => !i.pull_request).length,
          codeQuality: {
            linesOfCode: await this.estimateCodeLines(octokit, owner, repoName),
            technicalDebt: Math.floor(Math.random() * 100), // Placeholder
            coverage: Math.floor(Math.random() * 100), // Placeholder
          },
        },
        activity: {
          commitsPerDay,
          pullRequestsPerDay,
          issuesPerDay,
          contributorActivity,
        },
        performance: performanceMetrics,
        collaboration: collaborationMetrics,
      };
    } catch (error: any) {
      console.error("Error getting repository metrics:", error);
      throw new Error(error.message || "Failed to get repository metrics");
    }
  }

  /**
   * Generate code quality report
   */
  async generateCodeQualityReport(
    accountId: string,
    repoName: string
  ): Promise<CodeQualityReport> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const owner = account.username;

      // Get repository contents
      const { data: contents } = await octokit.rest.repos.getContent({
        owner,
        repo: repoName,
        path: "",
      });

      const files = await this.analyzeCodeFiles(
        octokit,
        owner,
        repoName,
        contents
      );

      // Calculate overall metrics
      const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
      const avgComplexity =
        files.reduce((sum, file) => sum + file.complexity, 0) / files.length;
      const totalIssues = files.reduce(
        (sum, file) => sum + file.issues.length,
        0
      );

      const rating = this.calculateQualityRating(
        avgComplexity,
        totalIssues,
        totalLines
      );

      return {
        files,
        overall: {
          rating,
          technicalDebt: Math.floor(avgComplexity * 10),
          coverage: 75 + Math.floor(Math.random() * 20), // Placeholder
          duplicatedLines: Math.floor(totalLines * 0.05),
          bugs: files.reduce(
            (sum, file) =>
              sum + file.issues.filter((i: any) => i.type === "bug").length,
            0
          ),
          vulnerabilities: files.reduce(
            (sum, file) =>
              sum +
              file.issues.filter((i: any) => i.type === "vulnerability").length,
            0
          ),
          codeSmells: files.reduce(
            (sum, file) =>
              sum +
              file.issues.filter((i: any) => i.type === "code_smell").length,
            0
          ),
        },
        trends: this.generateQualityTrends(),
      };
    } catch (error: any) {
      console.error("Error generating code quality report:", error);
      throw new Error(
        error.message || "Failed to generate code quality report"
      );
    }
  }

  /**
   * Perform security analysis
   */
  async performSecurityAnalysis(
    accountId: string,
    repoName: string
  ): Promise<SecurityAnalysis> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const owner = account.username;

      // Get security alerts
      const vulnerabilities = await this.getSecurityVulnerabilities(
        octokit,
        owner,
        repoName
      );

      // Analyze dependencies
      const dependencies = await this.analyzeDependencies(
        octokit,
        owner,
        repoName
      );

      // Scan for secrets
      const secrets = await this.scanForSecrets(octokit, owner, repoName);

      // Generate compliance score
      const compliance = this.generateComplianceReport(
        vulnerabilities,
        dependencies,
        secrets
      );

      return {
        vulnerabilities,
        dependencies,
        secrets,
        compliance,
      };
    } catch (error: any) {
      console.error("Error performing security analysis:", error);
      throw new Error(error.message || "Failed to perform security analysis");
    }
  }

  // Helper methods
  private getDateFromRange(range: string): string {
    const now = new Date();
    const days =
      {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      }[range] || 30;

    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return since.toISOString();
  }

  private groupByDay(
    items: any[],
    dateField: string
  ): Array<{ date: string; commits: number }> {
    const groups: { [key: string]: number } = {};

    items.forEach((item) => {
      const date = this.getNestedProperty(item, dateField);
      if (date) {
        const day = new Date(date).toISOString().split("T")[0];
        groups[day] = (groups[day] || 0) + 1;
      }
    });

    return Object.entries(groups).map(([date, commits]) => ({ date, commits }));
  }

  private groupPullRequestsByDay(
    items: any[],
    dateField: string
  ): Array<{ date: string; pullRequests: number }> {
    const groups: { [key: string]: number } = {};

    items.forEach((item) => {
      const date = this.getNestedProperty(item, dateField);
      if (date) {
        const day = new Date(date).toISOString().split("T")[0];
        groups[day] = (groups[day] || 0) + 1;
      }
    });

    return Object.entries(groups).map(([date, pullRequests]) => ({
      date,
      pullRequests,
    }));
  }

  private groupIssuesByDay(
    items: any[],
    dateField: string
  ): Array<{ date: string; issues: number }> {
    const groups: { [key: string]: number } = {};

    items.forEach((item) => {
      const date = this.getNestedProperty(item, dateField);
      if (date) {
        const day = new Date(date).toISOString().split("T")[0];
        groups[day] = (groups[day] || 0) + 1;
      }
    });

    return Object.entries(groups).map(([date, issues]) => ({ date, issues }));
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private async getContributorActivity(
    octokit: Octokit,
    owner: string,
    repo: string,
    since: string
  ): Promise<
    Array<{
      author: string;
      commits: number;
      additions: number;
      deletions: number;
    }>
  > {
    try {
      const { data: stats } = await octokit.rest.repos.getContributorsStats({
        owner,
        repo,
      });

      return (stats || []).map((stat) => ({
        author: stat.author?.login || "Unknown",
        commits: stat.total,
        additions:
          stat.weeks?.reduce((sum, week) => sum + (week.a || 0), 0) || 0,
        deletions:
          stat.weeks?.reduce((sum, week) => sum + (week.d || 0), 0) || 0,
      }));
    } catch (error) {
      return [];
    }
  }

  private async getPerformanceMetrics(
    octokit: Octokit,
    owner: string,
    repo: string,
    timeRange: string
  ): Promise<any> {
    // Placeholder implementation
    return {
      buildTimes: [],
      deploymentFrequency: [],
      leadTime: [],
      failureRate: 5,
      recoveryTime: 2.5,
    };
  }

  private async getCollaborationMetrics(
    octokit: Octokit,
    owner: string,
    repo: string,
    pullRequests: any[]
  ): Promise<any> {
    const reviewTimes = pullRequests
      .filter((pr) => pr.merged_at && pr.created_at)
      .map((pr) => ({
        pr: pr.number,
        hours:
          (new Date(pr.merged_at).getTime() -
            new Date(pr.created_at).getTime()) /
          (1000 * 60 * 60),
      }));

    return {
      reviewTimes: reviewTimes.slice(0, 20),
      approvalRates: [],
      teamVelocity: [],
    };
  }

  private async estimateCodeLines(
    octokit: Octokit,
    owner: string,
    repo: string
  ): Promise<number> {
    try {
      const { data: languages } = await octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      // Rough estimation based on language bytes
      const totalBytes = Object.values(languages).reduce(
        (sum: number, bytes: any) => sum + bytes,
        0
      );
      return Math.floor(totalBytes / 50); // Rough estimation: 50 bytes per line
    } catch (error) {
      return 0;
    }
  }

  private async analyzeCodeFiles(
    octokit: Octokit,
    owner: string,
    repo: string,
    contents: any
  ): Promise<any[]> {
    // Simplified code analysis
    const files = Array.isArray(contents)
      ? contents.filter((item) => item.type === "file")
      : [];

    return files.slice(0, 10).map((file) => ({
      path: file.path,
      language: this.getLanguageFromExtension(file.name),
      lines: Math.floor(Math.random() * 500) + 50,
      complexity: Math.floor(Math.random() * 10) + 1,
      maintainability: Math.floor(Math.random() * 100),
      issues: this.generateMockIssues(),
    }));
  }

  private getLanguageFromExtension(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const languages: { [key: string]: string } = {
      js: "JavaScript",
      ts: "TypeScript",
      py: "Python",
      java: "Java",
      cpp: "C++",
      c: "C",
      go: "Go",
      rs: "Rust",
    };
    return languages[ext || ""] || "Unknown";
  }

  private generateMockIssues(): Array<any> {
    const issues = [];
    const issueCount = Math.floor(Math.random() * 5);

    for (let i = 0; i < issueCount; i++) {
      issues.push({
        type: ["bug", "vulnerability", "code_smell"][
          Math.floor(Math.random() * 3)
        ],
        severity: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
        message: "Sample issue message",
        line: Math.floor(Math.random() * 100) + 1,
      });
    }

    return issues;
  }

  private calculateQualityRating(
    complexity: number,
    issues: number,
    lines: number
  ): "A" | "B" | "C" | "D" | "E" {
    const score = (complexity * 10 + issues * 5) / (lines / 100);

    if (score < 2) return "A";
    if (score < 4) return "B";
    if (score < 6) return "C";
    if (score < 8) return "D";
    return "E";
  }

  private generateQualityTrends(): Array<any> {
    const trends = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split("T")[0],
        rating: ["A", "B", "C"][Math.floor(Math.random() * 3)],
        technicalDebt: Math.floor(Math.random() * 50) + 10,
        coverage: Math.floor(Math.random() * 20) + 70,
      });
    }

    return trends;
  }

  private async getSecurityVulnerabilities(
    octokit: Octokit,
    owner: string,
    repo: string
  ): Promise<any[]> {
    try {
      const { data: alerts } =
        await octokit.rest.secretScanning.listAlertsForRepo({
          owner,
          repo,
        });

      return alerts.slice(0, 10).map((alert) => ({
        id: alert.number?.toString() || "unknown",
        severity: "medium" as const,
        type: alert.secret_type || "secret",
        description: `Secret detected: ${alert.secret_type}`,
        file: "unknown",
        line: 0,
        recommendation: "Remove or rotate the secret",
        status: alert.state || "open",
      }));
    } catch (error) {
      return [];
    }
  }

  private async analyzeDependencies(
    octokit: Octokit,
    owner: string,
    repo: string
  ): Promise<any[]> {
    // Mock implementation
    return [
      {
        name: "lodash",
        version: "4.17.20",
        vulnerabilities: 0,
        license: "MIT",
        outdated: false,
      },
      {
        name: "express",
        version: "4.18.0",
        vulnerabilities: 0,
        license: "MIT",
        outdated: true,
      },
    ];
  }

  private async scanForSecrets(
    octokit: Octokit,
    owner: string,
    repo: string
  ): Promise<any[]> {
    // Mock implementation
    return [
      {
        type: "API Key",
        file: "config/keys.js",
        line: 15,
        masked: "sk_live_*********************",
        severity: "high",
      },
    ];
  }

  private generateComplianceReport(
    vulnerabilities: any[],
    dependencies: any[],
    secrets: any[]
  ): any {
    const totalIssues = vulnerabilities.length + secrets.length;
    const score = Math.max(0, 100 - totalIssues * 10);

    return {
      score,
      checks: [
        {
          name: "No high-severity vulnerabilities",
          status:
            vulnerabilities.filter((v) => v.severity === "high").length === 0
              ? "pass"
              : "fail",
          description:
            "Repository should not contain high-severity vulnerabilities",
        },
        {
          name: "Dependencies up to date",
          status:
            dependencies.filter((d) => d.outdated).length === 0
              ? "pass"
              : "warning",
          description: "All dependencies should be up to date",
        },
        {
          name: "No exposed secrets",
          status: secrets.length === 0 ? "pass" : "fail",
          description: "Repository should not contain exposed secrets",
        },
      ],
    };
  }
}

export const repositoryAnalyticsService = new RepositoryAnalyticsService();
