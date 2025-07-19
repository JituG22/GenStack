import React, { useState, useEffect } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useLocation, useNavigate } from "react-router-dom";
import { projectsApi } from "../lib/api";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AdvancedFilter } from "../components/AdvancedFilter";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const { isConnected } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
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
      const response = await projectsApi.createProject(newProject);
      setProjects((prev) => [response.data, ...prev]);
      setNewProject({ name: "", description: "" });
      setShowForm(false);

      // If we came from /projects/new, navigate back to /projects
      if (location.pathname === "/projects/new") {
        navigate("/projects");
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await projectsApi.deleteProject(id);
      setProjects((prev) => prev.filter((project) => project.id !== id));
    } catch (error) {
      console.error("Error deleting project:", error);
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                <div className="mb-6">
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
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setNewProject({ name: "", description: "" });
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
                    Create Project
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
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <div className="ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
