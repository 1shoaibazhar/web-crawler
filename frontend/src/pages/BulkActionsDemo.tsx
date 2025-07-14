import React, { useState, useCallback } from 'react';
import { Layout } from '../components/common/Layout';
import { Header } from '../components/common/Layout';
import { BulkActions } from '../components/dashboard/BulkActions';
import { CrawlResultsTable } from '../components/dashboard/CrawlResultsTable';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { crawlService } from '../services/crawl.service';
import type { CrawlTask, TaskStatus } from '../types';

export const BulkActionsDemo: React.FC = () => {
  const [tasks, setTasks] = useState<CrawlTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{
    completed: number;
    total: number;
    action: string;
  } | null>(null);

  // Mock user for demo
  const mockUser = {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  // Load demo tasks
  const loadDemoTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create demo tasks
      const demoTasks: CrawlTask[] = [
        {
          id: 1,
          url: 'https://example.com',
          status: 'completed' as TaskStatus,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:30:00Z',
          user_id: 1,
          depth: 2,
          delay: 1000,
          timeout: 30000,
          progress: 100,
          links_found: 25,
          links_crawled: 25,
          error_message: undefined,
        },
        {
          id: 2,
          url: 'https://test.com',
          status: 'in_progress' as TaskStatus,
          created_at: '2024-01-01T11:00:00Z',
          updated_at: '2024-01-01T11:15:00Z',
          user_id: 1,
          depth: 1,
          delay: 500,
          timeout: 30000,
          progress: 45,
          links_found: 12,
          links_crawled: 5,
          error_message: undefined,
        },
        {
          id: 3,
          url: 'https://demo.com',
          status: 'failed' as TaskStatus,
          created_at: '2024-01-01T12:00:00Z',
          updated_at: '2024-01-01T12:05:00Z',
          user_id: 1,
          depth: 1,
          delay: 1000,
          timeout: 30000,
          progress: 0,
          links_found: 0,
          links_crawled: 0,
          error_message: 'Connection timeout',
        },
        {
          id: 4,
          url: 'https://sample.com',
          status: 'pending' as TaskStatus,
          created_at: '2024-01-01T13:00:00Z',
          updated_at: '2024-01-01T13:00:00Z',
          user_id: 1,
          depth: 2,
          delay: 1000,
          timeout: 30000,
          progress: 0,
          links_found: 0,
          links_crawled: 0,
          error_message: undefined,
        },
      ];

      setTasks(demoTasks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load demo tasks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk action handlers with progress tracking
  const handleBulkDelete = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) {
      return;
    }

    setBulkProgress({ completed: 0, total: taskIds.length, action: 'Deleting tasks' });

    try {
      // Simulate progress
      for (let i = 0; i < taskIds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setBulkProgress(prev => prev ? { ...prev, completed: i + 1 } : null);
      }

      // Remove tasks from state
      setTasks(prevTasks => prevTasks.filter(task => !taskIds.includes(task.id)));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tasks';
      setError(errorMessage);
    } finally {
      setBulkProgress(null);
    }
  }, []);

  const handleBulkRerun = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to rerun ${taskIds.length} tasks?`)) {
      return;
    }

    setBulkProgress({ completed: 0, total: taskIds.length, action: 'Rerunning tasks' });

    try {
      // Simulate progress
      for (let i = 0; i < taskIds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setBulkProgress(prev => prev ? { ...prev, completed: i + 1 } : null);
      }

      // Refresh tasks
      await loadDemoTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rerun tasks';
      setError(errorMessage);
    } finally {
      setBulkProgress(null);
    }
  }, [loadDemoTasks]);

  const handleBulkStop = useCallback(async (taskIds: number[]) => {
    if (!confirm(`Are you sure you want to stop ${taskIds.length} tasks?`)) {
      return;
    }

    setBulkProgress({ completed: 0, total: taskIds.length, action: 'Stopping tasks' });

    try {
      // Simulate progress
      for (let i = 0; i < taskIds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setBulkProgress(prev => prev ? { ...prev, completed: i + 1 } : null);
      }

      // Update task statuses
      setTasks(prevTasks => 
        prevTasks.map(task => 
          taskIds.includes(task.id) && (task.status === 'in_progress' || task.status === 'pending')
            ? { ...task, status: 'cancelled' as TaskStatus, progress: 0 }
            : task
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop tasks';
      setError(errorMessage);
    } finally {
      setBulkProgress(null);
    }
  }, []);

  const handleBulkExport = useCallback(async (taskIds: number[], format: string = 'csv') => {
    setBulkProgress({ completed: 0, total: taskIds.length, action: 'Exporting tasks' });

    try {
      // Simulate progress
      for (let i = 0; i < taskIds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setBulkProgress(prev => prev ? { ...prev, completed: i + 1 } : null);
      }

      // Simulate file download
      const csvContent = [
        ['ID', 'URL', 'Status', 'Progress', 'Created At'].join(','),
        ...tasks
          .filter(task => taskIds.includes(task.id))
          .map(task => [
            task.id,
            `"${task.url}"`,
            task.status,
            task.progress,
            task.created_at
          ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export tasks';
      setError(errorMessage);
    } finally {
      setBulkProgress(null);
    }
  }, [tasks]);

  const handleTaskSelect = useCallback((task: CrawlTask) => {
    console.log('Task selected:', task);
  }, []);

  const handleTaskDelete = useCallback(async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  const handleTaskRerun = useCallback(async (taskId: number) => {
    if (!confirm('Are you sure you want to rerun this task?')) {
      return;
    }

    // Simulate rerun
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'pending' as TaskStatus, progress: 0, error_message: undefined }
          : task
      )
    );
  }, []);

  const handleLogout = useCallback(() => {
    console.log('Logout clicked');
  }, []);

  return (
    <Layout
      header={<Header title="Bulk Actions Demo" user={mockUser} onLogout={handleLogout} />}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Actions Demo</h1>
            <p className="text-gray-600 mt-1">
              Test and explore the comprehensive bulk actions functionality
            </p>
          </div>
          <Button
            onClick={loadDemoTasks}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <Loading size="small" text="" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : (
              'Load Demo Data'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorMessage message={error} />
        )}

        {/* Bulk Actions Documentation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Available Bulk Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">• Rerun Tasks</h4>
              <p>Restart selected tasks with their original configuration</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">• Stop Tasks</h4>
              <p>Cancel running or pending tasks</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">• Export Tasks</h4>
              <p>Export task data in CSV, JSON, or Excel format</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">• Delete Tasks</h4>
              <p>Permanently remove selected tasks and their data</p>
            </div>
          </div>
        </div>

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

        {/* Bulk Actions Progress */}
        {bulkProgress && (
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Loading size="small" text="" />
                <span className="text-sm font-medium text-gray-700">
                  {bulkProgress.action}
                </span>
                <span className="text-sm text-gray-600">
                  {bulkProgress.completed}/{bulkProgress.total}
                </span>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkProgress.completed / bulkProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Use</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Click "Load Demo Data" to populate the table with sample tasks</li>
            <li>Use the checkboxes to select one or more tasks</li>
            <li>Choose from the available bulk actions in the toolbar</li>
            <li>Watch the progress indicator for bulk operations</li>
            <li>Try different export formats (CSV, JSON, Excel)</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}; 