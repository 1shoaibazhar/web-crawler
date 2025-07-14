import React, { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { CrawlResultsTable } from '../components/dashboard/CrawlResultsTable';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { WebSocketStatus } from '../components/common/WebSocketStatus';
import { crawlService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import type { CrawlTask, TasksQueryParams } from '../types';

export const ResultsDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { isConnected: wsConnected } = useWebSocket();
  const [tasks, setTasks] = useState<CrawlTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CrawlTask | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  // Load tasks on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated]);

  // WebSocket integration for real-time updates
  useEffect(() => {
    if (wsConnected) {
      const handleTaskUpdate = (event: CustomEvent) => {
        const { taskId, status } = event.detail;
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { ...task, status: status.status, progress: status.progress }
              : task
          )
        );
      };

      window.addEventListener('crawl-status-update', handleTaskUpdate as EventListener);
      return () => {
        window.removeEventListener('crawl-status-update', handleTaskUpdate as EventListener);
      };
    }
  }, [wsConnected]);

  const loadTasks = useCallback(async (params?: TasksQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await crawlService.getTasks({
        limit: 100,
        sortBy: 'created_at',
        sortOrder: 'desc',
        ...params,
      });

      setTasks(response.tasks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const handleTaskSelect = useCallback((task: CrawlTask) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  }, []);

  const handleTaskDelete = useCallback(async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await crawlService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      setError(errorMessage);
    }
  }, []);

  const handleTaskRerun = useCallback(async (taskId: number) => {
    if (!confirm('Are you sure you want to rerun this task?')) {
      return;
    }

    try {
      await crawlService.rerunTask(taskId);
      // Refresh tasks to show the new task
      await loadTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rerun task';
      setError(errorMessage);
    }
  }, [loadTasks]);

  const handleBulkDelete = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) {
      return;
    }

    try {
      await crawlService.bulkDelete(taskIds);
      setTasks(prevTasks => prevTasks.filter(task => !taskIds.includes(task.id)));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tasks';
      setError(errorMessage);
    }
  }, []);

  const handleBulkRerun = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to rerun ${taskIds.length} tasks?`)) {
      return;
    }

    try {
      await crawlService.bulkRerun(taskIds);
      // Refresh tasks to show the new tasks
      await loadTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rerun tasks';
      setError(errorMessage);
    }
  }, [loadTasks]);

  const handleBulkStop = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to stop ${taskIds.length} tasks?`)) {
      return;
    }

    try {
      await crawlService.bulkStop(taskIds);
      // Refresh tasks to show updated status
      await loadTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop tasks';
      setError(errorMessage);
    }
  }, [loadTasks]);

  const handleBulkExport = useCallback(async (taskIds: number[], format: string = 'csv') => {
    try {
      await crawlService.bulkExport(taskIds, format as 'csv' | 'json' | 'xlsx');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export tasks';
      setError(errorMessage);
    }
  }, []);

  const handleExportResults = useCallback(async () => {
    try {
      const completedTasks = tasks.filter(task => task.status === 'completed');
      if (completedTasks.length === 0) {
        alert('No completed tasks to export');
        return;
      }

      // For now, just show a message. In a real app, you'd export to CSV/JSON
      alert(`Exporting ${completedTasks.length} completed tasks...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export results';
      setError(errorMessage);
    }
  }, [tasks]);

  const closeTaskDetails = useCallback(() => {
    setShowTaskDetails(false);
    setSelectedTask(null);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Please log in to view your crawl results and statistics.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor your crawl tasks and analyze results
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <WebSocketStatus />
          
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            size="small"
          >
            {refreshing ? (
              <div className="flex items-center">
                <Loading size="small" text="" />
                <span className="ml-2">Refreshing...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleExportResults}
            size="small"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </Button>
          
          <Button
            onClick={() => window.location.href = '/url-management'}
            size="small"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Crawl
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Dashboard Statistics */}
      <DashboardStats
        tasks={tasks}
        loading={loading}
        error={error}
      />

      {/* Results Table */}
      <CrawlResultsTable
        tasks={tasks}
        loading={loading}
        error={error}
        onTaskSelect={handleTaskSelect}
        onTaskDelete={handleTaskDelete}
        onTaskRerun={handleTaskRerun}
        onBulkDelete={handleBulkDelete}
        onBulkRerun={handleBulkRerun}
        onBulkStop={handleBulkStop}
        onBulkExport={handleBulkExport}
      />

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
                <button
                  onClick={closeTaskDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Task Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Task ID</h3>
                  <p className="text-sm text-gray-900">{selectedTask.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">URL</h3>
                  <p className="text-sm text-gray-900 break-all">{selectedTask.url}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedTask.status === 'completed' ? 'text-green-600 bg-green-50' :
                    selectedTask.status === 'failed' ? 'text-red-600 bg-red-50' :
                    selectedTask.status === 'cancelled' ? 'text-yellow-600 bg-yellow-50' :
                    selectedTask.status === 'in_progress' ? 'text-blue-600 bg-blue-50' :
                    'text-gray-600 bg-gray-50'
                  }`}>
                    {selectedTask.status}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${selectedTask.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900">{selectedTask.progress}%</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="text-sm text-gray-900">{new Date(selectedTask.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Updated</h3>
                  <p className="text-sm text-gray-900">{new Date(selectedTask.updated_at).toLocaleString()}</p>
                </div>
                
                {selectedTask.started_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Started</h3>
                    <p className="text-sm text-gray-900">{new Date(selectedTask.started_at).toLocaleString()}</p>
                  </div>
                )}
                
                {selectedTask.completed_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                    <p className="text-sm text-gray-900">{new Date(selectedTask.completed_at).toLocaleString()}</p>
                  </div>
                )}
                
                {selectedTask.error_message && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Error Message</h3>
                    <p className="text-sm text-red-600">{selectedTask.error_message}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                {selectedTask.status === 'completed' && (
                  <Button
                    variant="secondary"
                    onClick={() => window.location.href = `/results/${selectedTask.id}`}
                  >
                    View Results
                  </Button>
                )}
                
                <Button
                  variant="secondary"
                  onClick={() => handleTaskRerun(selectedTask.id)}
                >
                  Rerun
                </Button>
                
                <Button
                  variant="danger"
                  onClick={() => {
                    handleTaskDelete(selectedTask.id);
                    closeTaskDetails();
                  }}
                >
                  Delete
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={closeTaskDetails}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Footer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Welcome, {user?.username || 'User'} • {tasks.length} total tasks • WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard; 