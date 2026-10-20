'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  aboutContentSchema,
  type AboutContentInput,
  type AboutContentValues,
} from '@/validations/site-content';
import { saveAboutContentAction } from '@/actions/site-content';
import { DEFAULT_ABOUT_CONTENT } from '@/lib/site-content/defaults';
import type { AboutContentPayload } from '@/types';

interface AboutFormProps {
  initialData: AboutContentPayload;
}

export function AboutForm({ initialData }: AboutFormProps) {
  const form = useForm<AboutContentValues>({
    resolver: zodResolver(aboutContentSchema),
    defaultValues: {
      title: initialData.title || DEFAULT_ABOUT_CONTENT.title,
      subtitle: initialData.subtitle || DEFAULT_ABOUT_CONTENT.subtitle,
      vision: initialData.vision || DEFAULT_ABOUT_CONTENT.vision,
      mission:
        initialData.mission && initialData.mission.length > 0 && initialData.mission[0] !== ''
          ? initialData.mission
          : DEFAULT_ABOUT_CONTENT.mission,
      history: initialData.history || DEFAULT_ABOUT_CONTENT.history,
      values:
        initialData.values && initialData.values.length > 0
          ? initialData.values
          : DEFAULT_ABOUT_CONTENT.values,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  // Manage Dynamic Mission Items
  const {
    fields: missionFields,
    append: appendMission,
    remove: removeMission,
  } = useFieldArray({
    control,
    name: 'mission' as never,
  });

  // Manage Dynamic Values Items
  const {
    fields: valueFields,
    append: appendValue,
    remove: removeValue,
  } = useFieldArray({
    control,
    name: 'values' as never,
  });

  const onSubmit = async (values: AboutContentValues) => {
    try {
      const res = await saveAboutContentAction(values);
      if (res.ok) {
        toast.success('Konten Tentang Kami berhasil diperbarui');
      } else {
        toast.error(res.error.message || 'Gagal menyimpan konten');
      }
    } catch {
      toast.error('Terjadi kendala saat menyimpan data');
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Halaman &ldquo;Tentang Kami&rdquo;</CardTitle>
        <CardDescription>
          Kelola profil penerbit, visi, misi literasi, narasi sejarah pendirian, dan nilai-nilai editorial Frasa Klausa Media.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Judul & Subjudul */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="about-title" className="text-xs font-semibold">
                Judul Halaman <span className="text-destructive">*</span>
              </Label>
              <Input
                id="about-title"
                placeholder="Tentang Frasa Klausa Media"
                {...register('title')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="about-subtitle" className="text-xs font-semibold">
                Sub-Judul (Opsional)
              </Label>
              <Input
                id="about-subtitle"
                placeholder="Mewujudkan Naskah Menjadi Buku"
                {...register('subtitle')}
                className={errors.subtitle ? 'border-destructive' : ''}
              />
              {errors.subtitle && (
                <p className="text-xs text-destructive">{errors.subtitle.message}</p>
              )}
            </div>
          </div>

          {/* Visi Penerbit */}
          <div className="space-y-1.5">
            <Label htmlFor="about-vision" className="text-xs font-semibold">
              Visi Penerbit <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="about-vision"
              rows={3}
              placeholder="Menjadi penerbit independen rujukan di Indonesia yang melahirkan karya-karya bermutu..."
              {...register('vision')}
              className={errors.vision ? 'border-destructive' : ''}
            />
            {errors.vision && (
              <p className="text-xs text-destructive">{errors.vision.message}</p>
            )}
          </div>

          {/* Misi Penerbit (Dynamic List) */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">
                  Misi Penerbit <span className="text-destructive">*</span>
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Daftar butir komitmen dan langkah nyata yang dijalankan penerbit (minimal 1 butir).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendMission('')}
                className="gap-1 text-xs"
                disabled={missionFields.length >= 10}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Misi</span>
              </Button>
            </div>

            {errors.mission && typeof errors.mission.message === 'string' && (
              <p className="text-xs text-destructive">{errors.mission.message}</p>
            )}

            <div className="space-y-2">
              {missionFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <span className="flex h-9 w-6 shrink-0 items-center justify-center text-xs font-mono font-semibold text-muted-foreground">
                    {index + 1}.
                  </span>
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder={`Contoh butir misi ke-${index + 1}...`}
                      {...register(`mission.${index}` as const)}
                      className="text-xs sm:text-sm"
                    />
                    {errors.mission?.[index] && (
                      <p className="text-[11px] text-destructive">
                        {errors.mission[index]?.message}
                      </p>
                    )}
                  </div>
                  {missionFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMission(index)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      title="Hapus butir misi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sejarah & Narasi Penerbit */}
          <div className="space-y-1.5">
            <Label htmlFor="about-history" className="text-xs font-semibold">
              Sejarah & Narasi Penerbit <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="about-history"
              rows={6}
              placeholder="Berdiri dengan semangat memperkaya khazanah perbukuan Indonesia, Frasa Klausa Media berawal dari..."
              {...register('history')}
              className={errors.history ? 'border-destructive' : ''}
            />
            {errors.history ? (
              <p className="text-xs text-destructive">{errors.history.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Tuliskan kisah pendirian dan filosofi editorial. Teks disanitasi secara otomatis saat disimpan untuk mencegah serangan XSS.
              </p>
            )}
          </div>

          {/* Nilai-Nilai Penerbit (Values List) */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">Nilai-Nilai Utama (Values)</Label>
                <p className="text-[11px] text-muted-foreground">
                  Prinsip editorial dan integritas karya yang dijunjung tinggi penerbit.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendValue({ name: '', description: '' })}
                className="gap-1 text-xs"
                disabled={valueFields.length >= 6}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Nilai</span>
              </Button>
            </div>

            <div className="space-y-3">
              {valueFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border bg-background p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      placeholder="Nama Nilai (contoh: Integritas Karya)"
                      {...register(`values.${index}.name` as const)}
                      className="font-semibold text-xs sm:text-sm max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeValue(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Hapus Nilai"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Deskripsi nilai (contoh: Menghormati hak cipta dan orisinalitas...)"
                    {...register(`values.${index}.description` as const)}
                    className="text-xs"
                  />
                </div>
              ))}
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
              <span>Simpan Perubahan Tentang Kami</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
