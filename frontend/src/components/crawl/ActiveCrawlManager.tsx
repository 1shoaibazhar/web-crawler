import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import { CrawlProgress } from '../common/CrawlProgress';
import { crawlService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import { useCrawlProgress } from '../../hooks/useWebSocket';
import type { CrawlTask, TaskStatus } from '../../types';

interface ActiveCrawlManagerProps {
  task: CrawlTask;
  onTaskUpdate?: (task: CrawlTask) => void;
  onTaskComplete?: (task: CrawlTask) => void;
  onTaskStopped?: (task: CrawlTask) => void;
  className?: string;
}

export const ActiveCrawlManager: React.FC<ActiveCrawlManagerProps> = ({
  task,
  onTaskUpdate,
  onTaskComplete,
  onTaskStopped,
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const [isStoppingCrawl, setIsStoppingCrawl] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<CrawlTask>(task);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Use WebSocket for real-time progress updates
  const { progress, isRunning, error: wsError } = useCrawlProgress(task.id);

  // Update task status when progress changes
  useEffect(() => {
    if (progress?.status && progress.status !== currentTask.status) {
      const updatedTask = {
        ...currentTask,
        status: progress.status,
        progress: progress.progress?.percentage || currentTask.progress,
      };
      setCurrentTask(updatedTask);
      
      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
      
      // Handle completion
      if (progress.status === 'completed' && onTaskComplete) {
        onTaskComplete(updatedTask);
      }
    }
  }, [progress, currentTask, onTaskUpdate, onTaskComplete]);

  const handleStopCrawl = useCallback(async () => {
    if (!isAuthenticated) {
      setStopError('Please log in to stop the crawl');
      return;
    }

    setIsStoppingCrawl(true);
    setStopError(null);

    try {
      await crawlService.stopCrawl(task.id);
      
      // Update task status locally
      const stoppedTask = {
        ...currentTask,
        status: 'cancelled' as TaskStatus,
      };
      setCurrentTask(stoppedTask);
      
      // Notify parent component
      if (onTaskStopped) {
        onTaskStopped(stoppedTask);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop crawl';
      setStopError(errorMessage);
    } finally {
      setIsStoppingCrawl(false);
    }
  }, [isAuthenticated, task.id, currentTask, onTaskStopped]);

  const handleRefreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const updatedTask = await crawlService.getTaskStatus(task.id);
      const newTask = {
        ...currentTask,
        status: updatedTask.status,
        progress: updatedTask.progress,
        error_message: updatedTask.error_message,
        updated_at: updatedTask.updated_at,
        started_at: updatedTask.started_at,
        completed_at: updatedTask.completed_at,
      };
      
      setCurrentTask(newTask);
      
      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate(newTask);
      }
      
      // Handle completion
      if (updatedTask.status === 'completed' && onTaskComplete) {
        onTaskComplete(newTask);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh status';
      setRefreshError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [task.id, currentTask, onTaskUpdate, onTaskComplete]);

  const isActive = currentTask.status === 'in_progress' || currentTask.status === 'pending';
  const canStop = isActive && isAuthenticated;
  const showProgress = isActive && progress;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Active Crawl: {currentTask.url}
          </h3>
          <p className="text-sm text-gray-600">
            Status: {currentTask.status} • Progress: {currentTask.progress}%
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-500">
              {isRunning ? 'Live' : 'Disconnected'}
            </span>
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="small"
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loading size="small" text="" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Real-time Progress Display */}
      {showProgress && (
        <div className="mb-4">
          <CrawlProgress
            taskId={task.id}
            className="bg-gray-50"
          />
        </div>
      )}

      {/* Basic Progress Bar for non-WebSocket scenarios */}
      {!showProgress && isActive && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{currentTask.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${currentTask.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {currentTask.status === 'failed' && currentTask.error_message && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {currentTask.error_message}
          </p>
        </div>
      )}

      {currentTask.status === 'completed' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>Completed:</strong> Crawl finished successfully!
          </p>
        </div>
      )}

      {currentTask.status === 'cancelled' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Cancelled:</strong> Crawl was stopped by user.
          </p>
        </div>
      )}

      {/* Error Messages */}
      {stopError && <ErrorMessage message={stopError} className="mb-4" />}
      {refreshError && <ErrorMessage message={refreshError} className="mb-4" />}
      {wsError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>WebSocket Error:</strong> Real-time updates unavailable. {wsError}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          {canStop && (
            <Button
              variant="danger"
              onClick={handleStopCrawl}
              disabled={isStoppingCrawl}
            >
              {isStoppingCrawl ? (
                <div className="flex items-center">
                  <Loading size="small" text="" />
                  <span className="ml-2">Stopping...</span>
                </div>
              ) : (
                'Stop Crawl'
              )}
            </Button>
          )}
          
          {currentTask.status === 'completed' && (
            <Button
              variant="secondary"
              onClick={() => {
                // Navigate to results page
                window.location.href = `/results/${currentTask.id}`;
              }}
            >
              View Results
            </Button>
          )}
        </div>

        {/* Task Info */}
        <div className="text-sm text-gray-500">
          <span>Task ID: {currentTask.id}</span>
          {currentTask.started_at && (
            <span className="ml-3">
              Started: {new Date(currentTask.started_at).toLocaleString()}
            </span>
          )}
          {currentTask.completed_at && (
            <span className="ml-3">
              Completed: {new Date(currentTask.completed_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveCrawlManager; 