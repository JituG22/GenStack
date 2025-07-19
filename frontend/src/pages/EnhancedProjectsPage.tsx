import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ProjectForm } from "../components/ProjectForm";
import { useWebSocket } from "../contexts/WebSocketContext";
import { projectsApi, githubProjectsApi } from "../lib/api";
import { enhancedGitHubProjectsService } from "../services/enhancedGitHubProjectsService";
import {
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AdvancedFilter } from "../components/AdvancedFilter";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  github?: {
    enabled: boolean;
    repoName?: string;
    repoUrl?: string;
    syncStatus?: string;
    accountId?: string;
  };
}

interface ProjectFormData {
  name: string;
  description: string;
  enableGitHub: boolean;
  selectedGitHubAccountId?: string;
  githubConfig: {
    repositoryName: string;
    isPrivate: boolean;
    autoSync: boolean;
    createReadme: boolean;
    gitignoreTemplate?: string;
    license?: string;
  };
}

export const EnhancedProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [githubHealthy, setGithubHealthy] = useState(false);

  const { isConnected } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    checkGitHubHealth();
  }, []);

  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  // Auto-open create modal if URL is /projects/new
  useEffect(() => {
    if (location.pathname === "/projects/new") {
      setShowForm(true);
    }
  }, [location.pathname]);

  const checkGitHubHealth = async () => {
    try {
      const response = await githubProjectsApi.getHealth();
      setGithubHealthy(response.success && response.config.ready);
    } catch (error) {
      setGithubHealthy(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getProjects();
      setProjects(response.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (
    projectData: ProjectFormData
  ): Promise<void> => {
    try {
      setCreating(true);

      if (projectData.enableGitHub && projectData.selectedGitHubAccountId) {
        // Use enhanced GitHub creation with account selection
        const enhancedProjectData = {
          name: projectData.name,
          description: projectData.description,
          github: {
            enabled: true,
            accountId: projectData.selectedGitHubAccountId,
            repositoryName: projectData.githubConfig.repositoryName,
            isPrivate: projectData.githubConfig.isPrivate,
            autoSync: projectData.githubConfig.autoSync,
            createReadme: projectData.githubConfig.createReadme,
            gitignoreTemplate: projectData.githubConfig.gitignoreTemplate,
            license: projectData.githubConfig.license,
          },
        };

        await enhancedGitHubProjectsService.createProjectWithGitHub(
          enhancedProjectData
        );
      } else {
        // Regular project creation
        await projectsApi.createProject({
          name: projectData.name,
          description: projectData.description,
        });
      }

      // Close form and refresh projects
      setShowForm(false);
      if (location.pathname === "/projects/new") {
        navigate("/projects");
      }
      await fetchProjects();
    } catch (error: any) {
      console.error("Error creating project:", error);
      throw new Error(error.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    let confirmMessage = "Are you sure you want to delete this project?";

    if (project?.github?.enabled) {
      confirmMessage = `Are you sure you want to delete this project?\\n\\nThis will also delete the GitHub repository: ${project.github.repoName}\\n\\nThis action cannot be undone.`;
    }

    if (!confirm(confirmMessage)) return;

    try {
      if (project?.github?.enabled) {
        await githubProjectsApi.deleteProjectWithGitHub(id);
      } else {
        await projectsApi.deleteProject(id);
      }
      await fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleFilterChange = (filteredData: Project[]) => {
    setFilteredProjects(filteredData);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    if (location.pathname === "/projects/new") {
      navigate("/projects");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">
                Manage your projects with integrated GitHub repositories
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* GitHub Health Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    githubHealthy ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  GitHub {githubHealthy ? "Ready" : "Limited"}
                </span>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filter */}
        <div className="mb-6">
          <AdvancedFilter
            onFilterChange={handleFilterChange}
            className="bg-white"
          />
        </div>

        {/* Projects List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <PlusIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No projects found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {projects.length === 0
                  ? "Get started by creating your first project with optional GitHub integration."
                  : "Try adjusting your filters or create a new project."}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <li key={project.id}>
                  <div
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-indigo-500"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate">
                            {project.name}
                          </h3>
                          {project.github?.enabled && (
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-gray-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {project.github.syncStatus === "synced"
                                  ? "Synced"
                                  : "GitHub"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            title="Delete project"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {project.description && (
                        <p className="mt-1 text-sm text-gray-600 truncate">
                          {project.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>
                          Created:{" "}
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          Updated:{" "}
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                        {project.github?.repoUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={project.github.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-600 hover:text-indigo-500 font-medium"
                            >
                              View Repository
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Enhanced Project Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Project
                </h2>
                <button
                  onClick={handleFormCancel}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
                  disabled={creating}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              <ProjectForm
                onSubmit={handleCreateProject}
                onCancel={handleFormCancel}
                loading={creating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProjectsPage;
