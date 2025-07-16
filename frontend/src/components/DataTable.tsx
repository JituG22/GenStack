import React from "react";
import { QueryParams } from "../lib/api";

interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sort?: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  searchValue?: string;
  onQueryChange?: (params: QueryParams) => void;
  onRowSelect?: (item: T, selected: boolean) => void;
  selectedItems?: Set<string>;
  actions?: {
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onView?: (item: T) => void;
  };
  className?: string;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  pagination,
  sort,
  searchValue = "",
  onQueryChange,
  onRowSelect,
  selectedItems = new Set(),
  actions,
  className = "",
}: DataTableProps<T>) {
  const handleSearch = (value: string) => {
    onQueryChange?.({ search: value, page: 1 });
  };

  const handleSort = (columnKey: string) => {
    if (!onQueryChange) return;

    const newSortOrder =
      sort?.sortBy === columnKey && sort?.sortOrder === "asc" ? "desc" : "asc";

    onQueryChange({ sortBy: columnKey, sortOrder: newSortOrder });
  };

  const handlePageChange = (newPage: number) => {
    onQueryChange?.({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    onQueryChange?.({ limit: newLimit, page: 1 });
  };

  const getSortIcon = (columnKey: string) => {
    if (sort?.sortBy !== columnKey) {
      return <span className="text-gray-400">↕️</span>;
    }
    return sort.sortOrder === "asc" ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Search and Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {pagination && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {onRowSelect && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.size === data.length && data.length > 0
                    }
                    onChange={(e) => {
                      data.forEach((item) =>
                        onRowSelect(item, e.target.checked)
                      );
                    }}
                    className="rounded"
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(column.key as string)}
                        className="hover:text-gray-700"
                      >
                        {getSortIcon(column.key as string)}
                      </button>
                    )}
                  </div>
                </th>
              ))}

              {actions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (onRowSelect ? 1 : 0) + (actions ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (onRowSelect ? 1 : 0) + (actions ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {onRowSelect && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => onRowSelect(item, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(item[column.key as keyof T], item)
                        : String(item[column.key as keyof T] || "")}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {actions.onView && (
                          <button
                            onClick={() => actions.onView!(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                        )}
                        {actions.onEdit && (
                          <button
                            onClick={() => actions.onEdit!(item)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        )}
                        {actions.onDelete && (
                          <button
                            onClick={() => actions.onDelete!(item)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            <span className="px-3 py-1 text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
