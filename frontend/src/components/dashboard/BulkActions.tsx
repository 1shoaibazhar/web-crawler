import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';

interface BulkActionsProps {
  selectedCount: number;
  selectedTasks: number[];
  onDelete?: (taskIds: number[]) => void;
  onRerun?: (taskIds: number[]) => void;
  onStop?: (taskIds: number[]) => void;
  onExport?: (taskIds: number[], format?: string) => void;
  onClear?: () => void;
  className?: string;
  loading?: boolean;
  progress?: {
    completed: number;
    total: number;
    action: string;
  };
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  selectedTasks,
  onDelete,
  onRerun,
  onStop,
  onExport,
  onClear,
  className = '',
  loading = false,
  progress,
}) => {
  const [showExportOptions, setShowExportOptions] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700 font-medium">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </span>
          
          {progress && (
            <div className="flex items-center space-x-2">
              <Loading size="small" text="" />
              <span className="text-sm text-gray-600">
                {progress.action}: {progress.completed}/{progress.total}
              </span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {onRerun && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onRerun(selectedTasks)}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loading size="small" text="" />
                  <span className="ml-2">Rerunning...</span>
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rerun
                </>
              )}
            </Button>
          )}
          
          {onStop && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onStop(selectedTasks)}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loading size="small" text="" />
                  <span className="ml-2">Stopping...</span>
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop
                </>
              )}
            </Button>
          )}
          
          {onExport && (
            <div className="relative">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loading size="small" text="" />
                    <span className="ml-2">Exporting...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </Button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onExport(selectedTasks, 'csv');
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        onExport(selectedTasks, 'json');
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        onExport(selectedTasks, 'xlsx');
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {onDelete && (
            <Button
              variant="danger"
              size="small"
              onClick={() => onDelete(selectedTasks)}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loading size="small" text="" />
                  <span className="ml-2">Deleting...</span>
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </>
              )}
            </Button>
          )}
          
          {onClear && (
            <Button
              variant="secondary"
              size="small"
              onClick={onClear}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActions; 