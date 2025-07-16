import { useState, useCallback, useEffect } from "react";
import { projectsApi } from "../lib/api";

export interface FilterOperator {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "between";
  value: any;
  value2?: any;
}

export interface DateRangeFilter {
  field: string;
  startDate?: Date;
  endDate?: Date;
  preset?:
    | "today"
    | "yesterday"
    | "last7days"
    | "last30days"
    | "last90days"
    | "thisMonth"
    | "lastMonth"
    | "thisYear"
    | "lastYear";
}

export interface AdvancedFilter {
  operators?: FilterOperator[];
  dateRanges?: DateRangeFilter[];
  search?: {
    query: string;
    fields: string[];
    fuzzy?: boolean;
  };
  sort?: {
    field: string;
    order: "asc" | "desc";
  }[];
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface FilterState {
  filters: AdvancedFilter;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  loading: boolean;
  error: string | null;
}

export const useAdvancedFilter = (initialFilters?: AdvancedFilter) => {
  const [state, setState] = useState<FilterState>({
    filters: initialFilters || {
      pagination: { page: 1, limit: 10 },
    },
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
      hasNext: false,
      hasPrev: false,
    },
    loading: false,
    error: null,
  });

  const [savedFilters, setSavedFilters] = useState<
    Record<string, AdvancedFilter>
  >({});

  // Execute filter query
  const executeFilter = useCallback(
    async (filters?: AdvancedFilter) => {
      const filtersToUse = filters || state.filters;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await projectsApi.filterProjects(filtersToUse);

        setState((prev) => ({
          ...prev,
          data: response.data,
          pagination: response.pagination,
          filters: filtersToUse,
          loading: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Failed to filter data",
          loading: false,
        }));
      }
    },
    [state.filters]
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AdvancedFilter>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);

  // Add operator filter
  const addOperatorFilter = useCallback((operator: FilterOperator) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        operators: [...(prev.filters.operators || []), operator],
      },
    }));
  }, []);

  // Remove operator filter
  const removeOperatorFilter = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        operators: prev.filters.operators?.filter((_, i) => i !== index) || [],
      },
    }));
  }, []);

  // Update operator filter
  const updateOperatorFilter = useCallback(
    (index: number, operator: FilterOperator) => {
      setState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          operators:
            prev.filters.operators?.map((op, i) =>
              i === index ? operator : op
            ) || [],
        },
      }));
    },
    []
  );

  // Add date range filter
  const addDateRangeFilter = useCallback((dateRange: DateRangeFilter) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        dateRanges: [...(prev.filters.dateRanges || []), dateRange],
      },
    }));
  }, []);

  // Remove date range filter
  const removeDateRangeFilter = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        dateRanges:
          prev.filters.dateRanges?.filter((_, i) => i !== index) || [],
      },
    }));
  }, []);

  // Update date range filter
  const updateDateRangeFilter = useCallback(
    (index: number, dateRange: DateRangeFilter) => {
      setState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          dateRanges:
            prev.filters.dateRanges?.map((dr, i) =>
              i === index ? dateRange : dr
            ) || [],
        },
      }));
    },
    []
  );

  // Update search
  const updateSearch = useCallback(
    (search: { query: string; fields: string[]; fuzzy?: boolean }) => {
      setState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          search,
        },
      }));
    },
    []
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        search: undefined,
      },
    }));
  }, []);

  // Update sort
  const updateSort = useCallback(
    (sort: { field: string; order: "asc" | "desc" }[]) => {
      setState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          sort,
        },
      }));
    },
    []
  );

  // Update pagination
  const updatePagination = useCallback(
    (pagination: { page: number; limit: number }) => {
      setState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          pagination,
        },
      }));
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: {
        pagination: { page: 1, limit: 10 },
      },
    }));
  }, []);

  // Save filter configuration
  const saveFilter = useCallback(
    (name: string, filters?: AdvancedFilter) => {
      const filtersToSave = filters || state.filters;
      setSavedFilters((prev) => ({
        ...prev,
        [name]: filtersToSave,
      }));

      // Persist to localStorage
      try {
        localStorage.setItem(
          "savedFilters",
          JSON.stringify({
            ...savedFilters,
            [name]: filtersToSave,
          })
        );
      } catch (error) {
        console.warn("Failed to save filters to localStorage:", error);
      }
    },
    [state.filters, savedFilters]
  );

  // Load saved filter
  const loadFilter = useCallback(
    (name: string) => {
      const filter = savedFilters[name];
      if (filter) {
        setState((prev) => ({
          ...prev,
          filters: filter,
        }));
      }
    },
    [savedFilters]
  );

  // Delete saved filter
  const deleteSavedFilter = useCallback((name: string) => {
    setSavedFilters((prev) => {
      const updated = { ...prev };
      delete updated[name];

      // Update localStorage
      try {
        localStorage.setItem("savedFilters", JSON.stringify(updated));
      } catch (error) {
        console.warn("Failed to update localStorage:", error);
      }

      return updated;
    });
  }, []);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedFilters");
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }
    } catch (error) {
      console.warn("Failed to load saved filters from localStorage:", error);
    }
  }, []);

  // Auto-execute filter when filters change
  useEffect(() => {
    if (Object.keys(state.filters).length > 1 || state.filters.pagination) {
      executeFilter();
    }
  }, [state.filters, executeFilter]);

  return {
    // State
    filters: state.filters,
    data: state.data,
    pagination: state.pagination,
    loading: state.loading,
    error: state.error,
    savedFilters,

    // Actions
    executeFilter,
    updateFilters,
    addOperatorFilter,
    removeOperatorFilter,
    updateOperatorFilter,
    addDateRangeFilter,
    removeDateRangeFilter,
    updateDateRangeFilter,
    updateSearch,
    clearSearch,
    updateSort,
    updatePagination,
    clearFilters,
    saveFilter,
    loadFilter,
    deleteSavedFilter,
  };
};
