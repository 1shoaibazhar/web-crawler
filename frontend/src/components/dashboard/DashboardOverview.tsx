import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Globe,
  Link,
  Activity
} from 'lucide-react';
import { ResponsiveGrid, ResponsiveCard } from '../common/ResponsiveLayout';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import type { CrawlTask } from '../../types';

interface DashboardOverviewProps {
  tasks: CrawlTask[];
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <ResponsiveCard className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </ResponsiveCard>
  );
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ tasks, loading = false }) => {
  const navigate = useNavigate();
  
  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const runningTasks = tasks.filter(task => task.status === 'running').length;
  const failedTasks = tasks.filter(task => task.status === 'failed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;

  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const averageProgress = runningTasks > 0 
    ? Math.round(tasks.filter(task => task.status === 'running').reduce((sum, task) => sum + task.progress, 0) / runningTasks)
    : 0;

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentTasks = tasks.filter(task => new Date(task.created_at) >= sevenDaysAgo);

  // Status distribution
  const statusDistribution = [
    { status: 'Completed', count: completedTasks, color: 'success' as const },
    { status: 'Running', count: runningTasks, color: 'primary' as const },
    { status: 'Pending', count: pendingTasks, color: 'warning' as const },
    { status: 'Failed', count: failedTasks, color: 'error' as const },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <ResponsiveGrid cols={4} gap="lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <ResponsiveCard key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <ResponsiveGrid cols={4} gap="lg">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={<Globe className="w-6 h-6" />}
          color="blue"
          subtitle="All time"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          subtitle="Completed tasks"
        />
        <StatCard
          title="Active Tasks"
          value={runningTasks}
          icon={<Play className="w-6 h-6" />}
          color="purple"
          subtitle="Currently running"
        />
        <StatCard
          title="Failed Tasks"
          value={failedTasks}
          icon={<AlertCircle className="w-6 h-6" />}
          color="red"
          subtitle="Need attention"
        />
      </ResponsiveGrid>

      {/* Status Overview */}
      <ResponsiveGrid cols={2} gap="lg">
        <ResponsiveCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <div className="space-y-3">
            {statusDistribution.map(({ status, count, color }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant={color} size="sm">
                    {status}
                  </Badge>
                  <span className="ml-2 text-sm text-gray-600">{count} tasks</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tasks created (7 days)</span>
              <span className="text-sm font-medium text-gray-900">{recentTasks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average progress</span>
              <span className="text-sm font-medium text-gray-900">{averageProgress}%</span>
            </div>
            {runningTasks > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active progress</span>
                  <span className="text-sm font-medium text-gray-900">{averageProgress}%</span>
                </div>
                <ProgressBar value={averageProgress} max={100} variant="primary" />
              </div>
            )}
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      {/* Quick Actions */}
      <ResponsiveCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/url-management')}
          >
            <Globe className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">New Crawl</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Activity className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">View Results</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Link className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Export Data</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Clock className="w-6 h-6 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Schedule</span>
          </button>
        </div>
      </ResponsiveCard>
    </div>
  );
}; 