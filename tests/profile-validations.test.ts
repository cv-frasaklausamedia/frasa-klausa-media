import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateProfileSchema,
  updatePasswordSchema,
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  validateImageMagicBytes,
} from '../src/validations/profile.ts';

test('Profile Validations Suite', async (t) => {
  await t.test('updateProfileSchema validasi nama lengkap yang sah', () => {
    const valid = updateProfileSchema.safeParse({ fullName: 'Pustakawan Frasa' });
    assert.strictEqual(valid.success, true);
    if (valid.success) {
      assert.strictEqual(valid.data.fullName, 'Pustakawan Frasa');
    }
  });

  await t.test('updateProfileSchema menolak nama kosong atau terlalu pendek (< 2 karakter)', () => {
    const invalidEmpty = updateProfileSchema.safeParse({ fullName: '   ' });
    assert.strictEqual(invalidEmpty.success, false);

    const invalidShort = updateProfileSchema.safeParse({ fullName: 'A' });
    assert.strictEqual(invalidShort.success, false);
  });

  await t.test('updatePasswordSchema memvalidasi kata sandi kuat dengan benar', () => {
    const valid = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword123!',
      newPassword: 'SecureNewPassword456#',
      confirmPassword: 'SecureNewPassword456#',
    });
    assert.strictEqual(valid.success, true);
  });

  await t.test('updatePasswordSchema menolak jika konfirmasi kata sandi tidak cocok', () => {
    const mismatch = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword123!',
      newPassword: 'SecureNewPassword456#',
      confirmPassword: 'DifferentPassword789$',
    });
    assert.strictEqual(mismatch.success, false);
    if (!mismatch.success) {
      const fieldErrors = mismatch.error.issues.map((i) => i.path.join('.'));
      assert.ok(fieldErrors.includes('confirmPassword'));
    }
  });

  await t.test('updatePasswordSchema menolak jika kata sandi baru sama dengan kata sandi lama', () => {
    const samePassword = updatePasswordSchema.safeParse({
      currentPassword: 'SamePassword123!',
      newPassword: 'SamePassword123!',
      confirmPassword: 'SamePassword123!',
    });
    assert.strictEqual(samePassword.success, false);
    if (!samePassword.success) {
      const fieldErrors = samePassword.error.issues.map((i) => i.path.join('.'));
      assert.ok(fieldErrors.includes('newPassword'));
    }
  });

  await t.test('updatePasswordSchema menolak kata sandi yang tidak memenuhi kriteria kompleksitas', () => {
    // Kurang huruf besar
    const noUpper = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword123!',
      newPassword: 'lowercaseonly123!',
      confirmPassword: 'lowercaseonly123!',
    });
    assert.strictEqual(noUpper.success, false);

    // Kurang angka
    const noNumber = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword123!',
      newPassword: 'NoNumbersHereAtAll!',
      confirmPassword: 'NoNumbersHereAtAll!',
    });
    assert.strictEqual(noNumber.success, false);

    // Kurang karakter spesial
    const noSpecial = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword123!',
      newPassword: 'NoSpecialChars123',
      confirmPassword: 'NoSpecialChars123',
    });
    assert.strictEqual(noSpecial.success, false);
  });

  await t.test('konstanta avatar memenuhi batasan PRD §14.5', () => {
    assert.strictEqual(MAX_AVATAR_SIZE_BYTES, 2097152); // 2 MB
    assert.ok(ALLOWED_AVATAR_MIME_TYPES.includes('image/jpeg'));
    assert.ok(ALLOWED_AVATAR_MIME_TYPES.includes('image/png'));
    assert.ok(ALLOWED_AVATAR_MIME_TYPES.includes('image/webp'));
    assert.ok(ALLOWED_AVATAR_MIME_TYPES.includes('image/jpg'));
    assert.ok(ALLOWED_AVATAR_MIME_TYPES.includes('image/pjpeg'));
  });

  await t.test('validateImageMagicBytes mengenali berkas JPEG asli', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const res = validateImageMagicBytes(jpegBuffer);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.canonicalMime, 'image/jpeg');
    assert.strictEqual(res.ext, 'jpg');
  });

  await t.test('validateImageMagicBytes mengenali berkas PNG asli', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const res = validateImageMagicBytes(pngBuffer);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.canonicalMime, 'image/png');
    assert.strictEqual(res.ext, 'png');
  });

  await t.test('validateImageMagicBytes mengenali berkas WebP asli', () => {
    // RIFF....WEBP
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // file size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    const res = validateImageMagicBytes(webpBuffer);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.canonicalMime, 'image/webp');
    assert.strictEqual(res.ext, 'webp');
  });

  await t.test('validateImageMagicBytes menolak berkas teks/HTML palsu atau korup', () => {
    const htmlBuffer = Buffer.from('<html><script>alert(1)</script></html>');
    const res = validateImageMagicBytes(htmlBuffer);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.canonicalMime, null);
    assert.strictEqual(res.ext, null);

    const shortBuffer = Buffer.from([0xff, 0xd8]);
    const shortRes = validateImageMagicBytes(shortBuffer);
    assert.strictEqual(shortRes.isValid, false);
  });
});
