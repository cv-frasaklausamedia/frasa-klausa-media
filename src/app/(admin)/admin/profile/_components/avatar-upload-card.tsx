'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { uploadAvatarAction } from '@/actions/profile';
import { toast } from 'sonner';
import { Camera, Loader2, Upload } from 'lucide-react';
import { MAX_AVATAR_SIZE_BYTES, ALLOWED_AVATAR_MIME_TYPES } from '@/validations/profile';

interface AvatarUploadCardProps {
  currentAvatarUrl: string | null;
  fullName: string;
}

export function AvatarUploadCard({ currentAvatarUrl, fullName }: AvatarUploadCardProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentAvatarUrl);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi client cepat
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error('Ukuran berkas melebihi 2 MB.');
      return;
    }

    const isAllowedMime = ALLOWED_AVATAR_MIME_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number]);
    const isAllowedExt = /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isAllowedMime && !isAllowedExt) {
      toast.error('Hanya format JPG, PNG, atau WebP yang diperbolehkan.');
      return;
    }

    // Tampilkan pratinjau sementara di browser
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Kirim form data ke server action
    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    try {
      const response = await uploadAvatarAction(formData);
      if (response.ok) {
        toast.success('Foto avatar berhasil diunggah.');
        setPreviewUrl(response.data.avatarUrl);
        router.refresh();
      } else {
        toast.error(response.error.message || 'Gagal mengunggah avatar.');
        setPreviewUrl(currentAvatarUrl); // Kembalikan ke URL semula jika gagal
      }
    } catch (err) {
      console.error('[AvatarUploadCard] Upload network/server error:', err);
      toast.error('Terjadi kesalahan jaringan atau batasan server saat mengunggah foto.');
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative group">
        <Avatar className="h-28 w-28 border-2 border-border shadow-md">
          <AvatarImage src={previewUrl ?? undefined} alt={fullName} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          aria-label="Pilih foto profil baru"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="mt-4 space-y-1">
        <h3 className="font-semibold text-foreground text-sm">{fullName}</h3>
        <p className="text-xs text-muted-foreground">
          Format JPG, PNG, atau WebP. Maksimal 2 MB.
        </p>
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5 text-xs"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunggah...
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" /> Ganti Foto Profil
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
