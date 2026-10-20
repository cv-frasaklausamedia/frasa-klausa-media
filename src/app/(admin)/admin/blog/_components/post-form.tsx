'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sparkles,
  Upload,
  Trash2,
  Tag,
  Clock,
  ArrowLeft,
  Loader2,
  Eye,
  CheckCircle2,
  X,
  HelpCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyTiptapEditor } from '@/components/admin/lazy-tiptap-editor';
import {
  postFormSchema,
  generateSlug,
  calculateReadingTimeMinutes,
  formatReadingTime,
  type PostFormInput,
  type PostFormValues,
} from '@/validations/post';
import {
  createPostAction,
  updatePostAction,
  uploadBlogImageAction,
  cleanupBlogUploadedFilesAction,
} from '@/actions/post';
import type { PostDetail, BlogCategoryOption } from '@/lib/posts/types';

interface PostFormProps {
  initialData?: PostDetail | null;
  categories: BlogCategoryOption[];
  defaultAuthorName?: string;
}

export function PostForm({
  initialData,
  categories,
  defaultAuthorName = 'Admin Editorial',
}: PostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Lacak path gambar yang diunggah SESI INI di client untuk orphan cleanup jika dibatalkan/gagal
  const [sessionUploadedPaths, setSessionUploadedPaths] = useState<string[]>([]);
  const sessionUploadedPathsRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sessionUploadedPathsRef.current = sessionUploadedPaths;
  }, [sessionUploadedPaths]);

  // Cleanup saat form di-unmount (misal user navigasi client-side tanpa simpan)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      setTimeout(() => {
        if (!isMountedRef.current && sessionUploadedPathsRef.current.length > 0) {
          const pathsToClean = [...sessionUploadedPathsRef.current];
          sessionUploadedPathsRef.current = [];
          cleanupBlogUploadedFilesAction(pathsToClean).catch((err) => {
            console.error('[PostForm unmount cleanup] Error:', err);
          });
        }
      }, 150);
    };
  }, []);

  const isEditing = Boolean(initialData);

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<PostFormInput, unknown, PostFormValues>({
    resolver: zodResolver(postFormSchema) as Resolver<PostFormInput, unknown, PostFormValues>,
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      excerpt: initialData?.excerpt ?? '',
      content: initialData?.content ?? '',
      cover_url: initialData?.cover_url ?? null,
      category_id: initialData?.category_id ?? (categories[0]?.id || ''),
      tags: initialData?.tags ?? [],
      author_name: initialData?.author_name ?? defaultAuthorName,
      status: initialData?.status ?? 'draft',
      published_at: initialData?.published_at
        ? new Date(initialData.published_at).toISOString().slice(0, 16)
        : '',
      seo_title: initialData?.seo_title ?? '',
      seo_description: initialData?.seo_description ?? '',
    },
  });

  const watchedTitle = watch('title');
  const watchedContent = watch('content');
  const watchedCoverUrl = watch('cover_url');
  const watchedTags = watch('tags') || [];
  const watchedStatus = watch('status');
  const watchedPublishedAt = watch('published_at');

  // Hitung waktu baca dinamis
  const estimatedReadingTime = calculateReadingTimeMinutes(watchedContent);

  // Otomatis buat slug dari judul jika pengguna belum mengisi atau mengklik tombol buat slug
  const handleGenerateSlug = () => {
    if (watchedTitle) {
      const generated = generateSlug(watchedTitle);
      setValue('slug', generated, { shouldValidate: true });
    }
  };

  // Upload Cover Thumbnail
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format berkas tidak valid. Harap pilih gambar JPEG, PNG, atau WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran sampul melebihi batas maksimal 5 MB.');
      return;
    }

    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadBlogImageAction(formData, 'covers');
      if (response.ok) {
        setValue('cover_url', response.data.url, { shouldValidate: true });
        setSessionUploadedPaths((prev) => [...prev, response.data.path]);
        toast.success('Sampul artikel berhasil diunggah.');
      } else {
        toast.error(response.error.message || 'Gagal mengunggah gambar sampul.');
      }
    } catch (err) {
      console.error('[handleCoverUpload] Error:', err);
      toast.error('Terjadi kesalahan saat mengunggah sampul.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    setValue('cover_url', null, { shouldValidate: true });
  };

  // Handler Upload Gambar Inline Tiptap
  const handleInlineImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await uploadBlogImageAction(formData, 'inline');
    if (!response.ok) {
      throw new Error(response.error.message || 'Gagal mengunggah gambar inline.');
    }

    // Lacak path gambar di sesi
    setSessionUploadedPaths((prev) => [...prev, response.data.path]);
    return { url: response.data.url, path: response.data.path };
  };

  // Handler Tags
  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanTag) return;

    if (cleanTag.length < 2 || cleanTag.length > 30) {
      toast.error('Panjang tag harus antara 2 hingga 30 karakter.');
      return;
    }

    if (watchedTags.length >= 10) {
      toast.error('Maksimal 10 tag per artikel.');
      return;
    }

    if (watchedTags.includes(cleanTag)) {
      toast.error('Tag sudah ditambahkan.');
      return;
    }

    setValue('tags', [...watchedTags, cleanTag], { shouldValidate: true });
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      watchedTags.filter((t) => t !== tagToRemove),
      { shouldValidate: true }
    );
  };

  // Submit Handler
  const onSubmit = (values: PostFormValues) => {
    startTransition(async () => {
      try {
        // Konversi published_at ke ISO string jika diisi
        const formattedValues = {
          ...values,
          published_at: values.published_at
            ? new Date(values.published_at).toISOString()
            : null,
        };

        const response = isEditing && initialData
          ? await updatePostAction(initialData.id, formattedValues)
          : await createPostAction(formattedValues);

        if (response.ok) {
          // Kosongkan pelacakan path sesi agar unmount cleanup tidak menghapus berkas yang telah disimpan
          sessionUploadedPathsRef.current = [];
          setSessionUploadedPaths([]);

          toast.success(
            isEditing
              ? 'Artikel berhasil diperbarui.'
              : 'Artikel baru berhasil dibuat.'
          );
          router.push('/admin/blog');
          router.refresh();
        } else {
          toast.error(response.error.message || 'Gagal menyimpan artikel.');

          if (response.error.fieldErrors) {
            Object.entries(response.error.fieldErrors).forEach(([field, msgs]) => {
              if (msgs && msgs[0]) {
                setError(field as keyof PostFormValues, { message: msgs[0] });
              }
            });
          }
        }
      } catch (err) {
        console.error('[PostForm onSubmit] Error:', err);
        toast.error('Terjadi kesalahan koneksi saat menyimpan artikel.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">
      {/* Header Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 -ml-2 text-muted-foreground">
              <Link href="/admin/blog">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali ke Daftar
              </Link>
            </Button>
            <Badge variant="outline" className="text-xs">
              {isEditing ? 'Mode Edit' : 'Artikel Baru'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEditing ? `Ubah Artikel: ${initialData?.title}` : 'Tulis Artikel Literasi Baru'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && initialData && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/admin/blog/${initialData.id}/preview`} target="_blank">
                <Eye className="h-4 w-4" />
                <span>Pratinjau</span>
              </Link>
            </Button>
          )}

          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>{isEditing ? 'Simpan Perubahan' : 'Buat Artikel'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Konten Utama (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Judul & Slug */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informasi Utama</CardTitle>
              <CardDescription>
                Tuliskan judul artikel yang menarik dan slug URL yang ramah mesin pencari.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Judul Artikel <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Contoh: Menelisik Keindahan Diksi dalam Cerpen Kontemporer"
                  {...register('title')}
                  disabled={isPending}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">
                    Slug URL <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSlug}
                    className="h-7 text-xs text-primary gap-1"
                    disabled={isPending || !watchedTitle}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Buat dari Judul
                  </Button>
                </div>
                <Input
                  id="slug"
                  placeholder="menelisik-keindahan-diksi-cerpen-kontemporer"
                  className="font-mono text-sm"
                  {...register('slug')}
                  disabled={isPending}
                />
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">
                  Ringkasan / Cuplikan Artikel (Excerpt)
                </Label>
                <Textarea
                  id="excerpt"
                  placeholder="Deskripsi singkat yang tampil pada kartu artikel blog di beranda dan halaman publik..."
                  rows={3}
                  {...register('excerpt')}
                  disabled={isPending}
                />
                {errors.excerpt && (
                  <p className="text-xs text-destructive">{errors.excerpt.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editor Konten Tiptap */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Konten Artikel (Rich Text)</CardTitle>
                  <CardDescription>
                    Tulis artikel lengkap dengan heading, kutipan sastra, tautan, dan gambar inline.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatReadingTime(estimatedReadingTime)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <LazyTiptapEditor
                value={watchedContent}
                onChange={(html) => setValue('content', html, { shouldValidate: true })}
                disabled={isPending}
                allowImages={true}
                onImageUpload={handleInlineImageUpload}
              />
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Pengaturan SEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Optimasi SEO & Meta Tag (Opsional)</CardTitle>
              <CardDescription>
                Kustomisasi judul dan deskripsi yang dibaca Google dan dibagikan ke media sosial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Meta Title</Label>
                <Input
                  id="seo_title"
                  placeholder="Kustomisasi judul SEO (default menggunakan judul artikel)"
                  {...register('seo_title')}
                  disabled={isPending}
                />
                {errors.seo_title && (
                  <p className="text-xs text-destructive">{errors.seo_title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">SEO Meta Description</Label>
                <Textarea
                  id="seo_description"
                  placeholder="Kustomisasi ringkasan untuk meta description Google..."
                  rows={2}
                  {...register('seo_description')}
                  disabled={isPending}
                />
                {errors.seo_description && (
                  <p className="text-xs text-destructive">{errors.seo_description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Taksonomi, Publikasi, Sampul (1 Kolom) */}
        <div className="space-y-6">
          {/* Status & Jadwal Publikasi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publikasi & Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status Artikel</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(val) =>
                    setValue('status', val as 'draft' | 'published', { shouldValidate: true })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draf (Hanya Admin)</SelectItem>
                    <SelectItem value="published">Terbitkan (Publik)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-xs text-destructive">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="published_at">Tanggal & Jam Rilis</Label>
                  <span title="Dapat diisi tanggal masa depan untuk publikasi terjadwal. Jika dikosongkan pada status Terbit, akan menggunakan waktu saat ini.">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </span>
                </div>
                <Input
                  id="published_at"
                  type="datetime-local"
                  {...register('published_at')}
                  disabled={isPending}
                />
                {errors.published_at && (
                  <p className="text-xs text-destructive">{errors.published_at.message}</p>
                )}
                {watchedStatus === 'published' && watchedPublishedAt && new Date(watchedPublishedAt) > new Date() && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Artikel ini akan berstatus <strong>Terjadwal</strong> dan baru bisa dibaca publik setelah waktu di atas.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kategori & Penulis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Kategori & Kepenulisan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">
                  Kategori Blog <span className="text-destructive">*</span>
                </Label>
                <Select
                  defaultValue={initialData?.category_id || categories[0]?.id || ''}
                  onValueChange={(val) => setValue('category_id', val, { shouldValidate: true })}
                  disabled={isPending}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Pilih kategori blog" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-xs text-destructive">{errors.category_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="author_name">
                    Nama Penulis <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Bisa diedit untuk kontributor tamu
                  </span>
                </div>
                <Input
                  id="author_name"
                  placeholder="Nama penulis artikel"
                  {...register('author_name')}
                  disabled={isPending}
                />
                {errors.author_name && (
                  <p className="text-xs text-destructive">{errors.author_name.message}</p>
                )}
              </div>

              {/* Tag Artikel */}
              <div className="space-y-2">
                <Label htmlFor="tag-input">Tag Artikel (Maksimal 10)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tag-input"
                    placeholder="Contoh: puisi, sastra"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    disabled={isPending || watchedTags.length >= 10}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={isPending || !tagInput.trim() || watchedTags.length >= 10}
                    className="h-8 text-xs shrink-0"
                  >
                    Tambah
                  </Button>
                </div>

                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {watchedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs gap-1 pl-2 pr-1 py-0.5"
                      >
                        <Tag className="h-2.5 w-2.5 text-muted-foreground" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive p-0.5 rounded"
                          disabled={isPending}
                          aria-label={`Hapus tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gambar Sampul (Cover Thumbnail 16:9) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sampul Artikel</CardTitle>
              <CardDescription>
                Rasio 16:9 disarankan. Format JPEG, PNG, atau WebP (maks 5 MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverUpload}
                disabled={isPending || isUploadingCover}
              />

              {watchedCoverUrl ? (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={watchedCoverUrl}
                      alt="Pratinjau Sampul"
                      fill
                      sizes="(max-width: 768px) 100vw, 350px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isPending || isUploadingCover}
                      className="flex-1 text-xs h-8"
                    >
                      Ganti Sampul
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveCover}
                      disabled={isPending || isUploadingCover}
                      className="text-xs h-8 px-2"
                      title="Hapus Sampul"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors rounded-lg aspect-video flex flex-col items-center justify-center p-4 cursor-pointer text-center bg-muted/20"
                >
                  {isUploadingCover ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-medium">Mengunggah sampul...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6 text-muted-foreground/60" />
                      <span className="text-xs font-medium text-foreground">
                        Pilih berkas sampul
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        JPEG, PNG, WebP (maks 5 MB)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
