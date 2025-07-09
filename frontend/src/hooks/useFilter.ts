import { useState, useMemo } from 'react';

type FilterFunction<T> = (item: T) => boolean;

interface UseFilterReturn<T> {
  filteredData: T[];
  filters: Map<string, FilterFunction<T>>;
  addFilter: (key: string, filterFn: FilterFunction<T>) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  hasFilters: boolean;
}

export const useFilter = <T>(data: T[]): UseFilterReturn<T> => {
  const [filters, setFilters] = useState<Map<string, FilterFunction<T>>>(new Map());

  const filteredData = useMemo(() => {
    if (filters.size === 0) return data;

    return data.filter(item => {
      // Item must pass all filters
      return Array.from(filters.values()).every(filterFn => filterFn(item));
    });
  }, [data, filters]);

  const addFilter = (key: string, filterFn: FilterFunction<T>) => {
    setFilters(prev => new Map(prev).set(key, filterFn));
  };

  const removeFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = new Map(prev);
      newFilters.delete(key);
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters(new Map());
  };

  const hasFilters = filters.size > 0;

  return {
    filteredData,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    hasFilters,
  };
};

export default useFilter; 