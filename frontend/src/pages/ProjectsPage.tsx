import React, { useState, useEffect } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useLocation, useNavigate } from "react-router-dom";
import { projectsApi, githubProjectsApi } from "../lib/api";
import {
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
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
  };
}

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    enableGitHub: false,
    isPublic: true, // Default to public repository (private checkbox unchecked)
    githubConfig: {
      repositoryName: "",
      autoSync: true,
      createReadme: true,
    },
  });
  const [showForm, setShowForm] = useState(false);
  const [githubHealthy, setGithubHealthy] = useState(false);
  const { isConnected } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    checkGitHubHealth();
  }, []);

  useEffect(() => {
    // Initialize filtered projects with all projects
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

  const resetProjectForm = () => {
    setNewProject({
      name: "",
      description: "",
      enableGitHub: false,
      isPublic: true, // Default to public repository (private checkbox unchecked)
      githubConfig: {
        repositoryName: "",
        autoSync: true,
        createReadme: true,
      },
    });
  };

  const handleFilterChange = (filteredData: Project[]) => {
    setFilteredProjects(filteredData);
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      // Use GitHub-enabled API if GitHub is enabled, otherwise use regular API
      if (newProject.enableGitHub) {
        await githubProjectsApi.createProjectWithGitHub(newProject);
      } else {
        await projectsApi.createProject(newProject);
      }

      // Clear form and close modal first
      resetProjectForm();
      setShowForm(false);

      // If we came from /projects/new, navigate back to /projects
      if (location.pathname === "/projects/new") {
        navigate("/projects");
      }

      // Re-fetch the entire projects list to ensure consistency
      await fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    // First, get the project details to check if it has GitHub integration
    const project = projects.find((p) => p.id === id);

    let confirmMessage = "Are you sure you want to delete this project?";

    if (project?.github?.enabled) {
      confirmMessage = `Are you sure you want to delete this project?\n\nThis will also delete the GitHub repository: ${project.github.repoName}\n\nThis action cannot be undone.`;
    }

    if (!confirm(confirmMessage)) return;

    try {
      if (project?.github?.enabled) {
        // Project has GitHub integration - use GitHub-enabled delete API
        console.log(
          `Deleting project with GitHub integration: ${project.name}`
        );
        await githubProjectsApi.deleteProjectWithGitHub(id);
      } else {
        // Regular project - use standard delete API
        await projectsApi.deleteProject(id);
      }

      // Re-fetch the entire projects list to ensure consistency
      await fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      // Show user-friendly error message
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Manage your projects and collaborate in real-time
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Connection status */}
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

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Create Project Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Project
              </h3>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Enter project description"
                  />
                </div>

                {/* GitHub Integration Options */}
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      GitHub Integration
                    </h4>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        githubHealthy
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {githubHealthy ? "✓ Available" : "✗ Unavailable"}
                    </div>
                  </div>

                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="enableGitHub"
                      checked={newProject.enableGitHub}
                      disabled={!githubHealthy}
                      onChange={(e) =>
                        setNewProject((prev) => ({
                          ...prev,
                          enableGitHub: e.target.checked,
                          githubConfig: {
                            ...prev.githubConfig,
                            repositoryName: e.target.checked
                              ? prev.name.toLowerCase().replace(/\s+/g, "-")
                              : "",
                          },
                        }))
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="enableGitHub"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Create GitHub repository
                    </label>
                  </div>

                  {newProject.enableGitHub && (
                    <div className="space-y-3 pl-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Repository Name
                        </label>
                        <input
                          type="text"
                          value={newProject.githubConfig.repositoryName}
                          onChange={(e) =>
                            setNewProject((prev) => ({
                              ...prev,
                              githubConfig: {
                                ...prev.githubConfig,
                                repositoryName: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="repository-name"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPrivate"
                          checked={!newProject.isPublic}
                          onChange={(e) =>
                            setNewProject((prev) => ({
                              ...prev,
                              isPublic: !e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="isPrivate"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Private repository
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="createReadme"
                          checked={newProject.githubConfig.createReadme}
                          onChange={(e) =>
                            setNewProject((prev) => ({
                              ...prev,
                              githubConfig: {
                                ...prev.githubConfig,
                                createReadme: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="createReadme"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Initialize with README
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="autoSync"
                          checked={newProject.githubConfig.autoSync}
                          onChange={(e) =>
                            setNewProject((prev) => ({
                              ...prev,
                              githubConfig: {
                                ...prev.githubConfig,
                                autoSync: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="autoSync"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Auto-sync changes
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetProjectForm();
                      // If we came from /projects/new, navigate back to /projects
                      if (location.pathname === "/projects/new") {
                        navigate("/projects");
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {newProject.enableGitHub
                      ? "Create Project & Repository"
                      : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter */}
      <AdvancedFilter onFilterChange={handleFilterChange} className="mb-6" />

      {/* Projects List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No projects found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {projects.length === 0
                ? "Get started by creating a new project."
                : "Try adjusting your filters or create a new project."}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <li key={project.id}>
                <div
                  className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 hover:shadow-md cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-indigo-500"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                          {project.name}
                        </h3>
                        {project.github?.enabled && (
                          <div className="flex items-center space-x-1">
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
                              GitHub
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent click
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
                      <p className="mt-1 text-sm text-gray-600">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>
                        Created:{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Updated:{" "}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
