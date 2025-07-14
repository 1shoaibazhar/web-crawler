import { useNotifications } from '../context/NotificationContext';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.message === 'string';
};

export const isValidationError = (error: any): error is ValidationError => {
  return error && typeof error.field === 'string' && typeof error.message === 'string';
};

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const parseError = (error: any): AppError => {
  if (isAppError(error)) {
    return error;
  }

  if (isApiError(error)) {
    return new AppError(error.message, error.status, error.code, error.details);
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  if (typeof error === 'string') {
    return new AppError(error);
  }

  return new AppError('An unexpected error occurred');
};

export const getErrorMessage = (error: any): string => {
  const appError = parseError(error);

  // Handle specific error codes
  switch (appError.code) {
    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection.';
    case 'UNAUTHORIZED':
      return 'You are not authorized to perform this action. Please log in again.';
    case 'FORBIDDEN':
      return 'You do not have permission to access this resource.';
    case 'NOT_FOUND':
      return 'The requested resource was not found.';
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please wait a moment and try again.';
    case 'SERVER_ERROR':
      return 'Server error occurred. Please try again later.';
    default:
      return appError.message || 'An unexpected error occurred.';
  }
};

export const getErrorTitle = (error: any): string => {
  const appError = parseError(error);

  switch (appError.code) {
    case 'NETWORK_ERROR':
      return 'Connection Error';
    case 'UNAUTHORIZED':
      return 'Authentication Required';
    case 'FORBIDDEN':
      return 'Access Denied';
    case 'NOT_FOUND':
      return 'Not Found';
    case 'VALIDATION_ERROR':
      return 'Invalid Input';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Rate Limit Exceeded';
    case 'SERVER_ERROR':
      return 'Server Error';
    default:
      return 'Error';
  }
};

export const logError = (error: any, context?: string) => {
  const appError = parseError(error);
  
  console.error(`[${context || 'App'}] Error:`, {
    message: appError.message,
    status: appError.status,
    code: appError.code,
    details: appError.details,
    stack: appError.stack,
    timestamp: new Date().toISOString(),
  });
};

export const handleError = (error: any, context?: string) => {
  const appError = parseError(error);
  logError(appError, context);

  // Return error info for UI handling
  return {
    title: getErrorTitle(appError),
    message: getErrorMessage(appError),
    error: appError,
  };
};

// Hook for handling errors with notifications
export const useErrorHandler = () => {
  const { error: showError } = useNotifications();

  const handleErrorWithNotification = (error: any, context?: string) => {
    const errorInfo = handleError(error, context);
    
    showError(errorInfo.title, errorInfo.message, {
      duration: 8000, // Longer duration for errors
      action: {
        label: 'Dismiss',
        onClick: () => {}, // Will be handled by notification system
      },
    });

    return errorInfo;
  };

  return {
    handleError,
    handleErrorWithNotification,
    parseError,
    getErrorMessage,
    getErrorTitle,
  };
};

// Async error wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  };
};

// Validation error helpers
export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map(err => `${err.field}: ${err.message}`).join(', ');
};

export const createValidationError = (field: string, message: string): ValidationError => {
  return { field, message };
}; 