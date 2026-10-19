'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import {
  updateProfileSchema,
  updatePasswordSchema,
  MAX_AVATAR_SIZE_BYTES,
  validateImageMagicBytes,
} from '@/validations/profile';
import {
  actionError,
  actionSuccess,
  handleActionError,
  type ActionResponse,
} from '@/lib/action-response';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';

/**
 * Server Action: updateProfileNameAction
 * Memperbarui nama lengkap admin yang sedang aktif.
 */
export async function updateProfileNameAction(
  rawInput: unknown
): Promise<ActionResponse<{ fullName: string }>> {
  try {
    const user = await requireAdmin();

    const validation = updateProfileSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'form';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return actionError('Validasi data gagal.', 'VALIDATION_ERROR', 422, fieldErrors);
    }

    const { fullName } = validation.data;
    const supabase = await createClient();

    const profileUpdate: Database['public']['Tables']['profiles']['Update'] = {
      full_name: fullName,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id);

    if (error) {
      return actionError('Gagal memperbarui profil pengguna di basis data.', 'INTERNAL_SERVER_ERROR', 500);
    }

    return actionSuccess({ fullName });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: updatePasswordAction
 * Memperbarui kata sandi admin dengan verifikasi kata sandi saat ini dan aturan password kuat.
 */
export async function updatePasswordAction(
  rawInput: unknown
): Promise<ActionResponse<{ message: string }>> {
  try {
    const user = await requireAdmin();

    const validation = updatePasswordSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'form';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return actionError('Validasi kata sandi gagal.', 'VALIDATION_ERROR', 422, fieldErrors);
    }

    const { currentPassword, newPassword } = validation.data;
    const supabase = await createClient();

    // 1. Verifikasi kredensial saat ini terlebih dahulu
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return actionError(
        'Kata sandi saat ini tidak valid.',
        'UNAUTHORIZED',
        400,
        { currentPassword: ['Kata sandi saat ini yang Anda masukkan salah.'] }
      );
    }

    // 2. Perbarui kata sandi baru
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return actionError(
        'Gagal memperbarui kata sandi. Silakan coba kembali.',
        'INTERNAL_SERVER_ERROR',
        500
      );
    }

    return actionSuccess({ message: 'Kata sandi berhasil diperbarui.' });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: uploadAvatarAction
 * Mengunggah avatar ke bucket storage 'avatars' dengan UUID object name,
 * dan menerapkan mekanisme transaksi terbalik (rollback file di storage jika simpan DB gagal) sesuai PRD §14.5.
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResponse<{ avatarUrl: string }>> {
  try {
    const user = await requireAdmin();
    const file = formData.get('avatar');

    if (
      !file ||
      typeof file !== 'object' ||
      !('size' in file) ||
      typeof (file as Blob).arrayBuffer !== 'function' ||
      (file as Blob).size === 0
    ) {
      return actionError('Silakan pilih berkas avatar untuk diunggah.', 'VALIDATION_ERROR', 400);
    }

    const blobFile = file as Blob & { name?: string; type?: string };

    if (blobFile.size > MAX_AVATAR_SIZE_BYTES) {
      return actionError('Ukuran berkas avatar maksimal 2 MB.', 'BAD_REQUEST', 400);
    }

    // 1. Ekstrak buffer berkas
    const arrayBuffer = await blobFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 2. Validasi konten biner nyata (magic bytes) per PRD §14.5
    const { isValid, canonicalMime, ext } = validateImageMagicBytes(fileBuffer);
    if (!isValid || !canonicalMime || !ext) {
      return actionError(
        'Format berkas tidak didukung atau berkas rusak. Harap gunakan format JPEG, PNG, atau WebP yang valid.',
        'BAD_REQUEST',
        400
      );
    }

    const supabase = await createClient();
    const objectUuid = crypto.randomUUID();
    const filePath = `${user.id}/${objectUuid}.${ext}`;

    // 3. Unggah ke Supabase Storage dengan Canonical MIME Type
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: canonicalMime,
        upsert: false,
      });

    if (uploadError) {
      console.error('[uploadAvatarAction] Supabase storage upload error:', uploadError);
      return actionError(
        'Gagal mengunggah avatar ke media storage: ' + (uploadError.message || 'Terjadi kesalahan sistem.'),
        'INTERNAL_SERVER_ERROR',
        500
      );
    }

    // Dapatkan Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // 2. Simpan URL avatar baru ke basis data
    const avatarUpdate: Database['public']['Tables']['profiles']['Update'] = {
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from('profiles')
      .update(avatarUpdate)
      .eq('id', user.id);

    // 3. Rollback jika database gagal (PRD §14.5)
    if (dbError) {
      // Hapus file yang baru diunggah dari storage agar tidak menjadi sampah
      await supabase.storage.from('avatars').remove([filePath]);
      return actionError(
        'Gagal menyimpan tautan avatar ke profil. Berkas telah dihapus kembali demi keamanan.',
        'INTERNAL_SERVER_ERROR',
        500
      );
    }

    // 4. Bersihkan avatar lama jika ada dan berasal dari bucket avatars milik user ini
    if (user.avatarUrl && user.avatarUrl.includes(`/avatars/${user.id}/`)) {
      try {
        const oldPathParts = user.avatarUrl.split(`/avatars/`);
        if (oldPathParts[1]) {
          const oldStoragePath = oldPathParts[1].split('?')[0];
          await supabase.storage.from('avatars').remove([oldStoragePath]);
        }
      } catch {
        // Abaikan kegagalan penghapusan file lama agar tidak membatalkan respons sukses
      }
    }

    logger.info('Avatar uploaded and updated successfully', {
      action: 'uploadAvatarAction',
      actorId: user.id,
      status: 200,
      metadata: { ext, canonicalMime },
    });

    return actionSuccess({ avatarUrl: publicUrl });
  } catch (error) {
    return handleActionError(error);
  }
}
