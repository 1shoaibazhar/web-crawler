import React from 'react';
import { Layout } from '../components/common/Layout';
import { Header } from '../components/common/Header';
import { LinkChart } from '../components/charts/LinkChart';

export const CrawlDetailsPage: React.FC = () => {
  // TODO: Fetch real data based on route params
  const mockData = {
    internal: 15,
    external: 10,
    broken: 2,
  };

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <Layout
      header={<Header title="Crawl Details" user={mockUser} onLogout={handleLogout} />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Crawl Results</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Re-run Crawl
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LinkChart data={mockData} />
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crawl Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">URL:</span>
                <span className="font-medium">https://example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Completed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Links:</span>
                <span className="font-medium">{mockData.internal + mockData.external + mockData.broken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Depth:</span>
                <span className="font-medium">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CrawlDetailsPage; 