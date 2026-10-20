'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  ExternalLink,
  ShoppingBag,
  Video,
  Share2,
} from 'lucide-react';

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  socialContentSchema,
  type SocialContentInput,
  type SocialContentValues,
} from '@/validations/site-content';
import { saveSocialContentAction } from '@/actions/site-content';
import { DEFAULT_SOCIAL_CONTENT } from '@/lib/site-content/defaults';
import type { SocialContentPayload } from '@/types';

interface SocialFormProps {
  initialData: SocialContentPayload;
}

export function SocialForm({ initialData }: SocialFormProps) {
  const form = useForm<SocialContentValues>({
    resolver: zodResolver(socialContentSchema),
    defaultValues: {
      instagram: initialData.instagram || DEFAULT_SOCIAL_CONTENT.instagram,
      facebook: initialData.facebook || DEFAULT_SOCIAL_CONTENT.facebook,
      tiktok: initialData.tiktok || DEFAULT_SOCIAL_CONTENT.tiktok,
      twitter: initialData.twitter || DEFAULT_SOCIAL_CONTENT.twitter,
      shopee: initialData.shopee || DEFAULT_SOCIAL_CONTENT.shopee,
      tokopedia: initialData.tokopedia || DEFAULT_SOCIAL_CONTENT.tokopedia,
      youtube: initialData.youtube || DEFAULT_SOCIAL_CONTENT.youtube,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentValues = watch();

  const onSubmit = async (values: SocialContentValues) => {
    try {
      const res = await saveSocialContentAction(values);
      if (res.ok) {
        toast.success('Tautan Media Sosial berhasil diperbarui');
      } else {
        toast.error(res.error.message || 'Gagal menyimpan media sosial');
      }
    } catch {
      toast.error('Terjadi kendala saat menyimpan data');
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Tautan Media Sosial & Toko Resmi</CardTitle>
        <CardDescription>
          Kelola profil kanal media sosial resmi penerbit dan toko buku di marketplace untuk ditampilkan pada footer dan halaman kontak.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Instagram */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="social-instagram" className="text-xs font-semibold flex items-center gap-1.5">
                  <InstagramIcon className="h-4 w-4 text-pink-500" /> Instagram
                </Label>
                {currentValues.instagram && (
                  <a
                    href={currentValues.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Uji Tautan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="social-instagram"
                placeholder="https://instagram.com/frasaklausamedia"
                {...register('instagram')}
                className={`text-xs sm:text-sm font-mono ${errors.instagram ? 'border-destructive' : ''}`}
              />
              {errors.instagram && (
                <p className="text-xs text-destructive">{errors.instagram.message}</p>
              )}
            </div>

            {/* Facebook */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="social-facebook" className="text-xs font-semibold flex items-center gap-1.5">
                  <FacebookIcon className="h-4 w-4 text-blue-600" /> Facebook
                </Label>
                {currentValues.facebook && (
                  <a
                    href={currentValues.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Uji Tautan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="social-facebook"
                placeholder="https://facebook.com/frasaklausamedia"
                {...register('facebook')}
                className={`text-xs sm:text-sm font-mono ${errors.facebook ? 'border-destructive' : ''}`}
              />
              {errors.facebook && (
                <p className="text-xs text-destructive">{errors.facebook.message}</p>
              )}
            </div>

            {/* TikTok */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="social-tiktok" className="text-xs font-semibold flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-foreground" /> TikTok
                </Label>
                {currentValues.tiktok && (
                  <a
                    href={currentValues.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Uji Tautan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="social-tiktok"
                placeholder="https://tiktok.com/@frasaklausamedia"
                {...register('tiktok')}
                className={`text-xs sm:text-sm font-mono ${errors.tiktok ? 'border-destructive' : ''}`}
              />
              {errors.tiktok && (
                <p className="text-xs text-destructive">{errors.tiktok.message}</p>
              )}
            </div>

            {/* Twitter / X */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="social-twitter" className="text-xs font-semibold flex items-center gap-1.5">
                  <TwitterIcon className="h-4 w-4 text-sky-500" /> Twitter / X
                </Label>
                {currentValues.twitter && (
                  <a
                    href={currentValues.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Uji Tautan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="social-twitter"
                placeholder="https://x.com/frasaklausa"
                {...register('twitter')}
                className={`text-xs sm:text-sm font-mono ${errors.twitter ? 'border-destructive' : ''}`}
              />
              {errors.twitter && (
                <p className="text-xs text-destructive">{errors.twitter.message}</p>
              )}
            </div>

            {/* Shopee Official */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="social-shopee" className="text-xs font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-orange-500" /> Shopee Official Store
                </Label>
                {currentValues.shopee && (
                  <a
                    href={currentValues.shopee}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Uji Tautan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="social-shopee"
                placeholder="https://shopee.co.id/frasaklausamedia"
                {...register('shopee')}
                className={`text-xs sm:text-sm font-mono ${errors.shopee ? 'border-destructive' : ''}`}
              />
              {errors.shopee && (
                <p className="text-xs text-destructive">{errors.shopee.message}</p>
              )}
            </div>

            {/* Tokopedia Official */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="social-tokopedia" className="text-xs font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" /> Tokopedia Official Store
                </Label>
                {currentValues.tokopedia && (
                  <a
                    href={currentValues.tokopedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    Uji Tautan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="social-tokopedia"
                placeholder="https://tokopedia.com/frasaklausamedia"
                {...register('tokopedia')}
                className={`text-xs sm:text-sm font-mono ${errors.tokopedia ? 'border-destructive' : ''}`}
              />
              {errors.tokopedia && (
                <p className="text-xs text-destructive">{errors.tokopedia.message}</p>
              )}
            </div>
          </div>

          {/* YouTube */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="social-youtube" className="text-xs font-semibold flex items-center gap-1.5">
                <Video className="h-4 w-4 text-red-600" /> Saluran YouTube (Opsional)
              </Label>
              {currentValues.youtube && (
                <a
                  href={currentValues.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Uji Tautan <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <Input
              id="social-youtube"
              placeholder="https://youtube.com/@frasaklausamedia"
              {...register('youtube')}
              className={`text-xs sm:text-sm font-mono ${errors.youtube ? 'border-destructive' : ''}`}
            />
            {errors.youtube && (
              <p className="text-xs text-destructive">{errors.youtube.message}</p>
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
              <span>Simpan Media Sosial</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
