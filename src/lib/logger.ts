/**
 * Secure logging utility that only logs detailed errors in development.
 * In production, it logs safe error codes/IDs without exposing internal details.
 */

const isDev = import.meta.env.DEV;

interface SafeError {
  code?: string;
  message: string;
}

/**
 * Sanitize error for production - removes sensitive details
 */
function sanitizeError(error: unknown): SafeError {
  if (error instanceof Error) {
    // Only return a generic message in production
    return {
      code: 'ERR_UNKNOWN',
      message: 'An error occurred. Please try again.',
    };
  }
  return {
    code: 'ERR_UNKNOWN',
    message: 'An unexpected error occurred.',
  };
}

/**
 * Log an error - full details in dev, sanitized in production
 */
export function logError(context: string, error: unknown): void {
  if (isDev) {
    console.error(`[${context}]`, error);
  } else {
    const safe = sanitizeError(error);
    console.error(`[${context}] ${safe.code}: ${safe.message}`);
  }
}

/**
 * Log a warning - full details in dev only
 */
export function logWarn(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.warn(`[${context}] ${message}`, data);
  }
}

/**
 * Log info - only in dev
 */
export function logInfo(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.info(`[${context}] ${message}`, data);
  }
}

/**
 * Get a user-friendly error message from an error object
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isDev && error instanceof Error) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
}
