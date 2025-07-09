import React from 'react';

interface BulkActionsProps {
  selectedCount: number;
  onDelete?: () => void;
  onRerun?: () => void;
  onClear?: () => void;
  className?: string;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onDelete,
  onRerun,
  onClear,
  className = '',
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-gray-700">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {onRerun && (
            <button
              onClick={onRerun}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Re-run
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActions; 