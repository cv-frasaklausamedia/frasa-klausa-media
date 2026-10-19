import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  contactInquirySchema,
  inquiryQuerySchema,
  updateInquiryStatusSchema,
} from '../src/validations/inquiry.ts';
import {
  executeSubmitContactInquiry,
  executeUpdateInquiryStatus,
  executeDeleteInquiry,
  type InquiryServiceDeps,
} from '../src/lib/inquiries/service.ts';
import { AppError } from '../src/lib/action-response.ts';
import type { InquiryItem } from '../src/lib/inquiries/types.ts';
import type { InquiryStatus } from '../src/types/database.ts';

describe('Tahap 11: Contact Inquiry & Admin Inbox Service Suite (PRD §6.3.7, §13, §15.11)', () => {
  describe('1. Skema Validasi Formulir Kontak & Honeypot (Zod)', () => {
    test('menerima data inquiry kontak yang valid dan lengkap', () => {
      const valid = contactInquirySchema.parse({
        name: 'Ahmad Dahlan',
        email: 'ahmad@example.com',
        phone: '081234567890',
        subject: 'Tawaran Naskah Puisi',
        message: 'Halo Frasa Klausa Media, saya ingin mengajukan draf naskah kumpulan puisi.',
        hp_field: '',
      });

      assert.strictEqual(valid.name, 'Ahmad Dahlan');
      assert.strictEqual(valid.email, 'ahmad@example.com');
      assert.strictEqual(valid.phone, '081234567890');
      assert.strictEqual(valid.subject, 'Tawaran Naskah Puisi');
      assert.strictEqual(valid.hp_field, '');
    });

    test('menerima nomor telepon opsional yang kosong atau null', () => {
      const withNullPhone = contactInquirySchema.parse({
        name: 'Siti Rahma',
        email: 'siti@example.com',
        phone: '',
        subject: 'Kerja Sama Bedah Buku',
        message: 'Kami dari komunitas literasi ingin mengadakan webinar bedah buku.',
      });
      assert.strictEqual(withNullPhone.phone, null);
    });

    test('menolak alamat email dengan format tidak valid', () => {
      assert.throws(
        () => {
          contactInquirySchema.parse({
            name: 'Budi',
            email: 'budi-bukan-email',
            subject: 'Pertanyaan',
            message: 'Halo redaksi Frasa Klausa Media.',
          });
        },
        (err: any) => {
          assert.match(err.errors[0].message, /format alamat email tidak valid/i);
          return true;
        }
      );
    });

    test('menolak pesan yang terlalu pendek (< 10 karakter)', () => {
      assert.throws(
        () => {
          contactInquirySchema.parse({
            name: 'Budi',
            email: 'budi@example.com',
            subject: 'Tanya',
            message: 'Singkat',
          });
        },
        (err: any) => {
          assert.match(err.errors[0].message, /minimal 10 karakter/i);
          return true;
        }
      );
    });

    test('Honeypot: menolak jika field hp_field terisi (indikasi spam bot)', () => {
      assert.throws(
        () => {
          contactInquirySchema.parse({
            name: 'Spam Bot',
            email: 'bot@spam.com',
            subject: 'Cheap SEO Backlinks',
            message: 'Buy high ranking backlinks on cheap prices today now!',
            hp_field: 'http://spam.ru',
          });
        },
        (err: any) => {
          assert.match(err.errors[0].message, /spam terdeteksi/i);
          return true;
        }
      );
    });
  });

  describe('2. Logika Bisnis Pengiriman Form Kontak (executeSubmitContactInquiry)', () => {
    function createMockDeps(overrides?: Partial<InquiryServiceDeps>): InquiryServiceDeps {
      return {
        rateLimit: {
          checkLimit: async () => ({ success: true, remaining: 4, reset: 123456 }),
        },
        db: {
          createInquiry: async (data) => ({ id: 'mock-inquiry-uuid-1' }),
        },
        ...overrides,
      };
    }

    test('berhasil mengirim pesan valid dan memanggil db.createInquiry', async () => {
      let createdData: any = null;
      const deps = createMockDeps({
        db: {
          createInquiry: async (data) => {
            createdData = data;
            return { id: 'inquiry-123' };
          },
        },
      });

      const res = await executeSubmitContactInquiry(
        deps,
        {
          name: 'Dewi Lestari',
          email: 'dewi@example.com',
          phone: '081399998888',
          subject: 'Konsultasi Penerbitan',
          message: 'Apakah Frasa Klausa Media menerima naskah bertema fiksi ilmiah?',
          hp_field: '',
        },
        { clientIp: '192.168.1.10' }
      );

      assert.strictEqual(res.success, true);
      assert.match(res.message, /berhasil dikirim/i);
      assert.strictEqual(createdData.name, 'Dewi Lestari');
      assert.strictEqual(createdData.email, 'dewi@example.com');
      assert.strictEqual(createdData.phone, '081399998888');
    });

    test('menolak bot spam secara dini jika hp_field terisi sebelum menyentuh DB', async () => {
      let dbCalled = false;
      const deps = createMockDeps({
        db: {
          createInquiry: async () => {
            dbCalled = true;
            return { id: 'bot-inquiry' };
          },
        },
      });

      await assert.rejects(
        async () => {
          await executeSubmitContactInquiry(
            deps,
            {
              name: 'Bot Spam',
              email: 'bot@spam.com',
              subject: 'Spam Subject',
              message: 'This is an automated spam message content.',
              hp_field: 'https://viagra-promo.com',
            },
            { clientIp: '10.0.0.1' }
          );
        },
        (err: any) => {
          assert.strictEqual(err instanceof AppError, true);
          assert.strictEqual(err.code, 'BAD_REQUEST');
          assert.strictEqual(err.status, 400);
          assert.match(err.message, /spam terdeteksi/i);
          return true;
        }
      );

      assert.strictEqual(dbCalled, false);
    });

    test('memicu error 429 TOO_MANY_REQUESTS jika kuota rate limit terlampaui', async () => {
      let checkedKey = '';
      const deps = createMockDeps({
        rateLimit: {
          checkLimit: async (key) => {
            checkedKey = key;
            return { success: false, remaining: 0, reset: Date.now() + 60000 };
          },
        },
      });

      await assert.rejects(
        async () => {
          await executeSubmitContactInquiry(
            deps,
            {
              name: 'Pengirim Terlalu Cepat',
              email: 'spammer@example.com',
              subject: 'Pesan Berulang',
              message: 'Pesan bertubi-tubi dalam waktu singkat.',
              hp_field: '',
            },
            { clientIp: '203.0.113.42' }
          );
        },
        (err: any) => {
          assert.strictEqual(err instanceof AppError, true);
          assert.strictEqual(err.code, 'TOO_MANY_REQUESTS');
          assert.strictEqual(err.status, 429);
          assert.match(err.message, /terlalu banyak permintaan/i);
          return true;
        }
      );

      // Verifikasi identifier rate limit menggabungkan IP dan email
      assert.strictEqual(checkedKey, 'contact:203.0.113.42:spammer@example.com');
    });
  });

  describe('3. Manajemen Status Inbox Admin (executeUpdateInquiryStatus & executeDeleteInquiry)', () => {
    test('admin aktif dapat memperbarui status pesan menjadi replied atau archived', async () => {
      let updatedStatus: InquiryStatus | null = null;
      let updatedId = '';

      const deps: InquiryServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        rateLimit: { checkLimit: async () => ({ success: true }) },
        db: {
          createInquiry: async () => ({ id: '1' }),
          updateInquiryStatus: async (id, status) => {
            updatedId = id;
            updatedStatus = status;
          },
        },
      };

      const res = await executeUpdateInquiryStatus(deps, {
        id: 'c1234567-89ab-4cde-8f01-23456789abcd',
        status: 'replied',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(updatedId, 'c1234567-89ab-4cde-8f01-23456789abcd');
      assert.strictEqual(updatedStatus, 'replied');
    });

    test('admin aktif dapat menghapus pesan masuk', async () => {
      let deletedId = '';

      const deps: InquiryServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        rateLimit: { checkLimit: async () => ({ success: true }) },
        db: {
          createInquiry: async () => ({ id: '1' }),
          deleteInquiry: async (id) => {
            deletedId = id;
          },
        },
      };

      const res = await executeDeleteInquiry(deps, 'inquiry-to-delete');
      assert.strictEqual(res.success, true);
      assert.strictEqual(deletedId, 'inquiry-to-delete');
    });

    test('menolak pembaruan status jika status tidak dikenal', () => {
      assert.throws(() => {
        updateInquiryStatusSchema.parse({
          id: 'c1234567-89ab-4cde-8f01-23456789abcd',
          status: 'unknown_status',
        });
      });
    });

    test('skema query inbox admin memproses filter status dan pencarian', () => {
      const parsed = inquiryQuerySchema.parse({
        page: '2',
        pageSize: '25',
        status: 'unread',
        q: 'Naskah Puisi',
      });

      assert.strictEqual(parsed.page, 2);
      assert.strictEqual(parsed.pageSize, 25);
      assert.strictEqual(parsed.status, 'unread');
      assert.strictEqual(parsed.q, 'Naskah Puisi');
    });
  });
});
