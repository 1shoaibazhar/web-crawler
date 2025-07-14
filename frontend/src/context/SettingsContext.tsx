import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { settingsService, type CrawlSettings, type NotificationSettings, type SystemSettings, type SecuritySettings } from '../services/settings.service';

interface SettingsContextType {
  // Settings state
  crawlSettings: CrawlSettings;
  notificationSettings: NotificationSettings;
  systemSettings: SystemSettings;
  securitySettings: SecuritySettings;
  
  // Settings actions
  updateCrawlSettings: (settings: Partial<CrawlSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  
  // Utility actions
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  syncToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [crawlSettings, setCrawlSettings] = useState<CrawlSettings>(() => 
    settingsService.getCrawlSettings()
  );
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => 
    settingsService.getNotificationSettings()
  );
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => 
    settingsService.getSystemSettings()
  );
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => 
    settingsService.getSecuritySettings()
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize settings on mount
  useEffect(() => {
    settingsService.initialize();
  }, []);

  // Update crawl settings
  const updateCrawlSettings = useCallback((settings: Partial<CrawlSettings>) => {
    settingsService.setCrawlSettings(settings);
    setCrawlSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Update notification settings
  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    settingsService.setNotificationSettings(settings);
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Update system settings
  const updateSystemSettings = useCallback((settings: Partial<SystemSettings>) => {
    settingsService.setSystemSettings(settings);
    setSystemSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Update security settings
  const updateSecuritySettings = useCallback((settings: Partial<SecuritySettings>) => {
    settingsService.setSecuritySettings(settings);
    setSecuritySettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    settingsService.resetToDefaults();
    setCrawlSettings(settingsService.getCrawlSettings());
    setNotificationSettings(settingsService.getNotificationSettings());
    setSystemSettings(settingsService.getSystemSettings());
    setSecuritySettings(settingsService.getSecuritySettings());
  }, []);

  // Export settings
  const exportSettings = useCallback(() => {
    return settingsService.exportSettings();
  }, []);

  // Import settings
  const importSettings = useCallback((settingsJson: string) => {
    const success = settingsService.importSettings(settingsJson);
    if (success) {
      setCrawlSettings(settingsService.getCrawlSettings());
      setNotificationSettings(settingsService.getNotificationSettings());
      setSystemSettings(settingsService.getSystemSettings());
      setSecuritySettings(settingsService.getSecuritySettings());
    }
    return success;
  }, []);

  // Sync to server
  const syncToServer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await settingsService.syncSettingsToServer();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load from server
  const loadFromServer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await settingsService.loadSettingsFromServer();
      setCrawlSettings(settingsService.getCrawlSettings());
      setNotificationSettings(settingsService.getNotificationSettings());
      setSystemSettings(settingsService.getSystemSettings());
      setSecuritySettings(settingsService.getSecuritySettings());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: SettingsContextType = {
    crawlSettings,
    notificationSettings,
    systemSettings,
    securitySettings,
    updateCrawlSettings,
    updateNotificationSettings,
    updateSystemSettings,
    updateSecuritySettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    syncToServer,
    loadFromServer,
    isLoading,
    error,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 