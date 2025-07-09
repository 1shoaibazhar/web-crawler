// URL utility functions

/**
 * Parse URL and return its components
 */
export function parseUrl(url: string): {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
} | null {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash
    };
  } catch {
    return null;
  }
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Get root domain (remove subdomains)
 */
export function getRootDomain(url: string): string | null {
  const domain = getDomain(url);
  if (!domain) return null;
  
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  
  return parts.slice(-2).join('.');
}

/**
 * Check if URL is absolute
 */
export function isAbsolute(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL is relative
 */
export function isRelative(url: string): boolean {
  return !isAbsolute(url);
}

/**
 * Join URL paths
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .map(path => path.replace(/^\/+|\/+$/g, ''))
    .filter(path => path.length > 0)
    .join('/');
}

/**
 * Build URL with base and path
 */
export function buildUrl(base: string, path: string = ''): string {
  try {
    const baseUrl = new URL(base);
    if (path) {
      baseUrl.pathname = joinPaths(baseUrl.pathname, path);
    }
    return baseUrl.toString();
  } catch {
    return base;
  }
}

/**
 * Add query parameters to URL
 */
export function addQueryParams(url: string, params: Record<string, string | number | boolean>): string {
  try {
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, String(value));
    });
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Remove query parameters from URL
 */
export function removeQueryParams(url: string, keys: string[]): string {
  try {
    const urlObj = new URL(url);
    keys.forEach(key => urlObj.searchParams.delete(key));
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Get query parameter value
 */
export function getQueryParam(url: string, key: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(key);
  } catch {
    return null;
  }
}

/**
 * Get all query parameters as object
 */
export function getQueryParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * Remove fragment from URL
 */
export function removeFragment(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URLs are from same origin
 */
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const urlObj1 = new URL(url1);
    const urlObj2 = new URL(url2);
    return urlObj1.origin === urlObj2.origin;
  } catch {
    return false;
  }
}

/**
 * Check if URL is external (different origin)
 */
export function isExternal(url: string, baseUrl: string = window.location.href): boolean {
  return !isSameOrigin(url, baseUrl);
}

/**
 * Normalize URL (remove trailing slash, lowercase domain)
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hostname = urlObj.hostname.toLowerCase();
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is HTTP or HTTPS
 */
export function isHttpUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Convert HTTP URL to HTTPS
 */
export function toHttps(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    const lastSlash = pathname.lastIndexOf('/');
    
    if (lastDot > lastSlash && lastDot !== -1) {
      return pathname.substring(lastDot + 1).toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if URL points to an image
 */
export function isImageUrl(url: string): boolean {
  const extension = getFileExtension(url);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return extension ? imageExtensions.includes(extension) : false;
}

/**
 * Encode URL component safely
 */
export function encodeUrlComponent(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Decode URL component safely
 */
export function decodeUrlComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
} 