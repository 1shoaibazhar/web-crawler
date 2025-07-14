import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import type { CrawlLink } from '../../types';

interface BrokenLinksTableProps {
  links: CrawlLink[];
  loading?: boolean;
  error?: string | null;
  onLinkTest?: (link: CrawlLink) => void;
  onExportBrokenLinks?: (links: CrawlLink[]) => void;
  className?: string;
}

interface SortConfig {
  key: keyof CrawlLink | 'none';
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  search: string;
  statusCode: string;
  responseTimeMin: string;
  responseTimeMax: string;
}

const ITEMS_PER_PAGE = 25;

export const BrokenLinksTable: React.FC<BrokenLinksTableProps> = ({
  links,
  loading = false,
  error = null,
  onLinkTest,
  onExportBrokenLinks,
  className = '',
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'response_time_ms', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    search: '',
    statusCode: '',
    responseTimeMin: '',
    responseTimeMax: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter to only broken links
  const brokenLinks = useMemo(() => {
    return links.filter(link => !link.is_accessible);
  }, [links]);

  // Apply additional filters and sorting
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = brokenLinks;

    // Apply search filter
    if (filterConfig.search) {
      const searchLower = filterConfig.search.toLowerCase();
      filtered = filtered.filter(link => 
        link.url.toLowerCase().includes(searchLower) ||
        link.anchor_text?.toLowerCase().includes(searchLower) ||
        link.id.toString().includes(searchLower)
      );
    }

    // Apply status code filter
    if (filterConfig.statusCode) {
      if (filterConfig.statusCode === 'null') {
        filtered = filtered.filter(link => !link.status_code);
      } else {
        const code = parseInt(filterConfig.statusCode);
        filtered = filtered.filter(link => link.status_code === code);
      }
    }

    // Apply response time filters
    if (filterConfig.responseTimeMin) {
      const minTime = parseInt(filterConfig.responseTimeMin);
      filtered = filtered.filter(link => link.response_time_ms >= minTime);
    }
    
    if (filterConfig.responseTimeMax) {
      const maxTime = parseInt(filterConfig.responseTimeMax);
      filtered = filtered.filter(link => link.response_time_ms <= maxTime);
    }

    // Apply sorting
    if (sortConfig.key !== 'none') {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof CrawlLink];
        const bValue = b[sortConfig.key as keyof CrawlLink];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [brokenLinks, sortConfig, filterConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLinks.length / ITEMS_PER_PAGE);
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSortedLinks.slice(start, end);
  }, [filteredAndSortedLinks, currentPage]);

  // Reset page when filters change
  const handleFilterChange = useCallback((newFilter: Partial<FilterConfig>) => {
    setFilterConfig(prev => ({ ...prev, ...newFilter }));
    setCurrentPage(1);
  }, []);

  // Handle sorting
  const handleSort = useCallback((key: keyof CrawlLink) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Get unique status codes from broken links
  const statusCodes = useMemo(() => {
    const codes = new Set(brokenLinks.map(link => link.status_code).filter((code): code is number => code !== undefined));
    return Array.from(codes).sort((a, b) => a - b);
  }, [brokenLinks]);

  // Get status code color
  const getStatusCodeColor = (code?: number) => {
    if (!code) return 'text-gray-600 bg-gray-50';
    if (code >= 400 && code < 500) return 'text-red-600 bg-red-50';
    if (code >= 500) return 'text-red-700 bg-red-100';
    return 'text-gray-600 bg-gray-50';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  };

  // Get sort icon
  const getSortIcon = (key: keyof CrawlLink) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <Loading text="Loading broken links..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (brokenLinks.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-8 text-center ${className}`}>
        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No broken links found</h3>
        <p className="mt-1 text-sm text-gray-500">
          All links are accessible and working properly!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with filters toggle and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Broken Links ({filteredAndSortedLinks.length})
          </h2>
          
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onExportBrokenLinks && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onExportBrokenLinks(filteredAndSortedLinks)}
              disabled={filteredAndSortedLinks.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Broken</div>
          <div className="text-2xl font-bold text-red-600">{brokenLinks.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">4xx Errors</div>
          <div className="text-2xl font-bold text-orange-600">
            {brokenLinks.filter(link => link.status_code && link.status_code >= 400 && link.status_code < 500).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">5xx Errors</div>
          <div className="text-2xl font-bold text-red-600">
            {brokenLinks.filter(link => link.status_code && link.status_code >= 500).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">No Response</div>
          <div className="text-2xl font-bold text-gray-600">
            {brokenLinks.filter(link => !link.status_code).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search URLs, anchor text..."
                value={filterConfig.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />
            </div>

            {/* Status Code Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Code
              </label>
              <select
                value={filterConfig.statusCode}
                onChange={(e) => handleFilterChange({ statusCode: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Status Codes</option>
                <option value="null">No Response</option>
                {statusCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            {/* Response Time Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Response Time (ms)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filterConfig.responseTimeMin}
                onChange={(e) => handleFilterChange({ responseTimeMin: e.target.value })}
              />
            </div>

            {/* Response Time Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Response Time (ms)
              </label>
              <Input
                type="number"
                placeholder="10000"
                value={filterConfig.responseTimeMax}
                onChange={(e) => handleFilterChange({ responseTimeMax: e.target.value })}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setFilterConfig({ search: '', statusCode: '', responseTimeMin: '', responseTimeMax: '' });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('url')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>URL</span>
                    {getSortIcon('url')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status_code')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Status</span>
                    {getSortIcon('status_code')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('response_time_ms')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Response Time</span>
                    {getSortIcon('response_time_ms')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('anchor_text')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Anchor Text</span>
                    {getSortIcon('anchor_text')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('checked_at')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Checked</span>
                    {getSortIcon('checked_at')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline break-all"
                      >
                        {link.url}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusCodeColor(link.status_code)}`}>
                      {link.status_code || 'No Response'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.response_time_ms}ms
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {link.anchor_text || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(link.checked_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {onLinkTest && (
                        <button
                          onClick={() => onLinkTest(link)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Test link again"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => navigator.clipboard.writeText(link.url)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Copy URL"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedLinks.length === 0 && filteredAndSortedLinks.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No broken links found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedLinks.length)} of {filteredAndSortedLinks.length} broken links
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokenLinksTable; 