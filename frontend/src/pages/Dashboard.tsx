import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../hooks/useProjects";
import {
  PlusIcon,
  DocumentIcon,
  CubeIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export function Dashboard() {
  const { user } = useAuth();
  const { projects, isLoading } = useProjects();

  const recentProjects = projects.slice(0, 5);

  const stats = [
    {
      name: "Total Projects",
      value: projects.length,
      icon: DocumentIcon,
      color: "bg-blue-500",
    },
    {
      name: "Total Nodes",
      value: projects.reduce((acc, project) => acc + project.nodeCount, 0),
      icon: CubeIcon,
      color: "bg-green-500",
    },
    {
      name: "Team Members",
      value: projects.reduce((acc, project) => acc + project.members.length, 0),
      icon: UserGroupIcon,
      color: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute ${stat.color} rounded-md p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/projects?action=create"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex-shrink-0">
              <PlusIcon className="h-10 w-10 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" />
              <p className="text-sm font-medium text-gray-900">
                Create New Project
              </p>
              <p className="text-sm text-gray-500">
                Start building with drag & drop nodes
              </p>
            </div>
          </Link>

          <Link
            to="/templates"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex-shrink-0">
              <CubeIcon className="h-10 w-10 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" />
              <p className="text-sm font-medium text-gray-900">
                Browse Templates
              </p>
              <p className="text-sm text-gray-500">
                Explore pre-built node templates
              </p>
            </div>
          </Link>

          <Link
            to="/projects"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex-shrink-0">
              <DocumentIcon className="h-10 w-10 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" />
              <p className="text-sm font-medium text-gray-900">
                View All Projects
              </p>
              <p className="text-sm text-gray-500">
                Manage your existing projects
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
          <Link
            to="/projects"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No projects
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new project.
            </p>
            <div className="mt-6">
              <Link
                to="/projects?action=create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <DocumentIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {project.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.description || "No description"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{project.nodeCount} nodes</span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
