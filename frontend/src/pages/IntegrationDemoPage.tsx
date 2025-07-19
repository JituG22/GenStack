import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RocketLaunchIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import GitHubIntegrationStatus from "../components/GitHubIntegrationStatus";
import { ProjectForm } from "../components/ProjectForm";

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

export const IntegrationDemoPage: React.FC = () => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateProject = async (
    projectData: ProjectFormData
  ): Promise<void> => {
    try {
      setCreating(true);
      setSuccessMessage(null);

      // Simulate project creation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setShowProjectForm(false);
      setSuccessMessage(
        `Project "${projectData.name}" created successfully!${
          projectData.enableGitHub
            ? ` GitHub repository "${projectData.githubConfig.repositoryName}" has been created.`
            : ""
        }`
      );
    } catch (error: any) {
      console.error("Error creating project:", error);
      throw new Error(error.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleFormCancel = () => {
    setShowProjectForm(false);
  };

  const integrationSteps = [
    {
      id: 1,
      title: "Configure GitHub Accounts",
      description:
        "Add and manage your GitHub accounts with proper permissions",
      icon: Cog6ToothIcon,
      link: "/github-config",
      completed: true,
    },
    {
      id: 2,
      title: "Project Creation Integration",
      description: "Enhanced project creation with GitHub account selection",
      icon: RocketLaunchIcon,
      link: "#",
      completed: true,
    },
    {
      id: 3,
      title: "Repository Management",
      description: "Automatic repository creation and synchronization",
      icon: DocumentTextIcon,
      link: "#",
      completed: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              GitHub Configuration Module Integration
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Complete integration of GitHub account management with project
              creation workflow
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Integration Steps */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Integration Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrationSteps.map((step) => (
              <div
                key={step.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div
                    className={`flex-shrink-0 p-3 rounded-md ${
                      step.completed ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <step.icon
                      className={`w-6 h-6 ${
                        step.completed ? "text-green-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {step.title}
                    </h3>
                    {step.completed && (
                      <div className="flex items-center mt-1">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">
                          Completed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">{step.description}</p>
                {step.link !== "#" && (
                  <div className="mt-4">
                    <Link
                      to={step.link}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Configure →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Integration Status */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            GitHub Integration Status
          </h2>
          <GitHubIntegrationStatus />
        </div>

        {/* Demo: Enhanced Project Creation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Enhanced Project Creation Demo
              </h2>
              <p className="mt-1 text-gray-600">
                Experience the integrated GitHub account selection in project
                creation
              </p>
            </div>
            <button
              onClick={() => setShowProjectForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RocketLaunchIcon className="w-4 h-4 mr-2" />
              Create Demo Project
            </button>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Enhanced Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  GitHub account selection during project creation
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Real-time permission validation
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Automatic repository naming and configuration
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Private/public repository options
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Auto-sync configuration
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Integration Benefits
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Unified account management experience
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Seamless project-to-repository mapping
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Enterprise-ready multi-account support
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Enhanced security with token validation
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Comprehensive error handling and feedback
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Next Phase: Repository Management
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              The integration is now complete! Here are the next steps for the
              repository management phase:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Real-time repository synchronization</li>
              <li>Branch management integration</li>
              <li>File push/pull capabilities</li>
              <li>GitHub Actions integration</li>
              <li>Collaborative development features</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Project Creation Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold text-gray-900">
                Create Demo Project with GitHub Integration
              </h2>
            </div>
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

export default IntegrationDemoPage;
