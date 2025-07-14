import { useSettings as useSettingsContext } from '../context/SettingsContext';

// Re-export the settings hook for convenience
export const useSettings = useSettingsContext;

// Additional utility hooks for specific settings
export const useCrawlSettings = () => {
  const { crawlSettings, updateCrawlSettings } = useSettingsContext();
  return { crawlSettings, updateCrawlSettings };
};

export const useNotificationSettings = () => {
  const { notificationSettings, updateNotificationSettings } = useSettingsContext();
  return { notificationSettings, updateNotificationSettings };
};

export const useSystemSettings = () => {
  const { systemSettings, updateSystemSettings } = useSettingsContext();
  return { systemSettings, updateSystemSettings };
};

export const useSecuritySettings = () => {
  const { securitySettings, updateSecuritySettings } = useSettingsContext();
  return { securitySettings, updateSecuritySettings };
};

export const useTheme = () => {
  const { systemSettings, updateSystemSettings } = useSettingsContext();
  
  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    updateSystemSettings({ theme });
  };
  
  return {
    theme: systemSettings.theme,
    setTheme,
    isDark: systemSettings.theme === 'dark' || 
            (systemSettings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
}; 