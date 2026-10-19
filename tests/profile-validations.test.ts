import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateProfileSchema,
  updatePasswordSchema,
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_BYTES,
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
  });
});
