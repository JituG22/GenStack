import React, { useState, useEffect } from "react";
import {
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface WorkflowTemplate {
  name: string;
  description: string;
  fileName: string;
  content: string;
  category: "ci" | "deployment" | "testing" | "security" | "utility";
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_number: number;
}

interface WorkflowFile {
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

interface GitHubActionsManagerProps {
  accountId: string;
  repoName: string;
}

const API_BASE_URL = "/api";

export const GitHubActionsManager: React.FC<GitHubActionsManagerProps> = ({
  accountId,
  repoName,
}) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowFile[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "templates" | "workflows" | "runs"
  >("workflows");
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadWorkflows();
    loadWorkflowRuns();
  }, [accountId, repoName]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/github-actions/templates`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data.templates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/github-actions/workflows/${repoName}?accountId=${accountId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.data.workflows);
      }
    } catch (error) {
      console.error("Error loading workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowRuns = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/github-actions/runs/${repoName}?accountId=${accountId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWorkflowRuns(data.data.runs);
      }
    } catch (error) {
      console.error("Error loading workflow runs:", error);
    }
  };

  const createWorkflow = async (template: WorkflowTemplate) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/github-actions/workflows`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accountId,
          repoName,
          templateName: template.name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Workflow "${template.name}" created successfully!`);
        loadWorkflows();
        setShowTemplateModal(false);
      } else {
        alert(`Failed to create workflow: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error creating workflow:", error);
      alert(`Error creating workflow: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerWorkflow = async (workflowId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/github-actions/trigger`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accountId,
          repoName,
          workflowId: workflowId.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Workflow triggered successfully!");
        loadWorkflowRuns();
      } else {
        alert(`Failed to trigger workflow: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error triggering workflow:", error);
      alert(`Error triggering workflow: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelWorkflowRun = async (runId: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/github-actions/cancel/${runId}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            accountId,
            repoName,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Workflow run cancelled successfully!");
        loadWorkflowRuns();
      } else {
        alert(`Failed to cancel workflow run: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error cancelling workflow run:", error);
      alert(`Error cancelling workflow run: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === "in_progress") {
      return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
    if (conclusion === "success") {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    if (conclusion === "failure" || conclusion === "cancelled") {
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    }
    return <ClockIcon className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = (status: string, conclusion: string | null) => {
    if (status === "in_progress") return "bg-yellow-100 text-yellow-800";
    if (conclusion === "success") return "bg-green-100 text-green-800";
    if (conclusion === "failure") return "bg-red-100 text-red-800";
    if (conclusion === "cancelled") return "bg-gray-100 text-gray-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      ci: "bg-blue-100 text-blue-800",
      deployment: "bg-purple-100 text-purple-800",
      testing: "bg-green-100 text-green-800",
      security: "bg-red-100 text-red-800",
      utility: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.utility;
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PlayIcon className="w-5 h-5 mr-2 text-indigo-600" />
          GitHub Actions - {repoName}
        </h3>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {["workflows", "runs", "templates"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
                {tab === "workflows" && workflows.length > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {workflows.length}
                  </span>
                )}
                {tab === "runs" && workflowRuns.length > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {workflowRuns.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Workflows Tab */}
        {activeTab === "workflows" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Active Workflows
              </h4>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                disabled={loading}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Workflow
              </button>
            </div>

            {workflows.length > 0 ? (
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {workflow.name}
                        </h5>
                        <p className="text-sm text-gray-500">{workflow.path}</p>
                        <p className="text-xs text-gray-400">
                          Created: {formatDate(workflow.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            workflow.state === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {workflow.state}
                        </span>
                        <button
                          onClick={() => triggerWorkflow(workflow.id)}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                          disabled={loading || workflow.state !== "active"}
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Run
                        </button>
                        <a
                          href={workflow.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1 text-gray-600 text-sm rounded hover:text-gray-800"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No workflows found
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first workflow from our templates.
                </p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Workflow
                </button>
              </div>
            )}
          </div>
        )}

        {/* Workflow Runs Tab */}
        {activeTab === "runs" && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Recent Workflow Runs
            </h4>

            {workflowRuns.length > 0 ? (
              <div className="space-y-3">
                {workflowRuns.map((run) => (
                  <div
                    key={run.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(run.status, run.conclusion)}
                        <div className="ml-3">
                          <h5 className="font-medium text-gray-900">
                            {run.name} #{run.run_number}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {formatDate(run.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            run.status,
                            run.conclusion
                          )}`}
                        >
                          {run.conclusion || run.status}
                        </span>
                        {run.status === "in_progress" && (
                          <button
                            onClick={() => cancelWorkflowRun(run.id)}
                            className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                            disabled={loading}
                          >
                            <StopIcon className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        )}
                        <a
                          href={run.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1 text-gray-600 text-sm rounded hover:text-gray-800"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No workflow runs
                </h3>
                <p className="text-gray-600">
                  Workflow runs will appear here once you trigger workflows.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Workflow Templates
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {template.name}
                      </h5>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(
                          template.category
                        )}`}
                      >
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  <button
                    onClick={() => createWorkflow(template)}
                    className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:bg-gray-400"
                    disabled={loading}
                  >
                    Create Workflow
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Select Workflow Template
                </h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.name}
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      createWorkflow(template);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {template.description}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          template.category
                        )}`}
                      >
                        {template.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
