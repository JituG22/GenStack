import React, { useState } from "react";
import { useAdvancedFilter, FilterOperator } from "../hooks/useAdvancedFilter";
import {
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";

interface AdvancedFilterProps {
  onFilterChange?: (data: any[]) => void;
  className?: string;
}

const fieldOptions = [
  { value: "name", label: "Project Name" },
  { value: "description", label: "Description" },
  { value: "status", label: "Status" },
  { value: "tags", label: "Tags" },
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
  { value: "metadata.priority", label: "Priority" },
  { value: "metadata.category", label: "Category" },
];

const operatorOptions = [
  { value: "eq", label: "Equals" },
  { value: "ne", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "startsWith", label: "Starts With" },
  { value: "endsWith", label: "Ends With" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "in", label: "In List" },
  { value: "between", label: "Between" },
];

const datePresetOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "last90days", label: "Last 90 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" },
];

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  onFilterChange,
  className,
}) => {
  const {
    filters,
    data,
    loading,
    error,
    savedFilters,
    addOperatorFilter,
    removeOperatorFilter,
    updateOperatorFilter,
    addDateRangeFilter,
    removeDateRangeFilter,
    updateDateRangeFilter,
    updateSearch,
    clearSearch,
    clearFilters,
    saveFilter,
    loadFilter,
    deleteSavedFilter,
  } = useAdvancedFilter();

  const [isExpanded, setIsExpanded] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  React.useEffect(() => {
    if (onFilterChange) {
      onFilterChange(data);
    }
  }, [data, onFilterChange]);

  const handleAddOperatorFilter = () => {
    addOperatorFilter({
      field: "name",
      operator: "contains",
      value: "",
    });
  };

  const handleUpdateOperatorFilter = (
    index: number,
    field: keyof FilterOperator,
    value: any
  ) => {
    const operator = filters.operators?.[index];
    if (operator) {
      updateOperatorFilter(index, { ...operator, [field]: value });
    }
  };

  const handleAddDateRangeFilter = () => {
    addDateRangeFilter({
      field: "createdAt",
      preset: "last30days",
    });
  };

  const handleSearchChange = (query: string) => {
    if (query.trim()) {
      updateSearch({
        query,
        fields: ["name", "description", "tags"],
        fuzzy: true,
      });
    } else {
      clearSearch();
    }
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      saveFilter(saveFilterName.trim());
      setSaveFilterName("");
      setShowSaveDialog(false);
    }
  };

  const activeFilterCount =
    (filters.operators?.length || 0) +
    (filters.dateRanges?.length || 0) +
    (filters.search ? 1 : 0);

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Advanced Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <BookmarkIcon className="h-4 w-4 mr-1" />
            Save
          </button>
          <button
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute inset-y-0 left-0 pl-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={filters.search?.query || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Saved Filters */}
          {Object.keys(savedFilters).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Saved Filters
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(savedFilters).map(([name]) => (
                  <div key={name} className="flex items-center space-x-1">
                    <button
                      onClick={() => loadFilter(name)}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      {name}
                    </button>
                    <button
                      onClick={() => deleteSavedFilter(name)}
                      className="inline-flex items-center p-1 rounded-md text-red-600 hover:bg-red-100"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                Field Filters
              </h4>
              <button
                onClick={handleAddOperatorFilter}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Filter
              </button>
            </div>

            <div className="space-y-3">
              {filters.operators?.map((operator, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md"
                >
                  <select
                    value={operator.field}
                    onChange={(e) =>
                      handleUpdateOperatorFilter(index, "field", e.target.value)
                    }
                    className="block w-1/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {fieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={operator.operator}
                    onChange={(e) =>
                      handleUpdateOperatorFilter(
                        index,
                        "operator",
                        e.target.value
                      )
                    }
                    className="block w-1/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {operatorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={operator.value || ""}
                    onChange={(e) =>
                      handleUpdateOperatorFilter(index, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />

                  {operator.operator === "between" && (
                    <input
                      type="text"
                      value={operator.value2 || ""}
                      onChange={(e) =>
                        handleUpdateOperatorFilter(
                          index,
                          "value2",
                          e.target.value
                        )
                      }
                      placeholder="To Value"
                      className="block w-1/6 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  )}

                  <button
                    onClick={() => removeOperatorFilter(index)}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                Date Filters
              </h4>
              <button
                onClick={handleAddDateRangeFilter}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                Add Date Filter
              </button>
            </div>

            <div className="space-y-3">
              {filters.dateRanges?.map((dateRange, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md"
                >
                  <select
                    value={dateRange.field}
                    onChange={(e) => {
                      updateDateRangeFilter(index, {
                        ...dateRange,
                        field: e.target.value,
                      });
                    }}
                    className="block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                  </select>

                  <select
                    value={dateRange.preset || ""}
                    onChange={(e) => {
                      updateDateRangeFilter(index, {
                        ...dateRange,
                        preset: e.target.value as any,
                      });
                    }}
                    className="block w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Custom Range</option>
                    {datePresetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeDateRangeFilter(index)}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
            Filtering...
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Save Filter
              </h3>
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Enter filter name"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  disabled={!saveFilterName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
