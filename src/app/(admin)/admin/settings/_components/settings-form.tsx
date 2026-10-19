'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Globe,
  Sliders,
  Shield,
  Loader2,
  Save,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { SystemSettingsPayload } from '@/types/settings';
import {
  systemSettingsFormSchema,
  type SystemSettingsFormInput,
} from '@/validations/settings';
import { saveSettingsAction } from '@/actions/settings';

interface SettingsFormProps {
  initialData: SystemSettingsPayload;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SystemSettingsFormInput>({
    resolver: zodResolver(systemSettingsFormSchema),
    defaultValues: {
      general: {
        site_name: initialData.general.site_name,
        site_tagline: initialData.general.site_tagline,
        contact_email: initialData.general.contact_email,
        contact_phone: initialData.general.contact_phone,
        contact_whatsapp: initialData.general.contact_whatsapp,
        office_address: initialData.general.office_address,
        default_meta_description: initialData.general.default_meta_description,
      },
      features: {
        enable_blog_comments: initialData.features.enable_blog_comments,
        enable_public_registration: initialData.features.enable_public_registration,
        maintenance_mode: initialData.features.maintenance_mode,
        enable_marketplace_redirect: initialData.features.enable_marketplace_redirect,
      },
    },
  });

  const onSubmit = (values: SystemSettingsFormInput) => {
    startTransition(async () => {
      const response = await saveSettingsAction(values);

      if (!response.ok) {
        if (response.error.fieldErrors) {
          Object.entries(response.error.fieldErrors).forEach(([field, messages]) => {
            // Mapping format nested: general.site_name
            form.setError(field as Parameters<typeof form.setError>[0], {
              type: 'server',
              message: messages[0],
            });
          });
        }
        toast.error(response.error.message || 'Gagal menyimpan pengaturan platform.');
        return;
      }

      toast.success(response.data.message);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sesuaikan identitas operasional, parameter kontak, dan fitur sistem Frasa Klausa Media.
          </p>
          <Button type="submit" disabled={isPending} className="gap-2 shadow-sm">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="general" className="gap-2 text-xs">
              <Globe className="h-4 w-4" /> Identitas & Kontak
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2 text-xs">
              <Sliders className="h-4 w-4" /> Fitur Platform
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-xs">
              <Shield className="h-4 w-4" /> Audit & Keamanan
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: IDENTITAS & KONTAK */}
          <TabsContent value="general" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identitas Situs & Kontak Resmi</CardTitle>
                <CardDescription>
                  Informasi ini ditampilkan pada tajuk publik, footer situs, dan halaman kontak resmi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="general.site_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Situs / Penerbit</FormLabel>
                        <FormControl>
                          <Input placeholder="Frasa Klausa Media" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="general.site_tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slogan / Tagline</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Penerbit Buku Berkualitas & Ruang Literasi"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="general.contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Korespondensi</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="frasaklausamedia@gmail.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="general.contact_whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. WhatsApp Utama</FormLabel>
                        <FormControl>
                          <Input placeholder="0813-8060-4256" {...field} />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          Target pemesanan buku katalog via WA
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="general.contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Telepon Kantor</FormLabel>
                        <FormControl>
                          <Input placeholder="0813-8060-4256" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="general.office_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Kantor Operasional</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alamat fisik studio penerbitan dan sekretariat..."
                          className="resize-y min-h-[70px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="general.default_meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Meta SEO Default</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi ringkas yang tampil pada mesin pencari Google saat membagikan tautan beranda..."
                          className="resize-y min-h-[70px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FITUR PLATFORM */}
          <TabsContent value="features" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ketersediaan & Toggle Fitur</CardTitle>
                <CardDescription>
                  Aktifkan atau nonaktifkan modul publik dan alur checkout platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="features.enable_marketplace_redirect"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Redirect Marketplace & WhatsApp Checkout
                        </FormLabel>
                        <FormDescription>
                          Tampilkan tombol pemesanan Shopee, Tokopedia, dan WhatsApp di halaman detail buku.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features.enable_blog_comments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Kolom Komentar Artikel Blog
                        </FormLabel>
                        <FormDescription>
                          Izinkan pembaca publik meninggalkan tanggapan pada artikel terbitan.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features.maintenance_mode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium text-amber-600 dark:text-amber-400">
                          Mode Pemeliharaan (Maintenance Mode)
                        </FormLabel>
                        <FormDescription>
                          Tampilkan banner pemberitahuan pemeliharaan terjadwal di seluruh halaman publik.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features.enable_public_registration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/30">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-base font-medium">
                            Registrasi Akun Publik
                          </FormLabel>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground border">
                            PRD §5: Nonaktif
                          </span>
                        </div>
                        <FormDescription>
                          Sistem Frasa Klausa Media v1.0 secara tegas membatasi autentikasi khusus Admin & Super Admin tanpa pendaftaran umum.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={true}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: DOKUMENTASI KEAMANAN & AUDIT */}
          <TabsContent value="security" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integritas Sistem & Jejak Audit</CardTitle>
                <CardDescription>
                  Kebijakan keamanan data, kepatuhan arsitektur, dan sifat rekaman audit log.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Audit Trail Append-Only (Tabel audit_logs)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Setiap mutasi penting — mencakup pembuatan akun admin, pengubahan status keaktifan akun, permintaan reset kredensial, dan pembaruan pengaturan sistem — dicatat permanen di tabel <code>public.audit_logs</code>. Tabel ini dilindungi aturan PostgreSQL (<code>DO INSTEAD NOTHING</code> pada <code>UPDATE</code> & <code>DELETE</code>) sehingga catatan historis tidak dapat dipalsukan atau dihapus.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Isolasi Kredensial & Bebas Secret (PRD §15.1)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tabel pengaturan (<code>system_settings</code> / <code>pengaturan</code>) hanya diperuntukkan bagi konfigurasi publik yang aman. Kredensial rahasia seperti kunci API, token Supabase Service Role, dan kata sandi disimpan ketat di Environment Platform deployment server, serta dilarang masuk ke basis data ini.
                  </p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary text-xs">
                    <HelpCircle className="h-4 w-4" />
                    <span>Kepatuhan Otorisasi Server</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Semua operasi pada modul Pengaturan & Manajemen Akun diverifikasi ganda via fungsi <code>requireSuperAdmin()</code> pada server component Next.js 16 dan Server Actions. Percobaan akses oleh pengguna dengan role selain <code>super_admin</code> akan langsung ditolak dengan status HTTP 403.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
