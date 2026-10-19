'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  bannerFormSchema,
  combineWibToUtc,
  BANNER_MESSAGE_MAX_LENGTH,
  type BannerFormValues,
} from '@/validations/banner';
import { createBannerAction, updateBannerAction } from '@/actions/banner';
import type { Banner } from '@/types';
import { DateTimePickerWib } from './date-time-picker-wib';
import { BannerPreview } from './banner-preview';

interface BannerFormDialogProps {
  banner?: Banner;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BannerFormDialog({
  banner,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: BannerFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const isEditing = Boolean(banner);

  // Inisialisasi default waktu: sekarang + 1 jam s.d. +7 hari
  const defaultStartsAt = React.useMemo(() => {
    if (banner?.starts_at) return banner.starts_at;
    const now = new Date();
    return combineWibToUtc(now, '08:00');
  }, [banner]);

  const defaultEndsAt = React.useMemo(() => {
    if (banner?.ends_at) return banner.ends_at;
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return combineWibToUtc(endDate, '23:59');
  }, [banner]);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      message: banner?.message || '',
      link_url: banner?.link_url || '',
      starts_at: defaultStartsAt,
      ends_at: defaultEndsAt,
      is_active: banner ? banner.is_active : true,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const messageValue = watch('message');
  const linkUrlValue = watch('link_url');
  const isActiveValue = watch('is_active');
  const startsAtValue = watch('starts_at');
  const endsAtValue = watch('ends_at');

  // Reset form saat dialog dibuka ulang atau data banner berubah
  React.useEffect(() => {
    if (open) {
      reset({
        message: banner?.message || '',
        link_url: banner?.link_url || '',
        starts_at: banner?.starts_at || defaultStartsAt,
        ends_at: banner?.ends_at || defaultEndsAt,
        is_active: banner ? banner.is_active : true,
      });
    }
  }, [open, banner, defaultStartsAt, defaultEndsAt, reset]);

  const onSubmit = async (values: BannerFormValues) => {
    try {
      if (isEditing && banner) {
        const res = await updateBannerAction(banner.id, values);
        if (res.ok) {
          toast.success('Banner promosi berhasil diperbarui');
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(res.error.message || 'Gagal memperbarui banner');
        }
      } else {
        const res = await createBannerAction(values);
        if (res.ok) {
          toast.success('Banner promosi berhasil dibuat');
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(res.error.message || 'Gagal membuat banner');
        }
      }
    } catch (err) {
      console.error('[BannerFormDialog] Submit error:', err);
      toast.error('Terjadi kendala saat menyimpan banner promosi');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Tambah Banner</span>
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Banner Promosi' : 'Tambah Banner Promosi Baru'}
          </DialogTitle>
          <DialogDescription>
            Atur pengumuman sticky banner yang muncul di atas navbar situs publik dengan jadwal tayang otomatis (WIB).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Pesan Banner */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="banner-message" className="text-xs font-semibold">
                Pesan Promosi <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {messageValue?.length || 0}/{BANNER_MESSAGE_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="banner-message"
              placeholder="Contoh: Dapatkan diskon 15% untuk seluruh novel pilihan pekan ini! Gunakan kode promo LITERASI2026."
              rows={3}
              {...register('message')}
              className={errors.message ? 'border-destructive' : ''}
            />
            {errors.message ? (
              <p className="text-xs text-destructive">{errors.message.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Tuliskan pesan ringkas dan persuasif berupa teks polos tanpa format HTML.
              </p>
            )}
          </div>

          {/* Tautan Tujuan */}
          <div className="space-y-1.5">
            <Label htmlFor="banner-link" className="text-xs font-semibold">
              Tautan Tujuan (Link URL)
            </Label>
            <Input
              id="banner-link"
              placeholder="/buku/jejak-sunyi-di-sudut-kota atau https://shopee.co.id/frasaklausamedia"
              {...register('link_url')}
              className={errors.link_url ? 'border-destructive' : ''}
            />
            {errors.link_url ? (
              <p className="text-xs text-destructive">{errors.link_url.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Dapat berupa path internal (<code className="text-primary font-mono">/buku/[slug]</code>, <code className="text-primary font-mono">/blog/[slug]</code>, <code className="text-primary font-mono">/katalog</code>) atau URL eksternal berawalan <code className="text-primary font-mono">https://</code>.
              </p>
            )}
          </div>

          {/* Rentang Tanggal & Jam (WIB) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-3 bg-muted/20">
            <DateTimePickerWib
              id="starts-at-picker"
              label="Mulai Tayang"
              value={startsAtValue}
              onChange={(utcIso) => setValue('starts_at', utcIso, { shouldValidate: true })}
              error={errors.starts_at?.message}
            />

            <DateTimePickerWib
              id="ends-at-picker"
              label="Selesai Tayang"
              value={endsAtValue}
              onChange={(utcIso) => setValue('ends_at', utcIso, { shouldValidate: true })}
              error={errors.ends_at?.message}
            />
          </div>

          {/* Sakelar Aktif Manual */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/10">
            <div className="space-y-0.5">
              <Label htmlFor="is-active-switch" className="text-xs font-semibold cursor-pointer">
                Status Aktifkan Banner
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Jika dimatikan, banner tidak akan tayang di publik meskipun jadwal waktunya sedang berjalan.
              </p>
            </div>
            <Switch
              id="is-active-switch"
              checked={isActiveValue}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          {/* Live Preview Sticky Banner */}
          <div className="pt-1">
            <BannerPreview
              message={messageValue || ''}
              linkUrl={linkUrlValue}
              isActive={isActiveValue}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditing ? 'Simpan Perubahan' : 'Buat Banner'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
