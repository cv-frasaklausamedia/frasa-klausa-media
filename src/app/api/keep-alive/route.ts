import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin.server';
import { createRateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { captureException, captureSecurityEvent } from '@/lib/monitoring';

// Rate limiting: Maksimal 10 request per 5 menit per IP (mencegah abuse spamming)
const keepAliveRateLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 5 * 60,
});

function getClientIpFromRequest(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

/**
 * Route Handler: GET /api/keep-alive
 *
 * Menjalankan SATU query baca sangat ringan ke Supabase untuk mencegah auto-pause (PRD §14.6).
 * Dilindungi verifikasi CRON_SECRET, rate limiting, anti-caching, dan structured logging.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const clientIp = getClientIpFromRequest(request);

  // Common headers untuk mematikan caching di semua level CDN & browser
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store',
  };

  try {
    // 1. Verifikasi Header Authorization dengan CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    // Jika CRON_SECRET dikonfigurasi, wajibkan validasi bearer token
    if (cronSecret) {
      const expectedBearer = `Bearer ${cronSecret}`;
      if (!authHeader || authHeader !== expectedBearer) {
        captureSecurityEvent('Keep-alive unauthorized attempt', {
          requestId,
          route: '/api/keep-alive',
          status: 401,
          metadata: { ip: clientIp, hasAuthHeader: Boolean(authHeader) },
        });

        return NextResponse.json(
          { error: 'Unauthorized' },
          {
            status: 401,
            headers: noCacheHeaders,
          }
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Di production, ketiadaan CRON_SECRET merupakan peringatan kritis konfigurasi
      logger.error('CRON_SECRET is not configured in production environment', {
        requestId,
        route: '/api/keep-alive',
      });
      return NextResponse.json(
        { error: 'Configuration Error' },
        {
          status: 500,
          headers: noCacheHeaders,
        }
      );
    }

    // 2. Proteksi Rate Limiting
    const rateLimit = await keepAliveRateLimiter.limit(`keep-alive:${clientIp}`);
    if (!rateLimit.success) {
      const retryAfter = Math.max(1, rateLimit.reset - Math.floor(Date.now() / 1000));
      return NextResponse.json(
        { error: 'Too Many Requests' },
        {
          status: 429,
          headers: {
            ...noCacheHeaders,
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          },
        }
      );
    }

    // 3. Query Baca Sangat Ringan ke Supabase (1 baris data dari tabel kecil)
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1)
      .maybeSingle();

    const durationMs = Date.now() - startTime;

    if (error) {
      captureException(error, {
        requestId,
        route: '/api/keep-alive',
        status: 500,
        durationMs,
      });

      return NextResponse.json(
        { error: 'Database ping failed' },
        {
          status: 500,
          headers: noCacheHeaders,
        }
      );
    }

    // 4. Log Terstruktur Keberhasilan Keep-Alive
    logger.info('Keep-alive ping executed successfully', {
      requestId,
      route: '/api/keep-alive',
      status: 200,
      durationMs,
      metadata: {
        recordFound: Boolean(data),
      },
    });

    // 5. Minimalist Response Tanpa Detail Internal
    return NextResponse.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: noCacheHeaders,
      }
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    captureException(err, {
      requestId,
      route: '/api/keep-alive',
      status: 500,
      durationMs,
    });

    return NextResponse.json(
      { error: 'Internal Error' },
      {
        status: 500,
        headers: noCacheHeaders,
      }
    );
  }
}
