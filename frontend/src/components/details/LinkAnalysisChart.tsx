import React from 'react';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import type { CrawlResult, CrawlLink } from '../../types';

interface LinkAnalysisChartProps {
  results?: CrawlResult;
  links: CrawlLink[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export const LinkAnalysisChart: React.FC<LinkAnalysisChartProps> = ({
  results,
  links,
  loading = false,
  error = null,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <Loading text="Loading link analysis..." />
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

  // Calculate link statistics
  const internalLinks = links.filter(link => link.link_type === 'internal');
  const externalLinks = links.filter(link => link.link_type === 'external');
  const accessibleLinks = links.filter(link => link.is_accessible);
  const brokenLinks = links.filter(link => !link.is_accessible);
  
  const totalLinks = links.length;
  
  // Prepare chart data for link types
  const linkTypeData: ChartData[] = [
    {
      label: 'Internal Links',
      value: internalLinks.length,
      color: 'bg-blue-500',
      percentage: totalLinks > 0 ? Math.round((internalLinks.length / totalLinks) * 100) : 0,
    },
    {
      label: 'External Links',
      value: externalLinks.length,
      color: 'bg-green-500',
      percentage: totalLinks > 0 ? Math.round((externalLinks.length / totalLinks) * 100) : 0,
    },
  ];

  // Prepare chart data for link status
  const linkStatusData: ChartData[] = [
    {
      label: 'Accessible',
      value: accessibleLinks.length,
      color: 'bg-green-500',
      percentage: totalLinks > 0 ? Math.round((accessibleLinks.length / totalLinks) * 100) : 0,
    },
    {
      label: 'Broken',
      value: brokenLinks.length,
      color: 'bg-red-500',
      percentage: totalLinks > 0 ? Math.round((brokenLinks.length / totalLinks) * 100) : 0,
    },
  ];

  // HTTP Status Code analysis
  const statusCodes = links.reduce((acc, link) => {
    if (link.status_code) {
      acc[link.status_code] = (acc[link.status_code] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const statusCodeData = Object.entries(statusCodes)
    .map(([code, count]) => ({
      label: `${code}`,
      value: count,
      color: getStatusCodeColor(parseInt(code)),
      percentage: totalLinks > 0 ? Math.round((count / totalLinks) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Average response time
  const avgResponseTime = links.length > 0 
    ? Math.round(links.reduce((sum, link) => sum + link.response_time_ms, 0) / links.length)
    : 0;

  function getStatusCodeColor(code: number): string {
    if (code >= 200 && code < 300) return 'bg-green-500';
    if (code >= 300 && code < 400) return 'bg-yellow-500';
    if (code >= 400 && code < 500) return 'bg-red-500';
    if (code >= 500) return 'bg-red-700';
    return 'bg-gray-500';
  }

  const PieChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        {/* Simple Bar Chart */}
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-900 font-medium">
                  {item.value} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${item.color}`}
                  style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Total: {data.reduce((sum, item) => sum + item.value, 0)} links
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Links</p>
              <p className="text-2xl font-bold text-gray-900">{totalLinks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Accessible</p>
              <p className="text-2xl font-bold text-gray-900">{accessibleLinks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Broken</p>
              <p className="text-2xl font-bold text-gray-900">{brokenLinks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900">{avgResponseTime}ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart data={linkTypeData} title="Link Types Distribution" />
        <PieChart data={linkStatusData} title="Link Status Distribution" />
      </div>

      {/* HTTP Status Codes */}
      {statusCodeData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Status Codes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusCodeData.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded ${item.color} mr-3`} />
                  <span className="text-sm font-medium text-gray-900">
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Metrics from CrawlResult */}
      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Page Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Page Title:</span>
                  <span className="text-gray-900 font-medium">{results.page_title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HTML Version:</span>
                  <span className="text-gray-900 font-medium">{results.html_version || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Has Login Form:</span>
                  <span className={`font-medium ${results.has_login_form ? 'text-green-600' : 'text-gray-600'}`}>
                    {results.has_login_form ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="text-gray-900 font-medium">{results.response_time_ms}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Page Size:</span>
                  <span className="text-gray-900 font-medium">
                    {(results.page_size_bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Heading Distribution</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">H1:</span>
                  <span className="text-gray-900 font-medium">{results.h1_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">H2:</span>
                  <span className="text-gray-900 font-medium">{results.h2_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">H3:</span>
                  <span className="text-gray-900 font-medium">{results.h3_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">H4-H6:</span>
                  <span className="text-gray-900 font-medium">
                    {results.h4_count + results.h5_count + results.h6_count}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkAnalysisChart; 