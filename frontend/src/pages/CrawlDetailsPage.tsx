import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LinkAnalysisChart } from '../components/details/LinkAnalysisChart';
import { BrokenLinksTable } from '../components/details/BrokenLinksTable';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { WebSocketStatus } from '../components/common/WebSocketStatus';
import { crawlService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import type { CrawlTask, CrawlResult, CrawlLink, TaskStatusResponse } from '../types';

export const CrawlDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isConnected: wsConnected } = useWebSocket();
  
  const [task, setTask] = useState<CrawlTask | null>(null);
  const [results, setResults] = useState<CrawlResult | null>(null);
  const [links, setLinks] = useState<CrawlLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'broken'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const taskIdNumber = taskId ? parseInt(taskId) : null;

  // Load task details on mount
  useEffect(() => {
    if (isAuthenticated && taskIdNumber) {
      loadTaskDetails();
    }
  }, [isAuthenticated, taskIdNumber]);

  // WebSocket integration for real-time updates
  useEffect(() => {
    if (wsConnected && taskIdNumber) {
      const handleTaskUpdate = (event: CustomEvent) => {
        const { taskId: updatedTaskId, status } = event.detail;
        if (updatedTaskId === taskIdNumber) {
          setTask(prevTask => prevTask ? { ...prevTask, ...status } : null);
        }
      };

      window.addEventListener('crawl-status-update', handleTaskUpdate as EventListener);
      return () => {
        window.removeEventListener('crawl-status-update', handleTaskUpdate as EventListener);
      };
    }
  }, [wsConnected, taskIdNumber]);

  const loadTaskDetails = useCallback(async () => {
    if (!taskIdNumber) {
      setError('Invalid task ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load task status
      const taskStatus: TaskStatusResponse = await crawlService.getTaskStatus(taskIdNumber);
      setTask(taskStatus);

      // If task is completed, load results and links
      if (taskStatus.status === 'completed') {
        const [resultsData, linksData] = await Promise.all([
          crawlService.getResults(taskIdNumber),
          crawlService.getLinks(taskIdNumber, { limit: 1000 }) // Get all links
        ]);
        
        setResults(resultsData);
        setLinks(linksData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load task details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [taskIdNumber]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTaskDetails();
    setRefreshing(false);
  }, [loadTaskDetails]);

  const handleTaskRerun = useCallback(async () => {
    if (!taskIdNumber || !confirm('Are you sure you want to rerun this task?')) {
      return;
    }

    try {
      await crawlService.rerunTask(taskIdNumber);
      navigate('/results'); // Navigate back to results dashboard
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rerun task';
      setError(errorMessage);
    }
  }, [taskIdNumber, navigate]);

  const handleTaskDelete = useCallback(async () => {
    if (!taskIdNumber || !confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await crawlService.deleteTask(taskIdNumber);
      navigate('/results'); // Navigate back to results dashboard
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      setError(errorMessage);
    }
  }, [taskIdNumber, navigate]);

  const handleExportResults = useCallback(async () => {
    if (!taskIdNumber) return;

    try {
      await crawlService.exportResults(taskIdNumber, 'csv');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export results';
      setError(errorMessage);
    }
  }, [taskIdNumber]);

  const handleExportBrokenLinks = useCallback((brokenLinks: CrawlLink[]) => {
    // Simple CSV export of broken links
    const csvContent = [
      ['URL', 'Status Code', 'Response Time (ms)', 'Anchor Text', 'Checked At'].join(','),
      ...brokenLinks.map(link => [
        `"${link.url}"`,
        link.status_code || 'No Response',
        link.response_time_ms,
        `"${link.anchor_text || ''}"`,
        link.checked_at || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broken-links-task-${taskIdNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [taskIdNumber]);

  const handleLinkTest = useCallback(async (link: CrawlLink) => {
    // This would typically make an API call to test the link
    // For now, just open the link in a new tab
    window.open(link.url, '_blank');
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Crawl Details</h1>
          <p className="text-gray-600 mb-6">
            Please log in to view crawl details.
          </p>
          <Button onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center py-12">
          <Loading text="Loading crawl details..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorMessage message={error} />
        <div className="mt-4 text-center">
          <Button onClick={() => navigate('/results')} variant="secondary">
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h1>
          <p className="text-gray-600 mb-6">
            The requested crawl task could not be found.
          </p>
          <Button onClick={() => navigate('/results')} variant="secondary">
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  const brokenLinks = links.filter(link => !link.is_accessible);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <button onClick={() => navigate('/results')} className="hover:text-gray-700">
              Results
            </button>
            <span>/</span>
            <span className="text-gray-900">Task {task.id}</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900 break-all">{task.url}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className="text-sm text-gray-600">
              Progress: {task.progress}%
            </span>
            <span className="text-sm text-gray-600">
              Created: {new Date(task.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
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
          
          {task.status === 'completed' && (
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
          )}
          
          <Button
            variant="secondary"
            onClick={handleTaskRerun}
            size="small"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rerun
          </Button>
          
          <Button
            variant="danger"
            onClick={handleTaskDelete}
            size="small"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Task Status Message */}
      {task.status === 'failed' && task.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Task Failed</h3>
              <p className="text-sm text-red-700 mt-1">{task.error_message}</p>
            </div>
          </div>
        </div>
      )}

      {task.status === 'in_progress' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Crawl in Progress</h3>
              <p className="text-sm text-blue-700 mt-1">
                This crawl is currently running. Results will be available when completed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content based on task status */}
      {task.status === 'completed' && results && (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'links'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Link Analysis ({links.length})
              </button>
              <button
                onClick={() => setActiveTab('broken')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'broken'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Broken Links ({brokenLinks.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <LinkAnalysisChart
              results={results}
              links={links}
              loading={false}
              error={null}
            />
          )}

          {activeTab === 'links' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">All Links</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Anchor Text
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {links.slice(0, 50).map((link) => ( // Limit to first 50 for performance
                      <tr key={link.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 break-all max-w-md">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline"
                          >
                            {link.url}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            link.link_type === 'internal' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'
                          }`}>
                            {link.link_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            link.is_accessible ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                          }`}>
                            {link.status_code || 'No Response'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {link.response_time_ms}ms
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {link.anchor_text || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {links.length > 50 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Showing first 50 of {links.length} links. Use the Broken Links tab for detailed analysis.
                </div>
              )}
            </div>
          )}

          {activeTab === 'broken' && (
            <BrokenLinksTable
              links={links}
              loading={false}
              error={null}
              onLinkTest={handleLinkTest}
              onExportBrokenLinks={handleExportBrokenLinks}
            />
          )}
        </>
      )}

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Task ID: {task.id} • WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CrawlDetailsPage; 