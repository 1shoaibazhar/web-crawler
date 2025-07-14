import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveLayout, ResponsiveSection } from '../components/common/ResponsiveLayout';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { CrawlResultsTable } from '../components/dashboard/CrawlResultsTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useNotifications } from '../context/NotificationContext';
import { crawlService } from '../services';
import { useAuth } from '../hooks/useAuth';
import type { CrawlTask } from '../types';

export const DashboardPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useNotifications();
  const [tasks, setTasks] = useState<CrawlTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await crawlService.getTasks({
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'desc',
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

  const handleTaskSelect = useCallback((task: CrawlTask) => {
    window.location.href = `/crawl/${task.id}`;
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
      showError('Rerun Error', errorMessage);
    }
  }, [loadTasks, success, showError]);

  if (!isAuthenticated) {
    return (
      <ResponsiveLayout maxWidth="2xl" padding="lg">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Please log in to view your dashboard.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </ResponsiveLayout>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <ResponsiveLayout maxWidth="7xl" padding="lg">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout maxWidth="7xl" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <ResponsiveSection
          title="Dashboard"
          subtitle="Overview of your web crawling activities and performance"
        />

        {/* Error Display */}
        {error && <ErrorMessage message={error} />}

        {/* Dashboard Overview */}
        <DashboardOverview tasks={tasks} loading={loading} />

        {/* Recent Tasks */}
        <ResponsiveSection
          title="Recent Tasks"
          subtitle="Your latest crawl tasks and their status"
          actions={
            <button 
              onClick={() => window.location.href = '/results'}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          }
        >
          <CrawlResultsTable
            tasks={tasks.slice(0, 10)} // Show only recent 10 tasks
            loading={loading}
            error={error}
            onTaskSelect={handleTaskSelect}
            onTaskDelete={handleTaskDelete}
            onTaskRerun={handleTaskRerun}
          />
        </ResponsiveSection>
      </div>
    </ResponsiveLayout>
  );
};

export default DashboardPage; 