import { logger, type LogContext } from './logger/index.ts';
import { AppError, AuthError } from './action-response.ts';

export interface MonitoringContext extends LogContext {
  tags?: Record<string, string>;
  fingerprint?: string[];
}

/**
 * Menentukan apakah suatu error merupakan "Expected Error" (PRD §16.7).
 * Expected error: validasi input (422), unauthorized (401), forbidden (403),
 * not found (404), conflict (409), rate limit (429).
 *
 * Unexpected error: database outage, unhandled null exception, runtime TypeError (500).
 */
export function isExpectedError(error: unknown): boolean {
  if (error instanceof AppError || error instanceof AuthError) {
    return error.status < 500;
  }

  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    // Zod validation error
    if (errObj.name === 'ZodError') {
      return true;
    }
    // PostgREST errors yang tergolong expected client input
    if (typeof errObj.code === 'string') {
      const expectedCodes = ['P0002', '23505', '23503', '23514', '22023', '42501'];
      if (expectedCodes.includes(errObj.code)) {
        return true;
      }
    }
    if (typeof errObj.status === 'number') {
      return errObj.status >= 400 && errObj.status < 500;
    }
  }

  return false;
}

/**
 * Menangkap exception dan mencatatnya ke observability stack.
 * Membedakan expected error dari unexpected error agar alert tidak noisy.
 */
export function captureException(error: unknown, context?: MonitoringContext): void {
  const expected = isExpectedError(error);

  if (expected) {
    logger.warn('Operational / Expected error captured', {
      ...context,
      error,
      metadata: {
        ...context?.metadata,
        isExpected: true,
      },
    });
  } else {
    logger.error('Unexpected server error captured', {
      ...context,
      error,
      metadata: {
        ...context?.metadata,
        isExpected: false,
      },
    });

    // Tempat integrasi vendor error tracking (misal Sentry.captureException jika diaktifkan)
  }
}

/**
 * Menangkap peristiwa khusus (misal auth failure spike, rate limit trigger).
 */
export function captureSecurityEvent(
  eventName: string,
  context?: MonitoringContext
): void {
  logger.warn(`[SecurityEvent] ${eventName}`, {
    ...context,
    metadata: {
      ...context?.metadata,
      eventType: 'security',
    },
  });
}
