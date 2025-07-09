// Local storage service for token and user data persistence

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
  PREFERENCES: 'user_preferences',
} as const;

export class StorageService {
  // Token methods
  static setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  static removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  // Refresh token methods
  static setRefreshToken(refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static removeRefreshToken(): void {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // User methods
  static setUser(user: any): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  static getUser(): any | null {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  static removeUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // Preferences methods
  static setPreferences(preferences: any): void {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  }

  static getPreferences(): any | null {
    const preferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return preferences ? JSON.parse(preferences) : null;
  }

  static removePreferences(): void {
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
  }

  // Clear all data
  static clear(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
  }

  // Token utility methods
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  static getTokenPayload(token: string): any | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  static getTokenExpirationTime(token: string): number | null {
    try {
      const payload = this.getTokenPayload(token);
      return payload?.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  static getRemainingTokenTime(token: string): number {
    try {
      const expirationTime = this.getTokenExpirationTime(token);
      if (!expirationTime) return 0;
      return Math.max(0, expirationTime - Date.now());
    } catch {
      return 0;
    }
  }

  // Session storage methods (for temporary data)
  static setSessionData(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  static getSessionData(key: string): any | null {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static removeSessionData(key: string): void {
    sessionStorage.removeItem(key);
  }

  static clearSessionData(): void {
    sessionStorage.clear();
  }

  // Storage availability check
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Secure storage methods (for sensitive data)
  static setSecureData(key: string, value: any): void {
    // In a real app, you might want to encrypt this data
    localStorage.setItem(`secure_${key}`, JSON.stringify(value));
  }

  static getSecureData(key: string): any | null {
    const data = localStorage.getItem(`secure_${key}`);
    return data ? JSON.parse(data) : null;
  }

  static removeSecureData(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  // Backup and restore methods
  static backupData(): string {
    const data = {
      token: this.getToken(),
      refreshToken: this.getRefreshToken(),
      user: this.getUser(),
      preferences: this.getPreferences(),
    };
    return JSON.stringify(data);
  }

  static restoreData(backupData: string): boolean {
    try {
      const data = JSON.parse(backupData);
      if (data.token) this.setToken(data.token);
      if (data.refreshToken) this.setRefreshToken(data.refreshToken);
      if (data.user) this.setUser(data.user);
      if (data.preferences) this.setPreferences(data.preferences);
      return true;
    } catch {
      return false;
    }
  }

  // Storage size calculation
  static getStorageSize(): number {
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return totalSize;
  }

  // Storage quota check
  static async getStorageQuota(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
} 