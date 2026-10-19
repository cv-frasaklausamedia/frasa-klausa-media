'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  contactInquirySchema,
  type ContactInquiryInput,
} from '@/validations/inquiry';
import { submitContactInquiryAction } from '@/actions/inquiry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ContactInquiryForm() {
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactInquiryInput>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      hp_field: '',
    },
  });

  const currentMessage = watch('message') || '';

  const onSubmit = async (values: ContactInquiryInput) => {
    try {
      const response = await submitContactInquiryAction(values);

      if (!response.ok) {
        if (response.error.fieldErrors) {
          Object.entries(response.error.fieldErrors).forEach(([field, msgs]) => {
            setError(field as keyof ContactInquiryInput, {
              type: 'server',
              message: msgs[0],
            });
          });
        }
        toast.error(response.error.message || 'Gagal mengirim pesan.');
        return;
      }

      toast.success(response.data.message);
      setIsSuccess(true);
      reset();
    } catch (err) {
      console.error('[ContactInquiryForm] Unexpected error:', err);
      toast.error('Terjadi kendala saat mengirim pesan. Silakan coba lagi.');
    }
  };

  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-xs p-6 sm:p-8">
      <div className="mb-6 space-y-1">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
          Kirim Pesan atau Pertanyaan
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Isi formulir di bawah ini untuk konsultasi penerbitan naskah, pemesanan, atau kerja sama literasi.
        </p>
      </div>

      {isSuccess ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-3 animate-in fade-in duration-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-foreground">
            Pesan Anda Berhasil Terkirim!
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Terima kasih telah menghubungi Frasa Klausa Media. Tim redaksi kami akan segera merespons pesan Anda ke email yang Anda cantumkan.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSuccess(false)}
            className="mt-2 text-xs"
          >
            Kirim Pesan Lainnya
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Honeypot field tersembunyi (Anti-Spam Bot Protection) */}
          <div
            style={{
              position: 'absolute',
              opacity: 0,
              zIndex: -1,
              pointerEvents: 'none',
              height: 0,
              width: 0,
              overflow: 'hidden',
            }}
            aria-hidden="true"
          >
            <label htmlFor="hp_field">Jangan isi bidang ini jika Anda manusia</label>
            <input
              id="hp_field"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register('hp_field')}
            />
          </div>

          {/* Baris 1: Nama & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-xs font-semibold">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-name"
                placeholder="cth. Budi Prasetyo"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
                disabled={isSubmitting}
                {...register('name')}
              />
              {errors.name && (
                <p
                  id="contact-name-error"
                  role="alert"
                  className="text-[11px] font-medium text-destructive"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-xs font-semibold">
                Alamat Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="cth. budi@email.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'contact-email-error' : undefined}
                disabled={isSubmitting}
                {...register('email')}
              />
              {errors.email && (
                <p
                  id="contact-email-error"
                  role="alert"
                  className="text-[11px] font-medium text-destructive"
                >
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Baris 2: Nomor Telepon / WA & Subjek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone" className="text-xs font-semibold">
                Nomor Telepon / WhatsApp <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="cth. 081234567890"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                disabled={isSubmitting}
                {...register('phone')}
              />
              {errors.phone && (
                <p
                  id="contact-phone-error"
                  role="alert"
                  className="text-[11px] font-medium text-destructive"
                >
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-subject" className="text-xs font-semibold">
                Subjek Pesan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-subject"
                placeholder="cth. Pengajuan Naskah Novel"
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                disabled={isSubmitting}
                {...register('subject')}
              />
              {errors.subject && (
                <p
                  id="contact-subject-error"
                  role="alert"
                  className="text-[11px] font-medium text-destructive"
                >
                  {errors.subject.message}
                </p>
              )}
            </div>
          </div>

          {/* Baris 3: Pesan Lengkap */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="contact-message" className="text-xs font-semibold">
                Isi Pesan <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {currentMessage.length} / 2000 karakter
              </span>
            </div>
            <Textarea
              id="contact-message"
              rows={5}
              placeholder="Tuliskan pertanyaan, rincian naskah, atau pesan kerja sama Anda secara detail..."
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
              disabled={isSubmitting}
              className="resize-y min-h-[120px]"
              {...register('message')}
            />
            {errors.message && (
              <p
                id="contact-message-error"
                role="alert"
                className="text-[11px] font-medium text-destructive"
              >
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Tombol Submit dengan perlindungan Double Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[160px] gap-2 font-medium shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirimkan Pesan...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kirim Pesan</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
