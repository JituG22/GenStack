export interface GitHubConfig {
  token: string;
  username: string;
  organization?: string;
  baseUrl?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  git_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: "public" | "private" | "internal";
  default_branch: string;
}

export interface CreateRepositoryRequest {
  name: string;
  description?: string;
  private?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
}

export interface UpdateRepositoryRequest {
  name?: string;
  description?: string;
  private?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  default_branch?: string;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  archived?: boolean;
}

export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

export interface GitHubApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: GitHubError;
  statusCode?: number;
}

export interface ProjectGitHubSync {
  projectId: string;
  githubRepoId?: number;
  githubRepoName?: string;
  githubRepoUrl?: string;
  lastSyncAt?: Date;
  syncStatus: "pending" | "synced" | "error" | "manual";
  syncErrors?: string[];
}
