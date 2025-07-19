import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { projectsApi, nodesApi, templatesApi } from "../lib/api";
import DataTable from "../components/DataTable";
import {
  PlusIcon,
  DocumentIcon,
  CubeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "projects" | "nodes" | "templates"
  >("projects");

  // Projects data
  const projectsData = usePaginatedData(projectsApi.getProjects, {
    defaultLimit: 5,
    defaultSortBy: "updatedAt",
  });

  // Nodes data
  const nodesData = usePaginatedData(nodesApi.getNodes, {
    defaultLimit: 5,
    defaultSortBy: "createdAt",
  });

  // Templates data
  const templatesData = usePaginatedData(templatesApi.getTemplates, {
    defaultLimit: 5,
    defaultSortBy: "downloads",
  });

  // Action handlers
  const handleView = (item: any) => {
    switch (activeTab) {
      case "projects":
        navigate(`/projects/${item.id}`);
        break;
      case "nodes":
        navigate(`/nodes/${item.id}`);
        break;
      case "templates":
        navigate(`/templates/${item.id}`);
        break;
    }
  };

  const handleEdit = (item: any) => {
    switch (activeTab) {
      case "projects":
        navigate(`/projects/${item.id}/edit`);
        break;
      case "nodes":
        navigate(`/nodes/${item.id}/edit`);
        break;
      case "templates":
        navigate(`/templates/${item.id}/edit`);
        break;
    }
  };

  const handleDelete = async (item: any) => {
    if (
      !confirm(
        `Are you sure you want to delete this ${activeTab.slice(0, -1)}?`
      )
    ) {
      return;
    }

    try {
      switch (activeTab) {
        case "projects":
          await projectsApi.deleteProject(item.id);
          projectsData.refetch();
          break;
        case "nodes":
          await nodesApi.deleteNode(item.id);
          nodesData.refetch();
          break;
        case "templates":
          await templatesApi.deleteTemplate(item.id);
          templatesData.refetch();
          break;
      }
    } catch (error) {
      console.error(`Error deleting ${activeTab.slice(0, -1)}:`, error);
      alert(`Failed to delete ${activeTab.slice(0, -1)}. Please try again.`);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "projects":
        return projectsData;
      case "nodes":
        return nodesData;
      case "templates":
        return templatesData;
      default:
        return projectsData;
    }
  };

  const stats = [
    {
      name: "Total Projects",
      value: projectsData.pagination?.total || 0,
      icon: DocumentIcon,
      color: "bg-blue-500",
      change: "+12%",
      changeType: "increase" as const,
    },
    {
      name: "Total Nodes",
      value: nodesData.pagination?.total || 0,
      icon: CubeIcon,
      color: "bg-green-500",
      change: "+8%",
      changeType: "increase" as const,
    },
    {
      name: "Templates",
      value: templatesData.pagination?.total || 0,
      icon: UserGroupIcon,
      color: "bg-purple-500",
      change: "+23%",
      changeType: "increase" as const,
    },
  ];

  const projectColumns = [
    {
      key: "name",
      title: "Project Name",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <DocumentIcon className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{value}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : value === "completed"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdBy",
      title: "Created By",
      render: (value: any) =>
        value ? `${value.firstName} ${value.lastName}` : "Unknown",
    },
    {
      key: "updatedAt",
      title: "Last Updated",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const nodeColumns = [
    {
      key: "name",
      title: "Node Name",
      sortable: true,
      render: (value: string, item: any) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CubeIcon className="h-4 w-4 text-green-600" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{item.type}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      sortable: true,
    },
    {
      key: "isActive",
      title: "Status",
      render: (value: boolean) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "Created",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const templateColumns = [
    {
      key: "name",
      title: "Template Name",
      sortable: true,
      render: (value: string, item: any) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <DocumentIcon className="h-4 w-4 text-purple-600" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{item.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: "downloads",
      title: "Downloads",
      sortable: true,
    },
    {
      key: "isPublic",
      title: "Visibility",
      render: (value: boolean) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Public" : "Private"}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "Created",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const getColumns = () => {
    switch (activeTab) {
      case "projects":
        return projectColumns;
      case "nodes":
        return nodeColumns;
      case "templates":
        return templateColumns;
      default:
        return projectColumns;
    }
  };

  const currentData = getCurrentData();

  if (projectsData.loading && nodesData.loading && templatesData.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your projects.
          </p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute ${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === "increase"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
            {(["projects", "nodes", "templates"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Data Table */}
        <div className="p-4">
          <DataTable
            data={currentData.data}
            columns={getColumns()}
            loading={currentData.loading}
            pagination={currentData.pagination || undefined}
            sort={
              currentData.sort
                ? {
                    sortBy: currentData.sort.sortBy,
                    sortOrder: currentData.sort.sortOrder as "asc" | "desc",
                  }
                : undefined
            }
            searchValue={currentData.queryParams.search || ""}
            onQueryChange={currentData.setQueryParams}
            selectedItems={currentData.selectedItems}
            onRowSelect={(item, selected) => {
              if (selected) {
                currentData.toggleSelection(item.id);
              } else {
                currentData.toggleSelection(item.id);
              }
            }}
            actions={{
              onView: handleView,
              onEdit: handleEdit,
              onDelete: handleDelete,
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/projects/new"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                <PlusIcon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <span className="focus:outline-none">Create New Project</span>
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Start building your next workflow with our visual editor.
              </p>
            </div>
          </Link>

          <Link
            to="/nodes/new"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                <CubeIcon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <span className="focus:outline-none">Create Custom Node</span>
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Build reusable components for your workflows.
              </p>
            </div>
          </Link>

          <Link
            to="/templates"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                <DocumentIcon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <span className="focus:outline-none">Browse Templates</span>
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Discover pre-built templates to jumpstart your projects.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
