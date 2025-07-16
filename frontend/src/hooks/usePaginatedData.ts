import { useState, useEffect, useCallback } from 'react';
import { QueryParams, PaginatedResponse } from '../lib/api';

interface UsePaginatedDataOptions {
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

interface UsePaginatedDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<T>['pagination'] | null;
  sort: PaginatedResponse<T>['sort'] | null;
  queryParams: QueryParams;
  setQueryParams: (params: Partial<QueryParams>) => void;
  refetch: () => void;
  selectedItems: Set<string>;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
}

export function usePaginatedData<T extends { id: string }>(
  fetchFunction: (params: QueryParams) => Promise<PaginatedResponse<T>>,
  options: UsePaginatedDataOptions = {}
): UsePaginatedDataReturn<T> {
  const {
    defaultLimit = 10,
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination'] | null>(null);
  const [sort, setSort] = useState<PaginatedResponse<T>['sort'] | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const [queryParams, setQueryParamsState] = useState<QueryParams>({
    page: 1,
    limit: defaultLimit,
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
  });

  const setQueryParams = useCallback((newParams: Partial<QueryParams>) => {
    setQueryParamsState(prev => ({ ...prev, ...newParams }));
    setSelectedItems(new Set()); // Clear selection when query changes
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchFunction(queryParams);
      
      setData(response.data);
      setPagination(response.pagination);
      setSort(response.sort || null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
      setData([]);
      setPagination(null);
      setSort(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === data.length && data.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.map(item => item.id)));
    }
  }, [data, selectedItems.size]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return {
    data,
    loading,
    error,
    pagination,
    sort,
    queryParams,
    setQueryParams,
    refetch,
    selectedItems,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
  };
}
