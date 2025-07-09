import React, { useState } from 'react';

interface CrawlFormProps {
  onSubmit?: (data: CrawlFormData) => void;
  isLoading?: boolean;
}

interface CrawlFormData {
  url: string;
  depth: number;
  delay: number;
  timeout: number;
}

export const CrawlForm: React.FC<CrawlFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<CrawlFormData>({
    url: '',
    depth: 1,
    delay: 1000,
    timeout: 30000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const handleChange = (field: keyof CrawlFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          URL to Crawl
        </label>
        <input
          id="url"
          type="url"
          required
          value={formData.url}
          onChange={(e) => handleChange('url', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label htmlFor="depth" className="block text-sm font-medium text-gray-700">
          Crawl Depth
        </label>
        <input
          id="depth"
          type="number"
          min="1"
          max="10"
          value={formData.depth}
          onChange={(e) => handleChange('depth', parseInt(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="delay" className="block text-sm font-medium text-gray-700">
          Delay (ms)
        </label>
        <input
          id="delay"
          type="number"
          min="0"
          max="60000"
          value={formData.delay}
          onChange={(e) => handleChange('delay', parseInt(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="timeout" className="block text-sm font-medium text-gray-700">
          Timeout (ms)
        </label>
        <input
          id="timeout"
          type="number"
          min="1000"
          max="300000"
          value={formData.timeout}
          onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Starting Crawl...' : 'Start Crawl'}
      </button>
    </form>
  );
};

export default CrawlForm; 