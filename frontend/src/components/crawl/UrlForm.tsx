import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ErrorMessage } from '../common/ErrorMessage';
import { Loading } from '../common/Loading';
import { crawlService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import type { CrawlTaskRequest } from '../../types';

interface UrlFormProps {
  onSubmit?: (data: CrawlTaskRequest) => void;
  onSuccess?: (task: any) => void;
  initialUrl?: string;
  className?: string;
}

interface FormData extends CrawlTaskRequest {
  // Additional form-specific fields
  enableRobots: boolean;
  enableSitemap: boolean;
  enableCustomHeaders: boolean;
  customHeaders: string;
}

export const UrlForm: React.FC<UrlFormProps> = ({
  onSubmit,
  onSuccess,
  initialUrl = '',
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      url: initialUrl,
      max_depth: 2,
      max_pages: 100,
      delay: 1000,
      timeout: 30000,
      follow_redirects: true,
      respect_robots_txt: true,
      user_agent: 'WebCrawler/1.0',
      enableRobots: true,
      enableSitemap: false,
      enableCustomHeaders: false,
      customHeaders: '',
    },
  });

  const watchEnableCustomHeaders = watch('enableCustomHeaders');

  const validateUrl = (url: string): boolean | string => {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL must use HTTP or HTTPS protocol';
      }
      return true;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const parseCustomHeaders = (headersString: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (!headersString.trim()) return headers;

    try {
      const lines = headersString.split('\n');
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          headers[key.trim()] = valueParts.join(':').trim();
        }
      }
    } catch (error) {
      console.warn('Failed to parse custom headers:', error);
    }

    return headers;
  };

  const onFormSubmit = async (data: FormData) => {
    if (!isAuthenticated) {
      setSubmitError('Please log in to start a crawl');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare crawl request
      const crawlRequest: CrawlTaskRequest = {
        url: data.url.trim(),
        max_depth: data.max_depth,
        max_pages: data.max_pages,
        delay: data.delay,
        timeout: data.timeout,
        follow_redirects: data.follow_redirects,
        respect_robots_txt: data.respect_robots_txt,
        user_agent: data.user_agent,
      };

      // Add custom headers if enabled
      if (data.enableCustomHeaders && data.customHeaders) {
        const customHeaders = parseCustomHeaders(data.customHeaders);
        if (Object.keys(customHeaders).length > 0) {
          crawlRequest.headers = customHeaders;
        }
      }

      // Call custom onSubmit if provided
      if (onSubmit) {
        onSubmit(crawlRequest);
        return;
      }

      // Otherwise, use the crawl service
      const task = await crawlService.createTask(crawlRequest);
      
      // Reset form on success
      reset();
      
      // Call success callback
      if (onSuccess) {
        onSuccess(task);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start crawl';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadExampleUrl = (exampleUrl: string) => {
    setValue('url', exampleUrl);
  };

  const resetToDefaults = () => {
    reset();
    setShowAdvanced(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Start New Crawl</h2>
        <p className="text-gray-600">
          Enter a URL to begin crawling and configure advanced options as needed.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL to Crawl *
          </label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            className={errors.url ? 'border-red-500' : ''}
            {...register('url', {
              required: 'URL is required',
              validate: validateUrl,
            })}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
          
          {/* Example URLs */}
          <div className="mt-2">
            <span className="text-xs text-gray-500">Quick examples:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                'https://example.com',
                'https://httpbin.org',
                'https://jsonplaceholder.typicode.com',
              ].map((exampleUrl) => (
                <button
                  key={exampleUrl}
                  type="button"
                  onClick={() => loadExampleUrl(exampleUrl)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {exampleUrl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="max_depth" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Depth
            </label>
            <Input
              id="max_depth"
              type="number"
              min="1"
              max="10"
              className={errors.max_depth ? 'border-red-500' : ''}
              {...register('max_depth', {
                required: 'Maximum depth is required',
                min: { value: 1, message: 'Minimum depth is 1' },
                max: { value: 10, message: 'Maximum depth is 10' },
                valueAsNumber: true,
              })}
            />
            {errors.max_depth && (
              <p className="mt-1 text-sm text-red-600">{errors.max_depth.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">How deep to crawl (1-10)</p>
          </div>

          <div>
            <label htmlFor="max_pages" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Pages
            </label>
            <Input
              id="max_pages"
              type="number"
              min="1"
              max="10000"
              className={errors.max_pages ? 'border-red-500' : ''}
              {...register('max_pages', {
                required: 'Maximum pages is required',
                min: { value: 1, message: 'Minimum pages is 1' },
                max: { value: 10000, message: 'Maximum pages is 10000' },
                valueAsNumber: true,
              })}
            />
            {errors.max_pages && (
              <p className="mt-1 text-sm text-red-600">{errors.max_pages.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Maximum number of pages to crawl</p>
          </div>
        </div>

        {/* Advanced Configuration Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <svg
              className={`w-4 h-4 mr-1 transform transition-transform ${
                showAdvanced ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Options
          </button>
        </div>

        {/* Advanced Configuration */}
        {showAdvanced && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="delay" className="block text-sm font-medium text-gray-700 mb-1">
                  Delay Between Requests (ms)
                </label>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  max="60000"
                  className={errors.delay ? 'border-red-500' : ''}
                  {...register('delay', {
                    min: { value: 0, message: 'Delay cannot be negative' },
                    max: { value: 60000, message: 'Maximum delay is 60 seconds' },
                    valueAsNumber: true,
                  })}
                />
                {errors.delay && (
                  <p className="mt-1 text-sm text-red-600">{errors.delay.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Polite crawling delay</p>
              </div>

              <div>
                <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-1">
                  Request Timeout (ms)
                </label>
                <Input
                  id="timeout"
                  type="number"
                  min="1000"
                  max="300000"
                  className={errors.timeout ? 'border-red-500' : ''}
                  {...register('timeout', {
                    min: { value: 1000, message: 'Minimum timeout is 1 second' },
                    max: { value: 300000, message: 'Maximum timeout is 5 minutes' },
                    valueAsNumber: true,
                  })}
                />
                {errors.timeout && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeout.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Request timeout</p>
              </div>
            </div>

            <div>
              <label htmlFor="user_agent" className="block text-sm font-medium text-gray-700 mb-1">
                User Agent
              </label>
              <Input
                id="user_agent"
                type="text"
                className={errors.user_agent ? 'border-red-500' : ''}
                {...register('user_agent', {
                  required: 'User agent is required',
                  minLength: { value: 3, message: 'User agent too short' },
                })}
              />
              {errors.user_agent && (
                <p className="mt-1 text-sm text-red-600">{errors.user_agent.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">HTTP User-Agent header</p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="follow_redirects"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('follow_redirects')}
                />
                <label htmlFor="follow_redirects" className="ml-2 block text-sm text-gray-900">
                  Follow HTTP redirects
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="respect_robots_txt"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('respect_robots_txt')}
                />
                <label htmlFor="respect_robots_txt" className="ml-2 block text-sm text-gray-900">
                  Respect robots.txt
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="enableCustomHeaders"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('enableCustomHeaders')}
                />
                <label htmlFor="enableCustomHeaders" className="ml-2 block text-sm text-gray-900">
                  Add custom HTTP headers
                </label>
              </div>
            </div>

            {/* Custom Headers */}
            {watchEnableCustomHeaders && (
              <div>
                <label htmlFor="customHeaders" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Headers
                </label>
                <textarea
                  id="customHeaders"
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Authorization: Bearer token123&#10;X-Custom-Header: value&#10;Accept-Language: en-US"
                  {...register('customHeaders')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  One header per line in format "Header-Name: value"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {submitError && <ErrorMessage message={submitError} />}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || !isAuthenticated}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loading size="small" text="" />
                  <span className="ml-2">Starting...</span>
                </div>
              ) : (
                'Start Crawl'
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={resetToDefaults}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          </div>

          {!isAuthenticated && (
            <p className="text-sm text-red-600">
              Please log in to start crawling
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default UrlForm; 