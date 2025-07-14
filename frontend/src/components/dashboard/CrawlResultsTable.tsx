import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import { BulkActions } from './BulkActions';
import { Checkbox } from '../common/Checkbox';
import { ProgressBar } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Play, 
  Trash2, 
  Eye,
  Download,
  MoreHorizontal
} from 'lucide-react';
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
  const [showBulkActions, setShowBulkActions] = useState(false);

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
    setShowBulkActions(selected || selectedTasks.size > 0);
  }, [selectedTasks.size]);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(paginatedTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
    setShowBulkActions(selected);
  }, [paginatedTasks]);

  // Handle bulk actions
  const handleBulkDelete = useCallback(() => {
    if (selectedTasks.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedTasks));
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    }
  }, [selectedTasks, onBulkDelete]);

  const handleBulkRerun = useCallback(() => {
    if (selectedTasks.size > 0 && onBulkRerun) {
      onBulkRerun(Array.from(selectedTasks));
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    }
  }, [selectedTasks, onBulkRerun]);

  const handleBulkStop = useCallback((taskIds: number[]) => {
    if (onBulkStop) {
      onBulkStop(taskIds);
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    }
  }, [onBulkStop]);

  const handleBulkExport = useCallback((taskIds: number[], format?: string) => {
    if (onBulkExport) {
      onBulkExport(taskIds, format);
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    }
  }, [onBulkExport]);

  const handleClearSelection = useCallback(() => {
    setSelectedTasks(new Set());
    setShowBulkActions(false);
  }, []);

  // Get status color and icon
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return { color: 'success', text: 'Completed' };
      case 'running':
        return { color: 'primary', text: 'Running' };
      case 'pending':
        return { color: 'warning', text: 'Pending' };
      case 'failed':
        return { color: 'error', text: 'Failed' };
      case 'stopped':
        return { color: 'secondary', text: 'Stopped' };
      default:
        return { color: 'secondary', text: status };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSortIcon = (key: keyof CrawlTask) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const isAllSelected = paginatedTasks.length > 0 && selectedTasks.size === paginatedTasks.length;
  const isIndeterminate = selectedTasks.size > 0 && selectedTasks.size < paginatedTasks.length;

  if (loading) {
    return <Loading text="Loading tasks..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header with filters and search */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Crawl Results</h2>
            <span className="text-sm text-gray-500">
              {filteredAndSortedTasks.length} tasks
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={filterConfig.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterConfig.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value as TaskStatus | 'all' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="stopped">Stopped</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={filterConfig.dateRange}
                  onChange={(e) => handleFilterChange({ dateRange: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {showBulkActions && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-700">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="text"
                onClick={handleClearSelection}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleBulkRerun}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Rerun
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkStop(Array.from(selectedTasks))}
                className="flex items-center gap-2"
              >
                Stop
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkExport(Array.from(selectedTasks))}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="error"
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(checked) => handleSelectAll(checked)}
                  aria-label="Select all tasks"
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  ID
                  {getSortIcon('id')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('url')}
              >
                <div className="flex items-center gap-1">
                  URL
                  {getSortIcon('url')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Created
                  {getSortIcon('created_at')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTasks.map((task) => {
              const statusConfig = getStatusConfig(task.status);
              const isSelected = selectedTasks.has(task.id);
              
              return (
                <tr 
                  key={task.id} 
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => handleTaskSelect(task.id, checked)}
                      aria-label={`Select task ${task.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    #{task.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-900 truncate" title={task.url}>
                        {task.url}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusConfig.color as any}>
                      {statusConfig.text}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {task.status === 'running' && task.progress !== undefined ? (
                      <div className="w-32">
                        <ProgressBar 
                          value={task.progress} 
                          max={100}
                          className="h-2"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {task.progress}%
                        </div>
                      </div>
                    ) : task.status === 'completed' ? (
                      <div className="text-sm text-green-600">100%</div>
                    ) : (
                      <div className="text-sm text-gray-400">-</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(task.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => onTaskSelect?.(task)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {task.status === 'completed' && (
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => onTaskRerun?.(task.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => onTaskDelete?.(task.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedTasks.length)} of{' '}
              {filteredAndSortedTasks.length} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {paginatedTasks.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {filterConfig.search || filterConfig.status !== 'all' || filterConfig.dateRange !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Start by creating your first crawl task.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CrawlResultsTable; 