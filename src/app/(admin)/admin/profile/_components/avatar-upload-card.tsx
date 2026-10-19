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
      {/* Wrapper Avatar Terstruktur & Proporsional */}
      <div className="relative inline-flex items-center justify-center">
        {/* Frame Lingkaran Luar dengan Double Ring & Shadow */}
        <div className="relative rounded-full p-1 bg-gradient-to-b from-border/70 to-border/20 shadow-md">
          <Avatar className="h-32 w-32 border-2 border-background shadow-inner">
            <AvatarImage
              src={previewUrl ?? undefined}
              alt={fullName}
              className="aspect-square h-full w-full object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl select-none">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          {/* Frosted Loading Overlay saat proses upload */}
          {isUploading && (
            <div className="absolute inset-1 flex flex-col items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs z-10 transition-all">
              <Loader2 className="h-7 w-7 animate-spin mb-1 text-primary-foreground" />
              <span className="text-[10px] font-medium tracking-wide">Mengunggah...</span>
            </div>
          )}
        </div>

        {/* Floating Camera Button dengan Ring Separator */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-3 ring-background transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer z-20"
          aria-label="Pilih foto profil baru"
          title="Ganti foto profil"
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

      <div className="mt-5 space-y-1">
        <h3 className="font-semibold text-foreground text-sm tracking-tight">{fullName}</h3>
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
          className="gap-1.5 text-xs shadow-xs"
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
