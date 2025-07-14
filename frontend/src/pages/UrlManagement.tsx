import React, { useState, useEffect } from 'react';
import { UrlForm } from '../components/crawl/UrlForm';
import { ActiveCrawlManager } from '../components/crawl/ActiveCrawlManager';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { WebSocketStatus } from '../components/common/WebSocketStatus';
import { crawlService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import type { CrawlTask, CrawlTaskRequest } from '../types';

export const UrlManagement: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { isConnected: wsConnected } = useWebSocket();
  const [activeTasks, setActiveTasks] = useState<CrawlTask[]>([]);
  const [recentTasks, setRecentTasks] = useState<CrawlTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Load initial tasks
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated]);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await crawlService.getTasks({
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      const active = response.tasks.filter(
        task => task.status === 'pending' || task.status === 'in_progress'
      );
      const recent = response.tasks.filter(
        task => task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
      ).slice(0, 5);

      setActiveTasks(active);
      setRecentTasks(recent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrawlSubmit = async (crawlRequest: CrawlTaskRequest) => {
    setError(null);
    
    try {
      const newTask = await crawlService.createTask(crawlRequest);
      
      // Add to active tasks
      setActiveTasks(prev => [newTask, ...prev]);
      
      // Hide form on mobile after successful submission
      if (window.innerWidth < 768) {
        setShowForm(false);
      }
      
      // Refresh tasks to get latest status
      setTimeout(loadTasks, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start crawl';
      setError(errorMessage);
    }
  };

  const handleTaskUpdate = (updatedTask: CrawlTask) => {
    setActiveTasks(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
  };

  const handleTaskComplete = (completedTask: CrawlTask) => {
    // Remove from active tasks
    setActiveTasks(prev => prev.filter(task => task.id !== completedTask.id));
    
    // Add to recent tasks
    setRecentTasks(prev => [completedTask, ...prev.slice(0, 4)]);
  };

  const handleTaskStopped = (stoppedTask: CrawlTask) => {
    // Remove from active tasks
    setActiveTasks(prev => prev.filter(task => task.id !== stoppedTask.id));
    
    // Add to recent tasks
    setRecentTasks(prev => [stoppedTask, ...prev.slice(0, 4)]);
  };

  const handleStopAllCrawls = async () => {
    setError(null);
    
    try {
      await Promise.all(
        activeTasks.map(task => crawlService.stopCrawl(task.id))
      );
      
      // Refresh tasks
      await loadTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop some crawls';
      setError(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-yellow-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">URL Management</h1>
          <p className="text-gray-600 mb-6">
            Please log in to start managing your crawl tasks.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">URL Management</h1>
          <p className="text-gray-600 mt-1">
            Start new crawls and monitor active tasks
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <WebSocketStatus />
          
          {/* Mobile form toggle */}
          <div className="md:hidden">
            <Button
              variant="secondary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Hide Form' : 'New Crawl'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* URL Form */}
        <div className={`lg:col-span-1 ${showForm ? 'block' : 'hidden md:block'}`}>
          <UrlForm
            onSubmit={handleCrawlSubmit}
            onSuccess={() => {
              // Optional: Show success message
              console.log('Crawl started successfully');
            }}
          />
        </div>

        {/* Active Tasks and Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Active Crawls ({activeTasks.length})
              </h2>
              
              {activeTasks.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleStopAllCrawls}
                  size="small"
                >
                  Stop All
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loading text="Loading tasks..." />
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-600">No active crawls</p>
                <p className="text-sm text-gray-500 mt-1">
                  Start a new crawl to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTasks.map((task) => (
                  <ActiveCrawlManager
                    key={task.id}
                    task={task}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskComplete={handleTaskComplete}
                    onTaskStopped={handleTaskStopped}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Tasks
              </h2>
              
              <Button
                variant="secondary"
                onClick={() => window.location.href = '/dashboard'}
                size="small"
              >
                View All
              </Button>
            </div>

            {recentTasks.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-600">No recent tasks</p>
                <p className="text-sm text-gray-500 mt-1">
                  Completed tasks will appear here
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="divide-y divide-gray-200">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {task.url}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(task.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          
                          {task.status === 'completed' && (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => window.location.href = `/results/${task.id}`}
                            >
                              View Results
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Welcome, {user?.username || 'User'} • WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
          <Button
            variant="secondary"
            size="small"
            onClick={loadTasks}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UrlManagement; 