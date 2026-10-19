'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  contactContentSchema,
  type ContactContentInput,
  type ContactContentValues,
} from '@/validations/site-content';
import { saveContactContentAction } from '@/actions/site-content';
import type { ContactContentPayload } from '@/types';

interface ContactFormProps {
  initialData: ContactContentPayload;
}

export function ContactForm({ initialData }: ContactFormProps) {
  const form = useForm<ContactContentValues>({
    resolver: zodResolver(contactContentSchema),
    defaultValues: {
      company_name: initialData.company_name || 'Frasa Klausa Media',
      tagline: initialData.tagline || 'Mewujudkan Naskah Menjadi Buku',
      email: initialData.email || 'frasaklausamedia@gmail.com',
      phone: initialData.phone || '0813-8060-4256',
      whatsapp: initialData.whatsapp || '0813-8060-4256',
      address: initialData.address || '',
      operating_hours: initialData.operating_hours || 'Senin – Jumat: 09.00 – 17.00 WIB',
      maps_embed_url: initialData.maps_embed_url || '',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentMapsUrl = watch('maps_embed_url');

  const onSubmit = async (values: ContactContentValues) => {
    try {
      const res = await saveContactContentAction(values);
      if (res.ok) {
        toast.success('Informasi Kontak & Operasional berhasil disimpan');
      } else {
        toast.error(res.error.message || 'Gagal menyimpan kontak');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Informasi Kontak & Lokasi Kantor</CardTitle>
        <CardDescription>
          Atur saluran komunikasi resmi penerbit (WhatsApp, surel, telepon, alamat redaksi) dan sematan peta lokasi untuk halaman publik & footer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nama Penerbit & Slogan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-xs font-semibold">
                Nama Penerbit / Usaha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company-name"
                placeholder="Frasa Klausa Media"
                {...register('company_name')}
                className={errors.company_name ? 'border-destructive' : ''}
              />
              {errors.company_name && (
                <p className="text-xs text-destructive">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company-tagline" className="text-xs font-semibold">
                Slogan / Tagline
              </Label>
              <Input
                id="company-tagline"
                placeholder="Mewujudkan Naskah Menjadi Buku"
                {...register('tagline')}
                className={errors.tagline ? 'border-destructive' : ''}
              />
              {errors.tagline && (
                <p className="text-xs text-destructive">{errors.tagline.message}</p>
              )}
            </div>
          </div>

          {/* Surel, Telepon & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-xs font-semibold">
                Alamat Surel (Email) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="frasaklausamedia@gmail.com"
                  {...register('email')}
                  className={`pl-8 text-xs sm:text-sm ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-phone" className="text-xs font-semibold">
                Nomor Telepon Kantor <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-phone"
                  placeholder="0813-8060-4256"
                  {...register('phone')}
                  className={`pl-8 font-mono text-xs sm:text-sm ${errors.phone ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-wa" className="text-xs font-semibold">
                Nomor WhatsApp Resmi <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-600" />
                <Input
                  id="contact-wa"
                  placeholder="0813-8060-4256"
                  {...register('whatsapp')}
                  className={`pl-8 font-mono text-xs sm:text-sm ${errors.whatsapp ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.whatsapp ? (
                <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Digunakan untuk tujuan pemesanan cepat via WhatsApp.
                </p>
              )}
            </div>
          </div>

          {/* Alamat Fisik & Jam Operasional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-address" className="text-xs font-semibold">
                Alamat Fisik Kantor Redaksi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="contact-address"
                rows={3}
                placeholder="Jl. Literasi No. 42, RT 03 / RW 05, Jakarta Timur, DKI Jakarta 13420"
                {...register('address')}
                className={errors.address ? 'border-destructive' : ''}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-hours" className="text-xs font-semibold">
                Jam Operasional
              </Label>
              <Textarea
                id="contact-hours"
                rows={3}
                placeholder="Senin – Jumat: 09.00 – 17.00 WIB&#10;Sabtu: 09.00 – 14.00 WIB&#10;Minggu & Libur Nasional: Tutup"
                {...register('operating_hours')}
                className={errors.operating_hours ? 'border-destructive' : ''}
              />
              {errors.operating_hours && (
                <p className="text-xs text-destructive">{errors.operating_hours.message}</p>
              )}
            </div>
          </div>

          {/* Sematan Google Maps Embed */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/10">
            <div className="space-y-1">
              <Label htmlFor="contact-maps" className="text-xs font-semibold">
                URL Sematan Google Maps (Iframe Embed)
              </Label>
              <Input
                id="contact-maps"
                placeholder="https://www.google.com/maps/embed?pb=..."
                {...register('maps_embed_url')}
                className={errors.maps_embed_url ? 'border-destructive font-mono text-xs' : 'font-mono text-xs'}
              />
              {errors.maps_embed_url ? (
                <p className="text-xs text-destructive">{errors.maps_embed_url.message}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Salin atribut <code>src</code> dari opsi &ldquo;Share / Bagikan &gt; Embed a map&rdquo; pada Google Maps.
                </p>
              )}
            </div>

            {/* Live Map Preview */}
            {currentMapsUrl && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Pratinjau Peta Interaktif
                </span>
                <div className="overflow-hidden rounded-lg border aspect-video w-full max-h-60 bg-muted">
                  <iframe
                    src={currentMapsUrl}
                    title="Google Maps Preview"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Simpan Informasi Kontak</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
