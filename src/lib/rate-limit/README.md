# Modul Rate Limiting & Analisis Lingkungan Serverless Vercel

Modul ini bertanggung jawab membatasi laju request (*rate limiting*) pada endpoint sensitif seperti login CMS (`signIn`), form kontak, dan mutasi data publik, untuk mencegah serangan *brute force*, *credential stuffing*, dan *denial-of-service*.

---

## 1. Tantangan di Lingkungan Serverless Vercel

Pada arsitektur serverless (seperti Vercel Functions / Next.js Server Actions):
1. **Stateless & Ephemeral Lifecycle:** Setiap fungsi dieksekusi di dalam container/sandbox microVM yang dapat diinisialisasi (*cold start*) dan dihancurkan kapan saja.
2. **Isolasi Memori Antar-Instance:** Ketika lonjakan trafik terjadi, Vercel dapat membuat puluhan instance secara paralel. Variabel memori (`new Map()`) di instance A **tidak dapat dibaca** oleh instance B.
3. **Reset Akibat Cold Start:** Jika trafik sepi, container akan masuk fase hibernasi dan memori internal akan terhapus.

---

## 2. Perbandingan Pilihan Storage

| Kriteria | In-Memory Store (`MemoryRateLimiter`) | Supabase PostgreSQL (`SupabaseRateLimiter`) | Layanan Eksternal (Upstash Redis) |
| :--- | :--- | :--- | :--- |
| **Kelebihan** | Sangat cepat (0ms latency), tanpa dependensi eksternal, sangat ideal untuk Local Dev & Unit Test. | **Persisten lintas-instance serverless**, atomic (`FOR UPDATE` di PostgreSQL RPC), tidak memerlukan biaya/layanan pihak ketiga tambahan. | Latensi ultra-rendah (<5ms), fitur sliding window presisi tinggi di edge network. |
| **Kekurangan** | Hilang saat cold start, tidak tersinkronisasi antar-instance Vercel yang berjalan bersamaan. | Menambah round-trip query ke basis data (~15–30ms per request), memerlukan tabel & indeks khusus. | Memerlukan akun/API key vendor baru, berpotensi downtime jika kuota gratis habis atau koneksi vendor terganggu. |
| **Rekomendasi V1.0** | **Lingkungan Dev & Test.** | **Default Production V1.0** (aman, terpusat, tanpa vendor lock-in baru). | Opsi upgrade jika RPS login/publik mencapai ribuan req/detik. |

---

## 3. Cara Penggunaan

```ts
import { authRateLimiter, getClientIp } from '@/lib/rate-limit';

// Di dalam Server Action
const ip = await getClientIp();
const rateLimitKey = `login:${ip}:${email.toLowerCase()}`;

const rateLimit = await authRateLimiter.limit(rateLimitKey);

if (!rateLimit.success) {
  return actionError(
    `Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa saat.`,
    'TOO_MANY_REQUESTS',
    429
  );
}
```
