import { Octokit } from "@octokit/rest";
import { GitHubAccount } from "../models/GitHubAccount";
import { Project } from "../models/Project-simple";
import { decrypt } from "../utils/encryption";

export interface WorkflowTemplate {
  name: string;
  description: string;
  fileName: string;
  content: string;
  category: "ci" | "deployment" | "testing" | "security" | "utility";
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_number: number;
}

export interface WorkflowFile {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

export class GitHubActionsService {
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
   * Get predefined workflow templates for different use cases
   */
  getWorkflowTemplates(): WorkflowTemplate[] {
    return [
      {
        name: "Node.js CI/CD",
        description:
          "Continuous integration and deployment for Node.js applications",
        fileName: "nodejs-ci.yml",
        category: "ci",
        content: `name: Node.js CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linter
      run: npm run lint
    
    - name: Build project
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment commands here`,
      },
      {
        name: "React Build & Deploy",
        description: "Build and deploy React applications to GitHub Pages",
        fileName: "react-deploy.yml",
        category: "deployment",
        content: `name: Build and Deploy React App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build`,
      },
      {
        name: "Code Quality & Security",
        description: "Code quality checks and security scanning",
        fileName: "code-quality.yml",
        category: "security",
        content: `name: Code Quality & Security

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: ESLint
      run: npm run lint
    
    - name: Prettier
      run: npm run format:check
    
    - name: TypeScript Check
      run: npm run type-check
    
    - name: Security Audit
      run: npm audit --audit-level=moderate
    
    - name: CodeQL Analysis
      uses: github/codeql-action/init@v2
      with:
        languages: javascript
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2`,
      },
      {
        name: "Automated Testing Suite",
        description:
          "Comprehensive testing with unit, integration, and e2e tests",
        fileName: "testing-suite.yml",
        category: "testing",
        content: `name: Automated Testing Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/`,
      },
      {
        name: "Dependency Updates",
        description: "Automated dependency updates and security patches",
        fileName: "dependency-updates.yml",
        category: "utility",
        content: `name: Dependency Updates

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  workflow_dispatch:

jobs:
  update-dependencies:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        token: \${{ secrets.GITHUB_TOKEN }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Update dependencies
      run: |
        npm update
        npm audit fix --force
    
    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v5
      with:
        token: \${{ secrets.GITHUB_TOKEN }}
        commit-message: 'chore: update dependencies'
        title: 'Automated dependency updates'
        body: |
          Automated dependency updates
          
          - Updated npm packages to latest versions
          - Applied security fixes
        branch: automated-dependency-updates
        delete-branch: true`,
      },
    ];
  }

  /**
   * Create a workflow file in the repository
   */
  async createWorkflow(
    accountId: string,
    repoName: string,
    workflowTemplate: WorkflowTemplate,
    branch: string = "main"
  ): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const owner = account.username;
      const path = `.github/workflows/${workflowTemplate.fileName}`;

      // Check if workflow already exists
      try {
        await octokit.rest.repos.getContent({
          owner,
          repo: repoName,
          path,
          ref: branch,
        });

        return {
          success: false,
          message: `Workflow file ${workflowTemplate.fileName} already exists`,
        };
      } catch (error: any) {
        // File doesn't exist, we can create it
        if (error.status !== 404) {
          throw error;
        }
      }

      // Create the workflow file
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path,
        message: `Add ${workflowTemplate.name} workflow`,
        content: Buffer.from(workflowTemplate.content).toString("base64"),
        branch,
      });

      return {
        success: true,
        message: `Workflow "${workflowTemplate.name}" created successfully`,
        url: data.content?.html_url,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create workflow: ${error.message}`,
      };
    }
  }

  /**
   * Get workflow runs for a repository
   */
  async getWorkflowRuns(
    accountId: string,
    repoName: string,
    workflowId?: string | number
  ): Promise<WorkflowRun[]> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      let runs;
      if (workflowId) {
        const response = await octokit.rest.actions.listWorkflowRuns({
          owner: account.username,
          repo: repoName,
          workflow_id: workflowId,
          per_page: 20,
        });
        runs = response.data.workflow_runs;
      } else {
        const response = await octokit.rest.actions.listWorkflowRunsForRepo({
          owner: account.username,
          repo: repoName,
          per_page: 20,
        });
        runs = response.data.workflow_runs;
      }

      return runs.map((run: any) => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
        run_number: run.run_number,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get workflow runs: ${error.message}`);
    }
  }

  /**
   * Get workflows for a repository
   */
  async getWorkflows(
    accountId: string,
    repoName: string
  ): Promise<WorkflowFile[]> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const { data } = await octokit.rest.actions.listRepoWorkflows({
        owner: account.username,
        repo: repoName,
      });

      return data.workflows.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        url: workflow.url,
        html_url: workflow.html_url,
        badge_url: workflow.badge_url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get workflows: ${error.message}`);
    }
  }

  /**
   * Trigger a workflow run
   */
  async triggerWorkflow(
    accountId: string,
    repoName: string,
    workflowId: string | number,
    ref: string = "main",
    inputs: Record<string, any> = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      await octokit.rest.actions.createWorkflowDispatch({
        owner: account.username,
        repo: repoName,
        workflow_id: workflowId,
        ref,
        inputs,
      });

      return {
        success: true,
        message: "Workflow triggered successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to trigger workflow: ${error.message}`,
      };
    }
  }

  /**
   * Cancel a workflow run
   */
  async cancelWorkflowRun(
    accountId: string,
    repoName: string,
    runId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      await octokit.rest.actions.cancelWorkflowRun({
        owner: account.username,
        repo: repoName,
        run_id: runId,
      });

      return {
        success: true,
        message: "Workflow run cancelled successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to cancel workflow run: ${error.message}`,
      };
    }
  }

  /**
   * Get workflow run logs
   */
  async getWorkflowRunLogs(
    accountId: string,
    repoName: string,
    runId: number
  ): Promise<string> {
    try {
      const octokit = await this.getOctokit(accountId);
      const account = await GitHubAccount.findById(accountId);

      if (!account) {
        throw new Error("GitHub account not found");
      }

      const { data } = await octokit.rest.actions.downloadWorkflowRunLogs({
        owner: account.username,
        repo: repoName,
        run_id: runId,
      });

      // The response is a zip file buffer, for now return a placeholder
      return "Workflow logs downloaded successfully. View in GitHub Actions.";
    } catch (error: any) {
      throw new Error(`Failed to get workflow run logs: ${error.message}`);
    }
  }

  /**
   * Clean up Octokit instances
   */
  clearCache(): void {
    this.octokitInstances.clear();
  }
}

export const gitHubActionsService = new GitHubActionsService();
