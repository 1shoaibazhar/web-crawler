import { apiService } from './api.service';
import { StorageService } from './storage.service';

// Settings interfaces
export interface CrawlSettings {
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

export interface NotificationSettings {
  emailNotifications: boolean;
  webSocketNotifications: boolean;
  taskCompleted: boolean;
  taskFailed: boolean;
  taskStopped: boolean;
  bulkOperations: boolean;
}

export interface SystemSettings {
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

export interface SecuritySettings {
  sessionTimeout: number;
  requirePasswordChange: boolean;
  twoFactorAuth: boolean;
  loginNotifications: boolean;
  apiKeyRotation: boolean;
}

export interface UserProfile {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  settings?: any;
}

export interface ProfileUpdateRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// Default settings
export const DEFAULT_CRAWL_SETTINGS: CrawlSettings = {
  defaultMaxDepth: 2,
  defaultMaxPages: 100,
  defaultDelay: 1000,
  defaultTimeout: 30000,
  defaultUserAgent: 'WebCrawler/1.0',
  followRedirects: true,
  respectRobotsTxt: true,
  enableSitemap: false,
  enableCustomHeaders: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  webSocketNotifications: true,
  taskCompleted: true,
  taskFailed: true,
  taskStopped: false,
  bulkOperations: true,
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  theme: 'light',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '24h',
  autoRefresh: true,
  refreshInterval: 5000,
  showProgressBars: true,
  enableAnimations: true,
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  sessionTimeout: 3600,
  requirePasswordChange: false,
  twoFactorAuth: false,
  loginNotifications: true,
  apiKeyRotation: false,
};

export class SettingsService {
  private static instance: SettingsService;
  private storagePrefix = 'webcrawler_settings_';

  private constructor() {}

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  // Local Storage Methods
  private getStorageKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Error reading setting ${key}:`, error);
      return defaultValue;
    }
  }

  private setToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
    }
  }

  // Crawl Settings
  getCrawlSettings(): CrawlSettings {
    return this.getFromStorage('crawl', DEFAULT_CRAWL_SETTINGS);
  }

  setCrawlSettings(settings: Partial<CrawlSettings>): void {
    const current = this.getCrawlSettings();
    const updated = { ...current, ...settings };
    this.setToStorage('crawl', updated);
  }

  // Notification Settings
  getNotificationSettings(): NotificationSettings {
    return this.getFromStorage('notifications', DEFAULT_NOTIFICATION_SETTINGS);
  }

  setNotificationSettings(settings: Partial<NotificationSettings>): void {
    const current = this.getNotificationSettings();
    const updated = { ...current, ...settings };
    this.setToStorage('notifications', updated);
  }

  // System Settings
  getSystemSettings(): SystemSettings {
    return this.getFromStorage('system', DEFAULT_SYSTEM_SETTINGS);
  }

  setSystemSettings(settings: Partial<SystemSettings>): void {
    const current = this.getSystemSettings();
    const updated = { ...current, ...settings };
    this.setToStorage('system', updated);
    
    // Apply theme immediately
    if (settings.theme) {
      this.applyTheme(settings.theme);
    }
  }

  // Security Settings
  getSecuritySettings(): SecuritySettings {
    return this.getFromStorage('security', DEFAULT_SECURITY_SETTINGS);
  }

  setSecuritySettings(settings: Partial<SecuritySettings>): void {
    const current = this.getSecuritySettings();
    const updated = { ...current, ...settings };
    this.setToStorage('security', updated);
  }

  // Theme Management
  applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }

  // API Methods
  async syncSettingsToServer(): Promise<SettingsResponse> {
    try {
      const settings = {
        crawl: this.getCrawlSettings(),
        notifications: this.getNotificationSettings(),
        system: this.getSystemSettings(),
        security: this.getSecuritySettings(),
      };

      const response = await apiService.post<SettingsResponse>('/api/v1/settings/sync', settings);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async loadSettingsFromServer(): Promise<SettingsResponse> {
    try {
      const response = await apiService.get<SettingsResponse>('/api/v1/settings');
      
      if (response.success && response.settings) {
        // Update local storage with server settings
        if (response.settings.crawl) {
          this.setToStorage('crawl', response.settings.crawl);
        }
        if (response.settings.notifications) {
          this.setToStorage('notifications', response.settings.notifications);
        }
        if (response.settings.system) {
          this.setToStorage('system', response.settings.system);
        }
        if (response.settings.security) {
          this.setToStorage('security', response.settings.security);
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(profile: ProfileUpdateRequest): Promise<SettingsResponse> {
    try {
      const response = await apiService.put<SettingsResponse>('/api/v1/user/profile', profile);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(passwordData: PasswordChangeRequest): Promise<SettingsResponse> {
    try {
      const response = await apiService.put<SettingsResponse>('/api/v1/user/password', passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Utility Methods
  resetToDefaults(): void {
    this.setCrawlSettings(DEFAULT_CRAWL_SETTINGS);
    this.setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
    this.setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
    this.setSecuritySettings(DEFAULT_SECURITY_SETTINGS);
  }

  exportSettings(): string {
    const settings = {
      crawl: this.getCrawlSettings(),
      notifications: this.getNotificationSettings(),
      system: this.getSystemSettings(),
      security: this.getSecuritySettings(),
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(settings, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const settings = JSON.parse(settingsJson);
      
      if (settings.crawl) {
        this.setCrawlSettings(settings.crawl);
      }
      if (settings.notifications) {
        this.setNotificationSettings(settings.notifications);
      }
      if (settings.system) {
        this.setSystemSettings(settings.system);
      }
      if (settings.security) {
        this.setSecuritySettings(settings.security);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }

  // Initialize settings on app startup
  initialize(): void {
    // Apply current theme
    const systemSettings = this.getSystemSettings();
    this.applyTheme(systemSettings.theme);
    
    // Listen for system theme changes
    if (systemSettings.theme === 'auto') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.applyTheme('auto');
      });
    }
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance(); 