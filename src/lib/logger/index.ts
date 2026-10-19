export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  route?: string;
  action?: string;
  status?: number;
  durationMs?: number;
  actorId?: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
  [key: string]: unknown;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  requestId?: string;
  route?: string;
  action?: string;
  status?: number;
  durationMs?: number;
  actorId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    code?: string | number;
    stack?: string;
  };
}

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth(orization)?/i,
  /credential/i,
  /cookie/i,
  /session/i,
  /bearer/i,
  /service_role/i,
  /credit_?card/i,
];

/**
 * Memeriksa apakah nama kunci merupakan atribut sensitif.
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Melakukan redaksi data sensitif secara rekursif dan aman (mencegah circular reference).
 */
export function redactSensitiveData(data: unknown, seen = new WeakSet()): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Redaksi token bearer jika ditemukan di tengah string
    if (/bearer\s+[a-zA-Z0-9._\-]+/i.test(data)) {
      return data.replace(/bearer\s+[a-zA-Z0-9._\-]+/gi, 'Bearer [REDACTED]');
    }
    // Potong string yang terlalu panjang
    if (data.length > 1000) {
      return data.slice(0, 1000) + '...[TRUNCATED]';
    }
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      ...(process.env.NODE_ENV !== 'production' && data.stack ? { stack: data.stack } : {}),
    };
  }

  if (seen.has(data as object)) {
    return '[CIRCULAR]';
  }
  seen.add(data as object);

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactSensitiveData(value, seen);
    }
  }

  return result;
}

/**
 * Memformat dan mencetak log terstruktur dalam format JSON (PRD §16.7).
 */
export function formatAndPrintLog(
  level: LogLevel,
  message: string,
  context?: LogContext
): StructuredLogEntry {
  const isProd = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();

  let formattedError: StructuredLogEntry['error'] | undefined = undefined;
  if (context?.error) {
    if (context.error instanceof Error) {
      formattedError = {
        name: context.error.name,
        message: context.error.message,
        ...((context.error as { code?: string | number }).code
          ? { code: (context.error as { code?: string | number }).code }
          : {}),
        ...(!isProd && context.error.stack ? { stack: context.error.stack } : {}),
      };
    } else if (typeof context.error === 'object') {
      const errObj = context.error as Record<string, unknown>;
      formattedError = {
        name: typeof errObj.name === 'string' ? errObj.name : 'UnknownError',
        message: typeof errObj.message === 'string' ? errObj.message : String(errObj),
        code: typeof errObj.code === 'string' || typeof errObj.code === 'number' ? errObj.code : undefined,
      };
    } else {
      formattedError = {
        message: String(context.error),
      };
    }
  }

  let sanitizedMetadata: Record<string, unknown> | undefined = undefined;
  if (context?.metadata) {
    sanitizedMetadata = redactSensitiveData(context.metadata) as Record<string, unknown>;
  }

  const entry: StructuredLogEntry = {
    timestamp,
    level,
    message,
    service: 'frasa-klausa-media',
    environment: process.env.NODE_ENV || 'development',
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(context?.route ? { route: context.route } : {}),
    ...(context?.action ? { action: context.action } : {}),
    ...(context?.status !== undefined ? { status: context.status } : {}),
    ...(context?.durationMs !== undefined ? { durationMs: context.durationMs } : {}),
    ...(context?.actorId ? { actorId: context.actorId } : {}),
    ...(sanitizedMetadata ? { metadata: sanitizedMetadata } : {}),
    ...(formattedError ? { error: formattedError } : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      if (!isProd) {
        console.debug(output);
      }
      break;
    case 'info':
    default:
      console.log(output);
      break;
  }

  return entry;
}

export const logger = {
  info: (message: string, context?: LogContext) => formatAndPrintLog('info', message, context),
  warn: (message: string, context?: LogContext) => formatAndPrintLog('warn', message, context),
  error: (message: string, context?: LogContext) => formatAndPrintLog('error', message, context),
  debug: (message: string, context?: LogContext) => formatAndPrintLog('debug', message, context),
};
