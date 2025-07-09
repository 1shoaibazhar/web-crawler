import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

interface UseSortReturn<T> {
  sortedData: T[];
  sortKey: keyof T | null;
  sortDirection: SortDirection;
  sort: (key: keyof T) => void;
  clearSort: () => void;
}

export const useSort = <T>(data: T[], initialKey?: keyof T, initialDirection: SortDirection = 'asc'): UseSortReturn<T> => {
  const [sortKey, setSortKey] = useState<keyof T | null>(initialKey || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Fallback to string comparison
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const sort = (key: keyof T) => {
    if (sortKey === key) {
      // Toggle direction if same key
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new key and default direction
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const clearSort = () => {
    setSortKey(null);
    setSortDirection('asc');
  };

  return {
    sortedData,
    sortKey,
    sortDirection,
    sort,
    clearSort,
  };
};

export default useSort; 