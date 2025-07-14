import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import { BulkActions } from './BulkActions';
import type { CrawlTask, TaskStatus } from '../../types';

interface CrawlResultsTableProps {
  tasks: CrawlTask[];
  loading?: boolean;
  error?: string | null;
  onTaskSelect?: (task: CrawlTask) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskRerun?: (taskId: number) => void;
  onBulkDelete?: (taskIds: number[]) => void;
  onBulkRerun?: (taskIds: number[]) => void;
  onBulkStop?: (taskIds: number[]) => void;
  onBulkExport?: (taskIds: number[], format?: string) => void;
  className?: string;
}

interface SortConfig {
  key: keyof CrawlTask | 'none';
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  status: TaskStatus | 'all';
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

const ITEMS_PER_PAGE = 10;

export const CrawlResultsTable: React.FC<CrawlResultsTableProps> = ({
  tasks,
  loading = false,
  error = null,
  onTaskSelect,
  onTaskDelete,
  onTaskRerun,
  onBulkDelete,
  onBulkRerun,
  onBulkStop,
  onBulkExport,
  className = '',
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    status: 'all',
    search: '',
    dateRange: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply status filter
    if (filterConfig.status !== 'all') {
      filtered = filtered.filter(task => task.status === filterConfig.status);
    }

    // Apply search filter
    if (filterConfig.search) {
      const searchLower = filterConfig.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.url.toLowerCase().includes(searchLower) ||
        task.error_message?.toLowerCase().includes(searchLower) ||
        task.id.toString().includes(searchLower)
      );
    }

    // Apply date range filter
    if (filterConfig.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterConfig.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(task => 
        new Date(task.created_at) >= filterDate
      );
    }

    // Apply sorting
    if (sortConfig.key !== 'none') {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof CrawlTask];
        const bValue = b[sortConfig.key as keyof CrawlTask];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [tasks, sortConfig, filterConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSortedTasks.slice(start, end);
  }, [filteredAndSortedTasks, currentPage]);

  // Reset page when filters change
  const handleFilterChange = useCallback((newFilter: Partial<FilterConfig>) => {
    setFilterConfig(prev => ({ ...prev, ...newFilter }));
    setCurrentPage(1);
  }, []);

  // Handle sorting
  const handleSort = useCallback((key: keyof CrawlTask) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Handle selection
  const handleTaskSelect = useCallback((taskId: number, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(paginatedTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  }, [paginatedTasks]);

  // Handle bulk actions
  const handleBulkDelete = useCallback(() => {
    if (selectedTasks.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
  }, [selectedTasks, onBulkDelete]);

  const handleBulkRerun = useCallback(() => {
    if (selectedTasks.size > 0 && onBulkRerun) {
      onBulkRerun(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
  }, [selectedTasks, onBulkRerun]);

  const handleBulkStop = useCallback((taskIds: number[]) => {
    if (onBulkStop) {
      onBulkStop(taskIds);
      setSelectedTasks(new Set());
    }
  }, [onBulkStop]);

  const handleBulkExport = useCallback((taskIds: number[], format?: string) => {
    if (onBulkExport) {
      onBulkExport(taskIds, format);
      setSelectedTasks(new Set());
    }
  }, [onBulkExport]);

  const handleClearSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-yellow-600 bg-yellow-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get sort icon
  const getSortIcon = (key: keyof CrawlTask) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <Loading text="Loading tasks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with filters toggle and bulk actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Crawl Results ({filteredAndSortedTasks.length})
          </h2>
          
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        
        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <BulkActions
            selectedCount={selectedTasks.size}
            selectedTasks={Array.from(selectedTasks)}
            onRerun={handleBulkRerun}
            onDelete={handleBulkDelete}
            onStop={handleBulkStop}
            onExport={handleBulkExport}
            onClear={handleClearSelection}
          />
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Global Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search by URL, ID, or error..."
                value={filterConfig.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterConfig.status}
                onChange={(e) => handleFilterChange({ status: e.target.value as TaskStatus | 'all' })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filterConfig.dateRange}
                onChange={(e) => handleFilterChange({ dateRange: e.target.value as FilterConfig['dateRange'] })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setFilterConfig({ status: 'all', search: '', dateRange: 'all' });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === paginatedTasks.length && paginatedTasks.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('id')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>ID</span>
                    {getSortIcon('id')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('url')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>URL</span>
                    {getSortIcon('url')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Status</span>
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('progress')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Progress</span>
                    {getSortIcon('progress')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Created</span>
                    {getSortIcon('created_at')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => handleTaskSelect(task.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline"
                      >
                        {task.url}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(task.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {onTaskSelect && (
                        <button
                          onClick={() => onTaskSelect(task)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      )}
                      {onTaskRerun && (
                        <button
                          onClick={() => onTaskRerun(task.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Rerun
                        </button>
                      )}
                      {onTaskDelete && (
                        <button
                          onClick={() => onTaskDelete(task.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedTasks.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterConfig.search || filterConfig.status !== 'all' || filterConfig.dateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating a new crawl task'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedTasks.length)} of {filteredAndSortedTasks.length} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrawlResultsTable; 