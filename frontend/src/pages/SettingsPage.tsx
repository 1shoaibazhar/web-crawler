import React, { useState, useCallback } from 'react';
import { Layout } from '../components/common/Layout';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SettingsImportExport } from '../components/settings/SettingsImportExport';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import type { UserInfo } from '../types';

interface CrawlSettings {
  defaultMaxDepth: number;
  defaultMaxPages: number;
  defaultDelay: number;
  defaultTimeout: number;
  defaultUserAgent: string;
  followRedirects: boolean;
  respectRobotsTxt: boolean;
  enableSitemap: boolean;
  enableCustomHeaders: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  webSocketNotifications: boolean;
  taskCompleted: boolean;
  taskFailed: boolean;
  taskStopped: boolean;
  bulkOperations: boolean;
}

interface SystemSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  autoRefresh: boolean;
  refreshInterval: number;
  showProgressBars: boolean;
  enableAnimations: boolean;
}

interface SecuritySettings {
  sessionTimeout: number;
  requirePasswordChange: boolean;
  twoFactorAuth: boolean;
  loginNotifications: boolean;
  apiKeyRotation: boolean;
}

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { 
    crawlSettings, 
    notificationSettings, 
    systemSettings, 
    securitySettings,
    updateCrawlSettings,
    updateNotificationSettings,
    updateSystemSettings,
    updateSecuritySettings,
    resetToDefaults,
    isLoading,
    error: settingsError
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.username || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Mock user for demo
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const handleProfileUpdate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePasswordChange = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [passwordForm]);

  const handleCrawlSettingsUpdate = useCallback(() => {
    setSuccess('Crawl settings updated successfully');
  }, []);

  const handleNotificationSettingsUpdate = useCallback(() => {
    setSuccess('Notification settings updated successfully');
  }, []);

  const handleSystemSettingsUpdate = useCallback(() => {
    setSuccess('System settings updated successfully');
  }, []);

  const handleSecuritySettingsUpdate = useCallback(() => {
    setSuccess('Security settings updated successfully');
  }, []);

  const handleResetToDefaults = useCallback(() => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      resetToDefaults();
      setSuccess('Settings reset to defaults successfully');
    }
  }, [resetToDefaults]);

  const handleLogout = useCallback(() => {
    console.log('Logout clicked');
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'crawl', label: 'Crawl Settings', icon: '🕷️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <Button
            onClick={handleProfileUpdate}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <Loading size="small" text="" />
                <span className="ml-2">Updating...</span>
              </div>
            ) : (
              'Update Profile'
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <Button
            onClick={handlePasswordChange}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <Loading size="small" text="" />
                <span className="ml-2">Changing...</span>
              </div>
            ) : (
              'Change Password'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCrawlSettingsTab = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Crawl Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="max_depth" className="block text-sm font-medium text-gray-700 mb-1">
              Default Max Depth
            </label>
            <Input
              id="max_depth"
              type="number"
              value={crawlSettings.defaultMaxDepth.toString()}
              onChange={(e) => updateCrawlSettings({ defaultMaxDepth: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-gray-500 mt-1">How deep to crawl by default (1-10)</p>
          </div>
          
          <div>
            <label htmlFor="max_pages" className="block text-sm font-medium text-gray-700 mb-1">
              Default Max Pages
            </label>
            <Input
              id="max_pages"
              type="number"
              value={crawlSettings.defaultMaxPages.toString()}
              onChange={(e) => updateCrawlSettings({ defaultMaxPages: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-gray-500 mt-1">Maximum pages to crawl by default</p>
          </div>
          
          <div>
            <label htmlFor="delay" className="block text-sm font-medium text-gray-700 mb-1">
              Default Delay (ms)
            </label>
            <Input
              id="delay"
              type="number"
              value={crawlSettings.defaultDelay.toString()}
              onChange={(e) => updateCrawlSettings({ defaultDelay: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-gray-500 mt-1">Delay between requests in milliseconds</p>
          </div>
          
          <div>
            <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-1">
              Default Timeout (ms)
            </label>
            <Input
              id="timeout"
              type="number"
              value={crawlSettings.defaultTimeout.toString()}
              onChange={(e) => updateCrawlSettings({ defaultTimeout: parseInt(e.target.value) || 30000 })}
            />
            <p className="text-xs text-gray-500 mt-1">Request timeout in milliseconds</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default User Agent
            </label>
            <Input
              type="text"
              value={crawlSettings.defaultUserAgent}
              onChange={(e) => updateCrawlSettings({ defaultUserAgent: e.target.value })}
              placeholder="WebCrawler/1.0"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="followRedirects"
                checked={crawlSettings.followRedirects}
                onChange={(e) => updateCrawlSettings({ followRedirects: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="followRedirects" className="ml-2 block text-sm text-gray-900">
                Follow HTTP redirects by default
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="respectRobotsTxt"
                checked={crawlSettings.respectRobotsTxt}
                onChange={(e) => updateCrawlSettings({ respectRobotsTxt: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="respectRobotsTxt" className="ml-2 block text-sm text-gray-900">
                Respect robots.txt by default
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableSitemap"
                checked={crawlSettings.enableSitemap}
                onChange={(e) => updateCrawlSettings({ enableSitemap: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableSitemap" className="ml-2 block text-sm text-gray-900">
                Enable sitemap discovery by default
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableCustomHeaders"
                checked={crawlSettings.enableCustomHeaders}
                onChange={(e) => updateCrawlSettings({ enableCustomHeaders: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableCustomHeaders" className="ml-2 block text-sm text-gray-900">
                Enable custom headers by default
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Button onClick={handleCrawlSettingsUpdate}>
          Save Crawl Settings
        </Button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Notification Channels</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => updateNotificationSettings({ emailNotifications: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                Email notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="webSocketNotifications"
                checked={notificationSettings.webSocketNotifications}
                onChange={(e) => updateNotificationSettings({ webSocketNotifications: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="webSocketNotifications" className="ml-2 block text-sm text-gray-900">
                Real-time WebSocket notifications
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Event Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="taskCompleted"
                checked={notificationSettings.taskCompleted}
                onChange={(e) => updateNotificationSettings({ taskCompleted: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="taskCompleted" className="ml-2 block text-sm text-gray-900">
                Task completed
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="taskFailed"
                checked={notificationSettings.taskFailed}
                onChange={(e) => updateNotificationSettings({ taskFailed: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="taskFailed" className="ml-2 block text-sm text-gray-900">
                Task failed
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="taskStopped"
                checked={notificationSettings.taskStopped}
                onChange={(e) => updateNotificationSettings({ taskStopped: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="taskStopped" className="ml-2 block text-sm text-gray-900">
                Task stopped/cancelled
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="bulkOperations"
                checked={notificationSettings.bulkOperations}
                onChange={(e) => updateNotificationSettings({ bulkOperations: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="bulkOperations" className="ml-2 block text-sm text-gray-900">
                Bulk operations completed
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Button onClick={handleNotificationSettingsUpdate}>
          Save Notification Settings
        </Button>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Preferences</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              value={systemSettings.theme}
              onChange={(e) => updateSystemSettings({ theme: e.target.value as 'light' | 'dark' | 'auto' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={systemSettings.language}
              onChange={(e) => updateSystemSettings({ language: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={systemSettings.timezone}
              onChange={(e) => updateSystemSettings({ timezone: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Format
            </label>
            <select
              value={systemSettings.timeFormat}
              onChange={(e) => updateSystemSettings({ timeFormat: e.target.value as '12h' | '24h' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 mb-1">
              Auto-refresh Interval (ms)
            </label>
            <Input
              id="refreshInterval"
              type="number"
              value={systemSettings.refreshInterval.toString()}
              onChange={(e) => updateSystemSettings({ refreshInterval: parseInt(e.target.value) || 5000 })}
            />
            <p className="text-xs text-gray-500 mt-1">How often to refresh data automatically</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={systemSettings.autoRefresh}
                onChange={(e) => updateSystemSettings({ autoRefresh: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="ml-2 block text-sm text-gray-900">
                Enable auto-refresh
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showProgressBars"
                checked={systemSettings.showProgressBars}
                onChange={(e) => updateSystemSettings({ showProgressBars: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showProgressBars" className="ml-2 block text-sm text-gray-900">
                Show progress bars
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAnimations"
                checked={systemSettings.enableAnimations}
                onChange={(e) => updateSystemSettings({ enableAnimations: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableAnimations" className="ml-2 block text-sm text-gray-900">
                Enable animations
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Button onClick={handleSystemSettingsUpdate}>
          Save System Settings
        </Button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-1">
            Session Timeout (seconds)
          </label>
          <Input
            id="sessionTimeout"
            type="number"
            value={securitySettings.sessionTimeout.toString()}
            onChange={(e) => updateSecuritySettings({ sessionTimeout: parseInt(e.target.value) || 3600 })}
          />
          <p className="text-xs text-gray-500 mt-1">How long before automatic logout (5 minutes to 24 hours)</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requirePasswordChange"
              checked={securitySettings.requirePasswordChange}
              onChange={(e) => updateSecuritySettings({ requirePasswordChange: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requirePasswordChange" className="ml-2 block text-sm text-gray-900">
              Require password change on next login
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactorAuth"
              checked={securitySettings.twoFactorAuth}
              onChange={(e) => updateSecuritySettings({ twoFactorAuth: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-900">
              Enable two-factor authentication
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="loginNotifications"
              checked={securitySettings.loginNotifications}
              onChange={(e) => updateSecuritySettings({ loginNotifications: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="loginNotifications" className="ml-2 block text-sm text-gray-900">
              Notify on new login
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="apiKeyRotation"
              checked={securitySettings.apiKeyRotation}
              onChange={(e) => updateSecuritySettings({ apiKeyRotation: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="apiKeyRotation" className="ml-2 block text-sm text-gray-900">
              Enable automatic API key rotation
            </label>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Button onClick={handleSecuritySettingsUpdate}>
          Save Security Settings
        </Button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'crawl':
        return renderCrawlSettingsTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'system':
        return renderSystemTab();
      case 'security':
        return renderSecurityTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <Layout
      header={<Header title="Settings" user={mockUser} onLogout={handleLogout} />}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings & Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings, preferences, and system configuration
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && <ErrorMessage message={error} />}
        {settingsError && <ErrorMessage message={settingsError} />}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Import/Export Settings */}
        <SettingsImportExport />

        {/* Reset to Defaults */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Reset all settings to their default values. This action cannot be undone.
          </p>
          <Button
            onClick={handleResetToDefaults}
            variant="danger"
            size="small"
          >
            Reset to Defaults
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
}; 