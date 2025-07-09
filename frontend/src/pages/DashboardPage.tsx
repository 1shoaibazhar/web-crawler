import React from 'react';
import { Layout } from '../components/common/Layout';
import { Header } from '../components/common/Header';
import { CrawlTasksTable } from '../components/dashboard/CrawlTasksTable';
import type { TaskStatus } from '../types';

export const DashboardPage: React.FC = () => {
  // TODO: Fetch real data
  const mockTasks = [
    {
      id: 1,
      url: 'https://example.com',
      status: 'completed' as TaskStatus,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:30:00Z',
      user_id: 1,
      depth: 2,
      delay: 1000,
      timeout: 30000,
      progress: 100,
      links_found: 25,
      links_crawled: 25,
      error_message: undefined,
    },
  ];

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const handleTaskSelect = (task: any) => {
    console.log('Task selected:', task);
  };

  const handleTaskDelete = (taskId: string) => {
    console.log('Task delete:', taskId);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <Layout
      header={<Header title="Dashboard" user={mockUser} onLogout={handleLogout} />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Your Crawl Tasks</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            New Crawl
          </button>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg">
          <CrawlTasksTable
            tasks={mockTasks}
            onTaskSelect={handleTaskSelect}
            onTaskDelete={handleTaskDelete}
          />
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage; 