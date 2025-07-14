import React, { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { CrawlResultsTable } from '../components/dashboard/CrawlResultsTable';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { WebSocketStatus } from '../components/common/WebSocketStatus';
import { ResponsiveLayout, ResponsiveSection } from '../components/common/ResponsiveLayout';
import { crawlService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotifications } from '../context/NotificationContext';
import { RefreshCw, Download, Plus, Eye, Play, Trash2 } from 'lucide-react';
import type { CrawlTask, TasksQueryParams } from '../types';

export const ResultsDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { isConnected: wsConnected } = useWebSocket();
  const { success, error: showError, warning, info } = useNotifications();
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
        
        // Show notification for status changes
        if (status.status === 'completed') {
          success('Task Completed', `Crawl task #${taskId} has completed successfully.`);
        } else if (status.status === 'failed') {
          showError('Task Failed', `Crawl task #${taskId} has failed.`);
        } else if (status.status === 'running') {
          info('Task Started', `Crawl task #${taskId} is now running.`);
        }
      };

      window.addEventListener('crawl-status-update', handleTaskUpdate as EventListener);
      return () => {
        window.removeEventListener('crawl-status-update', handleTaskUpdate as EventListener);
      };
    }
  }, [wsConnected, success, showError, info]);

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
      showError('Load Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
    success('Refreshed', 'Task list has been updated.');
  }, [loadTasks, success]);

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
      success('Task Deleted', `Task #${taskId} has been deleted successfully.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      setError(errorMessage);
      showError('Delete Error', errorMessage);
    }
  }, [success, showError]);

  const handleTaskRerun = useCallback(async (taskId: number) => {
    if (!confirm('Are you sure you want to rerun this task?')) {
      return;
    }

    try {
      await crawlService.rerunTask(taskId);
      await loadTasks();
      success('Task Rerun', `Task #${taskId} has been queued for rerun.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rerun task';
      setError(errorMessage);
      showError('Rerun Error', errorMessage);
    }
  }, [loadTasks, success, showError]);

  const handleBulkDelete = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) {
      return;
    }

    try {
      await crawlService.bulkDelete(taskIds);
      setTasks(prevTasks => prevTasks.filter(task => !taskIds.includes(task.id)));
      success('Bulk Delete', `${taskIds.length} tasks have been deleted successfully.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tasks';
      setError(errorMessage);
      showError('Bulk Delete Error', errorMessage);
    }
  }, [success, showError]);

  const handleBulkRerun = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to rerun ${taskIds.length} tasks?`)) {
      return;
    }

    try {
      await crawlService.bulkRerun(taskIds);
      await loadTasks();
      success('Bulk Rerun', `${taskIds.length} tasks have been queued for rerun.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rerun tasks';
      setError(errorMessage);
      showError('Bulk Rerun Error', errorMessage);
    }
  }, [loadTasks, success, showError]);

  const handleBulkStop = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to stop ${taskIds.length} tasks?`)) {
      return;
    }

    try {
      await crawlService.bulkStop(taskIds);
      await loadTasks();
      warning('Bulk Stop', `${taskIds.length} tasks have been stopped.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop tasks';
      setError(errorMessage);
      showError('Bulk Stop Error', errorMessage);
    }
  }, [loadTasks, warning, showError]);

  const handleBulkExport = useCallback(async (taskIds: number[], format: string = 'csv') => {
    try {
      await crawlService.bulkExport(taskIds, format as 'csv' | 'json' | 'xlsx');
      success('Export Started', `Exporting ${taskIds.length} tasks in ${format.toUpperCase()} format.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export tasks';
      setError(errorMessage);
      showError('Export Error', errorMessage);
    }
  }, [success, showError]);

  const handleExportResults = useCallback(async () => {
    try {
      const completedTasks = tasks.filter(task => task.status === 'completed');
      if (completedTasks.length === 0) {
        warning('No Data', 'No completed tasks to export.');
        return;
      }

      success('Export Started', `Exporting ${completedTasks.length} completed tasks...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export results';
      setError(errorMessage);
      showError('Export Error', errorMessage);
    }
  }, [tasks, success, warning, showError]);

  const closeTaskDetails = useCallback(() => {
    setShowTaskDetails(false);
    setSelectedTask(null);
  }, []);

  if (!isAuthenticated) {
    return (
      <ResponsiveLayout maxWidth="2xl" padding="lg">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Please log in to view your crawl results and statistics.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout maxWidth="7xl" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <ResponsiveSection
          title="Results Dashboard"
          subtitle="Monitor your crawl tasks and analyze results"
          actions={
            <div className="flex flex-col sm:flex-row gap-3">
              <WebSocketStatus />
              
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportResults}
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              
              <Button
                onClick={() => window.location.href = '/url-management'}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Crawl
              </Button>
            </div>
          }
        />

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
                      selectedTask.status === 'stopped' ? 'text-yellow-600 bg-yellow-50' :
                      selectedTask.status === 'running' ? 'text-blue-600 bg-blue-50' :
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
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  {selectedTask.status === 'completed' && (
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = `/crawl/${selectedTask.id}`}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Results
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => handleTaskRerun(selectedTask.id)}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Rerun
                  </Button>
                  
                  <Button
                    variant="error"
                    onClick={() => {
                      handleTaskDelete(selectedTask.id);
                      closeTaskDetails();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={closeTaskDetails}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default ResultsDashboard; 