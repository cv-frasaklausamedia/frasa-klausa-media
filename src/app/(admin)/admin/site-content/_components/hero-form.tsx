'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  Save,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  heroContentSchema,
  type HeroContentInput,
  type HeroContentValues,
} from '@/validations/site-content';
import {
  saveHeroContentAction,
  uploadSiteImageAction,
  cleanupSiteImagesAction,
} from '@/actions/site-content';
import { DEFAULT_HERO_CONTENT } from '@/lib/site-content/defaults';
import type { HeroContentPayload } from '@/types';

interface HeroFormProps {
  initialData: HeroContentPayload;
}

export function HeroForm({ initialData }: HeroFormProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedPathsToCleanup, setUploadedPathsToCleanup] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<HeroContentValues>({
    resolver: zodResolver(heroContentSchema),
    defaultValues: {
      badge: initialData.badge || DEFAULT_HERO_CONTENT.badge,
      headline: initialData.headline || DEFAULT_HERO_CONTENT.headline,
      subheadline: initialData.subheadline || DEFAULT_HERO_CONTENT.subheadline,
      primary_cta_label: initialData.primary_cta_label || DEFAULT_HERO_CONTENT.primary_cta_label,
      primary_cta_url: initialData.primary_cta_url || DEFAULT_HERO_CONTENT.primary_cta_url,
      secondary_cta_label: initialData.secondary_cta_label || DEFAULT_HERO_CONTENT.secondary_cta_label,
      secondary_cta_url: initialData.secondary_cta_url || DEFAULT_HERO_CONTENT.secondary_cta_url,
      cover_image_url: initialData.cover_image_url || DEFAULT_HERO_CONTENT.cover_image_url,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  const currentCoverUrl = watch('cover_image_url');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran berkas gambar maksimal 5 MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadSiteImageAction(formData);
      if (res.ok && res.data) {
        setValue('cover_image_url', res.data.url, { shouldValidate: true, shouldDirty: true });
        setUploadedPathsToCleanup((prev) => [...prev, res.data.path]);
        toast.success('Gambar cover hero berhasil diunggah');
      } else {
        toast.error(res.error.message || 'Gagal mengunggah gambar');
      }
    } catch {
      toast.error('Terjadi kendala saat mengunggah gambar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setValue('cover_image_url', '', { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: HeroContentValues) => {
    try {
      const res = await saveHeroContentAction(values);
      if (res.ok) {
        toast.success('Konten Hero beranda berhasil disimpan');
        setUploadedPathsToCleanup([]); // Kosongkan daftar cleanup karena gambar sudah tersimpan
      } else {
        toast.error(res.error.message || 'Gagal menyimpan konten Hero');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Hero Section Beranda</CardTitle>
        <CardDescription>
          Kustomisasi judul utama, sub-judul, tombol ajakan bertindak (CTA), dan gambar latar yang menyapa pembaca di halaman depan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Badge & Headline */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hero-badge" className="text-xs font-semibold">
                Badge / Tagline Kecil (Opsional)
              </Label>
              <Input
                id="hero-badge"
                placeholder="Penerbit Buku Berkualitas & Independen"
                {...register('badge')}
                className={errors.badge ? 'border-destructive' : ''}
              />
              {errors.badge && (
                <p className="text-xs text-destructive">{errors.badge.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero-headline" className="text-xs font-semibold">
                Headline Utama <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hero-headline"
                placeholder="Mewujudkan Naskah Menjadi Karya Nyata"
                {...register('headline')}
                className={errors.headline ? 'border-destructive font-serif' : 'font-serif'}
              />
              {errors.headline && (
                <p className="text-xs text-destructive">{errors.headline.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero-subheadline" className="text-xs font-semibold">
                Sub-Headline <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="hero-subheadline"
                rows={3}
                placeholder="Frasa Klausa Media adalah rumah bagi para penulis, pembaca, dan pencinta literasi..."
                {...register('subheadline')}
                className={errors.subheadline ? 'border-destructive' : ''}
              />
              {errors.subheadline && (
                <p className="text-xs text-destructive">{errors.subheadline.message}</p>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/10">
            {/* CTA Utama */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Tombol CTA Utama
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="primary-label" className="text-xs">
                  Label Tombol <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="primary-label"
                  placeholder="Jelajahi Katalog Buku"
                  {...register('primary_cta_label')}
                  className={errors.primary_cta_label ? 'border-destructive' : ''}
                />
                {errors.primary_cta_label && (
                  <p className="text-xs text-destructive">
                    {errors.primary_cta_label.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="primary-url" className="text-xs">
                  Tautan Tujuan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="primary-url"
                  placeholder="/katalog"
                  {...register('primary_cta_url')}
                  className={errors.primary_cta_url ? 'border-destructive font-mono text-xs' : 'font-mono text-xs'}
                />
                {errors.primary_cta_url && (
                  <p className="text-xs text-destructive">
                    {errors.primary_cta_url.message}
                  </p>
                )}
              </div>
            </div>

            {/* CTA Sekunder */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tombol CTA Sekunder (Opsional)
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="secondary-label" className="text-xs">
                  Label Tombol
                </Label>
                <Input
                  id="secondary-label"
                  placeholder="Hubungi Redaksi"
                  {...register('secondary_cta_label')}
                  className={errors.secondary_cta_label ? 'border-destructive' : ''}
                />
                {errors.secondary_cta_label && (
                  <p className="text-xs text-destructive">
                    {errors.secondary_cta_label.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secondary-url" className="text-xs">
                  Tautan Tujuan
                </Label>
                <Input
                  id="secondary-url"
                  placeholder="/kontak"
                  {...register('secondary_cta_url')}
                  className={errors.secondary_cta_url ? 'border-destructive font-mono text-xs' : 'font-mono text-xs'}
                />
                {errors.secondary_cta_url && (
                  <p className="text-xs text-destructive">
                    {errors.secondary_cta_url.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload Gambar Cover Hero */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Gambar Latar / Ilustrasi Hero</Label>
            <div className="rounded-xl border p-4 bg-muted/5 flex flex-col sm:flex-row items-center gap-4">
              {currentCoverUrl ? (
                <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={currentCoverUrl}
                    alt="Cover Hero Preview"
                    fill
                    className="object-cover"
                    sizes="192px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-32 w-48 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground bg-muted/20">
                  <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                  <span className="text-[11px]">Belum ada gambar</span>
                </div>
              )}

              <div className="space-y-2 text-center sm:text-left flex-1">
                <p className="text-xs text-muted-foreground">
                  Gunakan gambar berorientasi lanskap resolusi tinggi (rekomendasi 1200×800 px). Format: JPG, PNG, atau WebP (maks. 5 MB).
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading || isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 text-xs"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>{currentCoverUrl ? 'Ganti Gambar' : 'Unggah Gambar'}</span>
                  </Button>

                  {currentCoverUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUploading || isSubmitting}
                      onClick={handleRemoveImage}
                      className="text-destructive text-xs gap-1 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Gambar</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Simpan Perubahan Hero</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
