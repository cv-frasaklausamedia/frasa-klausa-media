import { ZodError } from 'zod';

export type ActionErrorCode =
  | 'BAD_REQUEST'           // 400
  | 'UNAUTHORIZED'          // 401
  | 'FORBIDDEN'             // 403
  | 'NOT_FOUND'             // 404
  | 'CONFLICT'              // 409
  | 'VALIDATION_ERROR'      // 422
  | 'TOO_MANY_REQUESTS'     // 429
  | 'INTERNAL_SERVER_ERROR';// 500

export interface ActionErrorPayload {
  code: ActionErrorCode;
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResponse<T = unknown> =
  | { ok: true; data: T; error?: never }
  | { ok: false; error: ActionErrorPayload; data?: never };

/**
 * Custom Error Class untuk operasional aplikasi terstruktur
 */
export class AppError extends Error {
  public readonly code: ActionErrorCode;
  public readonly status: number;

  constructor(
    message: string,
    code: ActionErrorCode = 'BAD_REQUEST',
    status = 400
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Custom Error Class spesifik untuk kegagalan autentikasi / otorisasi
 */
export class AuthError extends AppError {
  constructor(message: string, status: 401 | 403 = 401) {
    super(
      message,
      status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
      status
    );
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Helper pembuat respons sukses Server Action
 */
export function actionSuccess<T>(data: T): ActionResponse<T> {
  return {
    ok: true,
    data,
  };
}

/**
 * Pemetaan kode error ke status HTTP standar
 */
const STATUS_CODE_MAP: Record<ActionErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Helper pembuat respons error Server Action
 */
export function actionError(
  message: string,
  code: ActionErrorCode = 'BAD_REQUEST',
  status?: number,
  fieldErrors?: Record<string, string[]>
): ActionResponse<never> {
  const resolvedStatus = status ?? STATUS_CODE_MAP[code] ?? 400;

  return {
    ok: false,
    error: {
      code,
      message,
      status: resolvedStatus,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
}

/**
 * Menangani error apa pun yang terjadi pada Server Action.
 * Menjamin tidak membocorkan stack trace, query SQL mentah, atau nama tabel DB ke client.
 */
export function handleActionError(error: unknown): ActionResponse<never> {
  // 1. Error yang sengaja dilempar oleh aplikasi (AppError / AuthError)
  if (error instanceof AppError) {
    return actionError(error.message, error.code, error.status);
  }

  // 2. Error validasi Zod
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const field = issue.path.join('.') || 'form';
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }

    return actionError(
      'Validasi data gagal. Silakan periksa kolom formulir.',
      'VALIDATION_ERROR',
      422,
      fieldErrors
    );
  }

  // 3. Error PostgREST / Supabase
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const pgError = error as { code: string; message?: string };
    console.error('[DatabaseError]', {
      code: pgError.code,
      message: pgError.message,
    });

    switch (pgError.code) {
      case '42501': // insufficient_privilege
        return actionError(
          'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini.',
          'FORBIDDEN',
          403
        );
      case 'P0002': // no_data_found
        return actionError(
          'Data yang diminta tidak ditemukan.',
          'NOT_FOUND',
          404
        );
      case '22023': // invalid_parameter_value
        return actionError(
          pgError.message || 'Parameter atau batasan nilai yang dimasukkan tidak valid.',
          'BAD_REQUEST',
          400
        );
      case '23505': // unique_violation
        return actionError(
          'Data yang dimasukkan sudah ada dan tidak boleh duplikat.',
          'CONFLICT',
          409
        );
      case '23503': // foreign_key_violation
        return actionError(
          'Referensi data terkait tidak ditemukan.',
          'BAD_REQUEST',
          400
        );
      case '23514': // check_violation
        return actionError(
          'Format atau nilai data melanggar batasan sistem.',
          'BAD_REQUEST',
          400
        );
      default:
        return actionError(
          'Terjadi kesalahan saat memproses data di basis data.',
          'INTERNAL_SERVER_ERROR',
          500
        );
    }
  }

  // 4. Unexpected / Unknown Server Error (Log detail di server, kembalikan pesan aman ke client)
  console.error('[UnhandledServerActionError]', error);

  return actionError(
    'Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.',
    'INTERNAL_SERVER_ERROR',
    500
  );
}
