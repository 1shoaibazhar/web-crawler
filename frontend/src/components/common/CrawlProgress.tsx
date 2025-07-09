import React from 'react';
import { useCrawlProgress } from '../../hooks/useWebSocket';

interface CrawlProgressProps {
  taskId: number;
  className?: string;
}

export const CrawlProgress: React.FC<CrawlProgressProps> = ({ taskId, className = '' }) => {
  const { progress, isRunning, error } = useCrawlProgress(taskId);

  if (!progress && !isRunning) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No active crawl
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        <span className="font-medium">Error:</span> {error}
      </div>
    );
  }

  const percentage = progress?.progress?.percentage || 0;
  const urlsCrawled = progress?.progress?.urls_crawled || 0;
  const totalUrls = progress?.progress?.total_urls || 0;
  const currentUrl = progress?.progress?.current_url;
  const elapsedTime = progress?.progress?.elapsed_time || 0;
  const estimatedTimeRemaining = progress?.progress?.estimated_time_remaining;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {urlsCrawled} of {totalUrls} URLs crawled
          </span>
          <span className="text-gray-600">
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Current URL */}
      {currentUrl && (
        <div className="text-sm">
          <span className="text-gray-600">Currently crawling:</span>
          <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono truncate">
            {currentUrl}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Elapsed:</span>
          <span className="ml-2 font-medium">{formatTime(elapsedTime)}</span>
        </div>
        {estimatedTimeRemaining && (
          <div>
            <span className="text-gray-600">Remaining:</span>
            <span className="ml-2 font-medium">{formatTime(estimatedTimeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Additional Statistics */}
      {progress?.statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Links Found:</span>
            <span className="ml-2 font-medium">{progress.statistics.links_found}</span>
          </div>
          <div>
            <span className="text-gray-600">External:</span>
            <span className="ml-2 font-medium">{progress.statistics.external_links}</span>
          </div>
          <div>
            <span className="text-gray-600">Errors:</span>
            <span className="ml-2 font-medium text-red-600">{progress.statistics.errors}</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Response:</span>
            <span className="ml-2 font-medium">{progress.statistics.average_response_time}ms</span>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="flex items-center space-x-2 text-sm">
        {isRunning ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-600 font-medium">Running</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span className="text-gray-600">Stopped</span>
          </>
        )}
      </div>
    </div>
  );
};

export default CrawlProgress; 