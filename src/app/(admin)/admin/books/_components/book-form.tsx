'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Upload,
  Trash2,
  ArrowLeft,
  Loader2,
  MessageCircle,
  ShoppingBag,
  Store,
  Plus,
  X,
  Search,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  bookFormSchema,
  validateImageMagicBytes,
  MAX_BOOK_IMAGE_SIZE_BYTES,
  buildWhatsAppUrl,
  extractBooksStoragePath,
  type BookFormInput,
  type BookFormValues,
} from '@/validations/book';
import {
  createBookAction,
  updateBookAction,
  uploadBookImageAction,
  cleanupUploadedFilesAction,
  searchBooksForRelatedAction,
} from '@/actions/book';
import type {
  BookDetail,
  BookCategoryOption,
  BookRelatedOption,
} from '@/lib/books/types';
import { LazyTiptapEditor } from '@/components/admin/lazy-tiptap-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface BookFormProps {
  initialData?: BookDetail | null;
  categories: BookCategoryOption[];
}

export function BookForm({ initialData, categories }: BookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Lacak path yang diunggah SESI INI di client untuk orphan cleanup jika dibatalkan/gagal
  const [sessionUploadedPaths, setSessionUploadedPaths] = useState<string[]>([]);
  const sessionUploadedPathsRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  // Selalu sinkronkan ref dengan state terbaru agar cleanup pada unmount tidak membaca state basi
  useEffect(() => {
    sessionUploadedPathsRef.current = sessionUploadedPaths;
  }, [sessionUploadedPaths]);

  // Cleanup saat form di-unmount (misal user navigasi client-side tanpa simpan)
  // Dilindungi dari simulasi unmount ganda React Strict Mode di development
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Beri jeda 150ms: jika komponen re-mount (Strict Mode), cleanup dibatalkan
      setTimeout(() => {
        if (!isMountedRef.current && sessionUploadedPathsRef.current.length > 0) {
          const pathsToClean = [...sessionUploadedPathsRef.current];
          sessionUploadedPathsRef.current = [];
          cleanupUploadedFilesAction(pathsToClean).catch((err) => {
            console.error('[Unmount cleanup] Error:', err);
          });
        }
      }, 150);
    };
  }, []);

  // State Dialog Pemilih Buku Terkait
  const [relatedModalOpen, setRelatedModalOpen] = useState(false);
  const [relatedSearchQuery, setRelatedSearchQuery] = useState('');
  const [relatedSearchResults, setRelatedSearchResults] = useState<BookRelatedOption[]>([]);
  const [isSearchingRelated, setIsSearchingRelated] = useState(false);

  const isEditing = Boolean(initialData);

  // Form setup dengan RHF + ZodResolver (TFieldValues = BookFormInput, TContext = unknown, TTransformedValues = BookFormValues)
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<BookFormInput, unknown, BookFormValues>({
    resolver: zodResolver(bookFormSchema) as Resolver<BookFormInput, unknown, BookFormValues>,
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      category_id: initialData?.category_id ?? (categories[0]?.id || ''),
      author: initialData?.author ?? '',
      editor: initialData?.editor ?? '',
      publisher: initialData?.publisher ?? 'Frasa Klausa Media',
      publish_year: initialData?.publish_year ?? new Date().getFullYear(),
      isbn: initialData?.isbn ?? '',
      page_count: initialData?.page_count ?? 100,
      price_regular: initialData?.price_regular ?? 0,
      price_promo: initialData?.price_promo ?? null,
      description: initialData?.description ?? '',
      cover_url: initialData?.cover_url ?? null,
      gallery: initialData?.gallery ?? [],
      is_featured: initialData?.is_featured ?? false,
      is_published: initialData?.is_published ?? false,
      shopee_url: initialData?.shopee_url ?? '',
      tokopedia_url: initialData?.tokopedia_url ?? '',
      whatsapp_number: initialData?.whatsapp_number ?? '6281380604256',
      whatsapp_message_template:
        initialData?.whatsapp_message_template ??
        'Halo Frasa Klausa Media, saya ingin memesan buku "{judul}" dengan harga {harga}. Apakah stok masih tersedia?',
      seo_title: initialData?.seo_title ?? '',
      seo_description: initialData?.seo_description ?? '',
      related_book_ids: initialData?.related_book_ids ?? [],
    },
  });

  const {
    fields: galleryFields,
    append: appendGallery,
    remove: removeGallery,
    move: moveGallery,
  } = useFieldArray({
    control,
    name: 'gallery',
  });

  // Nilai watch untuk Live Preview & Dynamic Slugs
  const watchedTitle = watch('title');
  const watchedPriceRegular = watch('price_regular');
  const watchedPricePromo = watch('price_promo');
  const watchedCoverUrl = watch('cover_url');
  const watchedShopeeUrl = watch('shopee_url');
  const watchedTokopediaUrl = watch('tokopedia_url');
  const watchedWaNumber = watch('whatsapp_number');
  const watchedWaTemplate = watch('whatsapp_message_template');
  const watchedRelatedIds = watch('related_book_ids');

  // Generator slug otomatis jika belum diedit manual pada form baru
  useEffect(() => {
    if (!isEditing && watchedTitle) {
      const generatedSlug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [watchedTitle, isEditing, setValue]);

  // Peringatan sebelum meninggalkan halaman jika ada perubahan belum disimpan
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handler Upload Cover
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BOOK_IMAGE_SIZE_BYTES) {
      toast.error('Ukuran sampul melebihi batas 5 MB (PRD §14.5).');
      return;
    }

    try {
      setIsUploadingCover(true);

      // Validasi Magic Bytes biner asli di sisi client sebelum mengirim FormData
      const buffer = await file.arrayBuffer();
      const magicCheck = validateImageMagicBytes(new Uint8Array(buffer));
      if (!magicCheck.isValid) {
        toast.error('Format berkas tidak valid. Hanya berkas JPEG, PNG, atau WebP asli yang diizinkan.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadBookImageAction(formData, 'covers');
      if (!res.ok) {
        toast.error(res.error.message || 'Gagal mengunggah sampul buku.');
        return;
      }

      // Jika sebelumnya sudah upload cover pada sesi ini dan diganti lagi, bersihkan file cover sesi sebelumnya
      const oldCoverUrl = watchedCoverUrl;
      if (oldCoverUrl) {
        const oldStoragePath = extractBooksStoragePath(oldCoverUrl);
        if (oldStoragePath && sessionUploadedPathsRef.current.includes(oldStoragePath)) {
          cleanupUploadedFilesAction([oldStoragePath]).catch((err) => {
            console.error('[Cover replace cleanup] Error:', err);
          });
          setSessionUploadedPaths((prev) => prev.filter((p) => p !== oldStoragePath));
          sessionUploadedPathsRef.current = sessionUploadedPathsRef.current.filter((p) => p !== oldStoragePath);
        }
      }

      setValue('cover_url', res.data.url, { shouldValidate: true, shouldDirty: true });
      setSessionUploadedPaths((prev) => [...prev, res.data.path]);
      sessionUploadedPathsRef.current = [...sessionUploadedPathsRef.current, res.data.path];
      toast.success('Sampul buku berhasil diunggah.');
    } catch (err) {
      console.error('[handleCoverUpload] Error:', err);
      toast.error('Terjadi kesalahan saat mengunggah sampul.');
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  };

  // Handler Hapus Cover dari Form sebelum disimpan
  const handleRemoveCover = () => {
    const currentCoverUrl = watchedCoverUrl;
    if (currentCoverUrl) {
      const storagePath = extractBooksStoragePath(currentCoverUrl);
      if (storagePath && sessionUploadedPathsRef.current.includes(storagePath)) {
        cleanupUploadedFilesAction([storagePath]).catch((err) => {
          console.error('[handleRemoveCover cleanup] Error:', err);
        });
        setSessionUploadedPaths((prev) => prev.filter((p) => p !== storagePath));
        sessionUploadedPathsRef.current = sessionUploadedPathsRef.current.filter((p) => p !== storagePath);
      }
    }
    setValue('cover_url', null, { shouldDirty: true, shouldValidate: true });
  };

  // Handler Upload Galeri Foto
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (galleryFields.length >= 10) {
      toast.error('Maksimal 10 gambar galeri yang dapat diunggah.');
      return;
    }

    if (file.size > MAX_BOOK_IMAGE_SIZE_BYTES) {
      toast.error('Ukuran berkas melebihi batas 5 MB.');
      return;
    }

    try {
      setIsUploadingGallery(true);
      const buffer = await file.arrayBuffer();
      const magicCheck = validateImageMagicBytes(new Uint8Array(buffer));
      if (!magicCheck.isValid) {
        toast.error('Format berkas tidak valid. Hanya berkas JPEG, PNG, atau WebP asli yang diizinkan.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadBookImageAction(formData, 'gallery');
      if (!res.ok) {
        toast.error(res.error.message || 'Gagal mengunggah gambar galeri.');
        return;
      }

      appendGallery({
        image_url: res.data.url,
        alt_text: `Foto detail ${watchedTitle || 'buku'}`,
        sort_order: galleryFields.length,
      });

      setSessionUploadedPaths((prev) => [...prev, res.data.path]);
      sessionUploadedPathsRef.current = [...sessionUploadedPathsRef.current, res.data.path];
      toast.success('Gambar galeri ditambahkan.');
    } catch (err) {
      console.error('[handleGalleryUpload] Error:', err);
      toast.error('Terjadi kesalahan saat mengunggah gambar galeri.');
    } finally {
      setIsUploadingGallery(false);
      e.target.value = '';
    }
  };

  // Handler Hapus Galeri dari Form sebelum disimpan
  const handleRemoveGallery = (index: number) => {
    const item = galleryFields[index];
    if (item?.image_url) {
      const storagePath = extractBooksStoragePath(item.image_url);
      if (storagePath && sessionUploadedPathsRef.current.includes(storagePath)) {
        cleanupUploadedFilesAction([storagePath]).catch((err) => {
          console.error('[handleRemoveGallery cleanup] Error:', err);
        });
        setSessionUploadedPaths((prev) => prev.filter((p) => p !== storagePath));
        sessionUploadedPathsRef.current = sessionUploadedPathsRef.current.filter((p) => p !== storagePath);
      }
    }
    removeGallery(index);
  };

  // Handler Pencarian Buku Terkait
  const handleSearchRelated = useCallback(
    async (query: string) => {
      try {
        setIsSearchingRelated(true);
        const res = await searchBooksForRelatedAction(query, initialData?.id);
        if (res.ok) {
          setRelatedSearchResults(res.data.items as BookRelatedOption[]);
        }
      } catch (err) {
        console.error('[handleSearchRelated] Error:', err);
      } finally {
        setIsSearchingRelated(false);
      }
    },
    [initialData?.id]
  );

  useEffect(() => {
    if (!relatedModalOpen) return;
    const timer = setTimeout(() => {
      handleSearchRelated(relatedSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [relatedSearchQuery, relatedModalOpen, handleSearchRelated]);

  // Tambahkan buku ke relasi
  const handleSelectRelatedBook = (book: BookRelatedOption) => {
    const currentIds = watchedRelatedIds || [];
    if (currentIds.length >= 5) {
      toast.error('Maksimal 5 buku terkait yang dapat dipilih.');
      return;
    }
    if (currentIds.includes(book.id)) return;

    setValue('related_book_ids', [...currentIds, book.id], { shouldDirty: true });
    setRelatedModalOpen(false);
    toast.success(`"${book.title}" ditambahkan ke buku terkait.`);
  };

  // Hapus buku dari relasi
  const handleRemoveRelatedBook = (bookId: string) => {
    const currentIds = watchedRelatedIds || [];
    setValue(
      'related_book_ids',
      currentIds.filter((id) => id !== bookId),
      { shouldDirty: true }
    );
  };

  // Handler Submit Form
  const onSubmit = async (data: BookFormValues) => {
    startTransition(async () => {
      try {
        const res = isEditing && initialData
          ? await updateBookAction(initialData.id, data)
          : await createBookAction(data);

        if (!res.ok) {
          // Tangani field errors spesifik dari Server Action
          if (res.error.code === 'CONFLICT' && res.error.fieldErrors?.slug) {
            setError('slug', {
              type: 'manual',
              message: res.error.fieldErrors.slug[0] || 'Slug sudah digunakan oleh buku lain.',
            });
            toast.error('Slug sudah digunakan. Silakan ubah slug buku.');
            return;
          }

          if (res.error.fieldErrors) {
            Object.entries(res.error.fieldErrors).forEach(([field, msgs]) => {
              setError(field as keyof BookFormInput, {
                type: 'manual',
                message: msgs[0],
              });
            });
          }

          toast.error(res.error.message || 'Gagal menyimpan buku.');
          return;
        }

        toast.success(
          isEditing
            ? `Buku "${data.title}" berhasil diperbarui.`
            : `Buku "${data.title}" berhasil ditambahkan ke katalog.`
        );

        // KOSONGKAN ref SEBELUM router.push agar unmount cleanup tidak menghapus berkas yang baru tersimpan!
        sessionUploadedPathsRef.current = [];
        setSessionUploadedPaths([]);
        router.push('/admin/books');
        router.refresh();
      } catch (err) {
        console.error('[BookForm onSubmit] Error:', err);
        toast.error('Terjadi kesalahan saat memproses data buku.');
      }
    });
  };

  // Handler Batal dengan pembersihan file sesi
  const handleCancel = async () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'Perubahan yang Anda buat belum disimpan. Yakin ingin membatalkan?'
      );
      if (!confirmLeave) return;
    }

    const pathsToClean = [...sessionUploadedPathsRef.current];
    // Kosongkan ref sebelum navigasi
    sessionUploadedPathsRef.current = [];
    setSessionUploadedPaths([]);

    if (pathsToClean.length > 0) {
      await cleanupUploadedFilesAction(pathsToClean).catch((err) => {
        console.error('[handleCancel cleanup] Error:', err);
      });
    }

    router.push('/admin/books');
  };

  // Hitung preview pesan WhatsApp
  const numRegular = Number(watchedPriceRegular) || 0;
  const numPromo = watchedPricePromo !== null && watchedPricePromo !== undefined ? Number(watchedPricePromo) : null;
  const effectivePrice = numPromo !== null && numPromo < numRegular ? numPromo : numRegular;

  const waResolvedUrl = buildWhatsAppUrl(
    watchedWaNumber,
    watchedWaTemplate,
    watchedTitle || 'Judul Buku',
    effectivePrice
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-6xl">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label="Kembali ke daftar buku"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isEditing ? `Edit Buku: ${initialData?.title}` : 'Tambah Buku Baru'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? 'Perbarui detail buku, unggah foto tambahan, atau sesuaikan harga dan channel checkout.'
                : 'Lengkapi metadata buku, sampul, sinopsis, dan konfigurasi checkout resmi.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Buku'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri & Tengah: Form Utama (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Dasar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Informasi Dasar Buku</CardTitle>
              <CardDescription className="text-xs">
                Judul, slug unik, kategori taksonomi, dan kepengarangan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  Judul Buku <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Contoh: Bumi Manusia"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                />
                {errors.title && (
                  <p id="title-error" className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-semibold">
                  Slug URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="bumi-manusia"
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={errors.slug ? 'slug-error' : undefined}
                />
                {errors.slug && (
                  <p id="slug-error" className="text-xs text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category_id" className="text-xs font-semibold">
                    Kategori Buku <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="category_id"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="category_id"
                          className="text-xs"
                          aria-invalid={Boolean(errors.category_id)}
                          aria-describedby={errors.category_id ? 'category_id-error' : undefined}
                        >
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category_id && (
                    <p id="category_id-error" className="text-xs text-destructive">{errors.category_id.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="publish_year" className="text-xs font-semibold">
                    Tahun Terbit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="publish_year"
                    type="number"
                    {...register('publish_year', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.publish_year)}
                    aria-describedby={errors.publish_year ? 'publish_year-error' : undefined}
                  />
                  {errors.publish_year && (
                    <p id="publish_year-error" className="text-xs text-destructive">{errors.publish_year.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="author" className="text-xs font-semibold">
                    Penulis <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="author"
                    {...register('author')}
                    placeholder="Nama penulis"
                    aria-invalid={Boolean(errors.author)}
                    aria-describedby={errors.author ? 'author-error' : undefined}
                  />
                  {errors.author && (
                    <p id="author-error" className="text-xs text-destructive">{errors.author.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editor" className="text-xs font-semibold">
                    Editor (Opsional)
                  </Label>
                  <Input
                    id="editor"
                    {...register('editor')}
                    placeholder="Nama editor"
                    aria-invalid={Boolean(errors.editor)}
                    aria-describedby={errors.editor ? 'editor-error' : undefined}
                  />
                  {errors.editor && (
                    <p id="editor-error" className="text-xs text-destructive">{errors.editor.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="publisher" className="text-xs font-semibold">
                    Penerbit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="publisher"
                    {...register('publisher')}
                    placeholder="Frasa Klausa Media"
                    aria-invalid={Boolean(errors.publisher)}
                    aria-describedby={errors.publisher ? 'publisher-error' : undefined}
                  />
                  {errors.publisher && (
                    <p id="publisher-error" className="text-xs text-destructive">{errors.publisher.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="isbn" className="text-xs font-semibold">
                    ISBN (ISBN-10 atau ISBN-13)
                  </Label>
                  <Input
                    id="isbn"
                    {...register('isbn')}
                    placeholder="978-602-0000-00-0"
                    aria-invalid={Boolean(errors.isbn)}
                    aria-describedby={errors.isbn ? 'isbn-error' : undefined}
                  />
                  {errors.isbn && (
                    <p id="isbn-error" className="text-xs text-destructive">{errors.isbn.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="page_count" className="text-xs font-semibold">
                    Jumlah Halaman <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="page_count"
                    type="number"
                    {...register('page_count', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.page_count)}
                    aria-describedby={errors.page_count ? 'page_count-error' : undefined}
                  />
                  {errors.page_count && (
                    <p id="page_count-error" className="text-xs text-destructive">{errors.page_count.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sinopsis & Deskripsi Tiptap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                <Label htmlFor="description" className="text-base font-semibold">
                  Sinopsis / Deskripsi Buku
                </Label>
              </CardTitle>
              <CardDescription id="description-hint" className="text-xs">
                Gunakan editor teks kaya untuk menyusun sinopsis buku dengan heading, kutipan, dan pemformatan semantik.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <div
                    id="description"
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? 'description-error' : 'description-hint'}
                  >
                    <LazyTiptapEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </div>
                )}
              />
              {errors.description && (
                <p id="description-error" className="text-xs text-destructive mt-1.5">{errors.description.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Galeri Foto Buku */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Galeri Foto Buku</CardTitle>
                <CardDescription className="text-xs">
                  Foto fisik buku, halaman dalam, atau detail cetakan (maksimal 10 gambar).
                </CardDescription>
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="gallery-file-input"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleGalleryUpload}
                  disabled={isUploadingGallery || galleryFields.length >= 10 || isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isUploadingGallery || galleryFields.length >= 10 || isPending}
                  className="cursor-pointer gap-1.5 text-xs"
                >
                  <label htmlFor="gallery-file-input">
                    {isUploadingGallery ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    <span>Tambah Foto</span>
                  </label>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {galleryFields.length === 0 ? (
                <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground text-xs">
                  Belum ada foto galeri. Klik &quot;Tambah Foto&quot; untuk mengunggah gambar pendukung.
                </div>
              ) : (
                <div className="space-y-3">
                  {galleryFields.map((fieldItem, idx) => (
                    <div
                      key={fieldItem.id}
                      className="flex items-center gap-3 border rounded-md p-2 bg-muted/20"
                    >
                      <div className="relative h-14 w-12 shrink-0 rounded overflow-hidden border bg-muted">
                        <Image
                          src={fieldItem.image_url}
                          alt={fieldItem.alt_text || 'Galeri buku'}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`gallery-alt-${idx}`} className="text-[11px] text-muted-foreground">
                          Alt Text (Aksesibilitas & SEO) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`gallery-alt-${idx}`}
                          {...register(`gallery.${idx}.alt_text` as const)}
                          placeholder="Deskripsi foto buku..."
                          className="h-8 text-xs"
                          aria-invalid={Boolean(errors.gallery?.[idx]?.alt_text)}
                          aria-describedby={errors.gallery?.[idx]?.alt_text ? `gallery-alt-${idx}-error` : undefined}
                        />
                        {errors.gallery?.[idx]?.alt_text && (
                          <p id={`gallery-alt-${idx}-error`} className="text-[10px] text-destructive">
                            {errors.gallery[idx]?.alt_text?.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveGallery(idx, idx - 1)}
                            title="Pindah ke atas"
                          >
                            ↑
                          </Button>
                        )}
                        {idx < galleryFields.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveGallery(idx, idx + 1)}
                            title="Pindah ke bawah"
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveGallery(idx)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Hapus foto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buku Terkait (Related Books Manual Picker) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Buku Terkait (Rekomendasi)</CardTitle>
                <CardDescription className="text-xs">
                  Pilih maksimal 5 buku terkait secara manual. Jika dikosongkan, sistem publik akan otomatis menampilkan buku dari kategori yang sama.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRelatedModalOpen(true)}
                disabled={(watchedRelatedIds || []).length >= 5 || isPending}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Pilih Buku</span>
              </Button>
            </CardHeader>
            <CardContent>
              {(watchedRelatedIds || []).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Belum ada buku terkait manual yang dipilih (Fallback otomatis kategori aktif).
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(watchedRelatedIds || []).map((id) => (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs flex items-center gap-1.5"
                    >
                      <span>Buku Terkait: {id.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRelatedBook(id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pengaturan Sampul, Harga, Channel Checkout & Preview */}
        <div className="space-y-6">
          {/* Sampul Buku */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Sampul Buku</CardTitle>
              <CardDescription className="text-xs">
                Format JPEG, PNG, atau WebP (maks 5 MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                {watchedCoverUrl ? (
                  <Image
                    src={watchedCoverUrl}
                    alt="Pratinjau Sampul Buku"
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                    <BookOpen className="h-8 w-8 stroke-[1.5]" />
                    <span className="text-xs">Belum ada sampul</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                <input
                  type="file"
                  id="cover-file-input"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={isUploadingCover || isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isUploadingCover || isPending}
                  className="cursor-pointer gap-1.5 text-xs"
                >
                  <label htmlFor="cover-file-input">
                    {isUploadingCover ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>{watchedCoverUrl ? 'Ganti Sampul' : 'Unggah Sampul'}</span>
                  </label>
                </Button>

                {watchedCoverUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCover}
                    className="text-destructive hover:text-destructive h-8 px-2 text-xs"
                  >
                    Hapus
                  </Button>
                )}
              </div>
              {errors.cover_url && (
                <p id="cover_url-error" className="text-xs text-destructive text-center">{errors.cover_url.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Penetapan Harga */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Harga Buku</CardTitle>
              <CardDescription className="text-xs">
                Harga normal dan harga promo diskon (Rupiah).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="price_regular" className="text-xs font-semibold">
                  Harga Normal (IDR) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price_regular"
                  type="number"
                  {...register('price_regular', { valueAsNumber: true })}
                  placeholder="85000"
                  aria-invalid={Boolean(errors.price_regular)}
                  aria-describedby={errors.price_regular ? 'price_regular-error' : undefined}
                />
                {errors.price_regular && (
                  <p id="price_regular-error" className="text-xs text-destructive">{errors.price_regular.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price_promo" className="text-xs font-semibold">
                  Harga Promo (Opsional)
                </Label>
                <Input
                  id="price_promo"
                  type="number"
                  {...register('price_promo', {
                    setValueAs: (v) => (v === '' ? null : Number(v)),
                  })}
                  placeholder="Kosongkan jika tanpa promo"
                  aria-invalid={Boolean(errors.price_promo)}
                  aria-describedby={errors.price_promo ? 'price_promo-error' : undefined}
                />
                {errors.price_promo && (
                  <p id="price_promo-error" className="text-xs text-destructive">{errors.price_promo.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Konfigurasi Multi-Channel Checkout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tautan Checkout</CardTitle>
              <CardDescription className="text-xs">
                WhatsApp, Shopee, dan Tokopedia (PRD §7 & §10.4).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp_number" className="text-xs font-semibold">
                  Nomor WhatsApp CS
                </Label>
                <Input
                  id="whatsapp_number"
                  {...register('whatsapp_number')}
                  placeholder="081380604256"
                  aria-invalid={Boolean(errors.whatsapp_number)}
                  aria-describedby={errors.whatsapp_number ? 'whatsapp_number-error' : 'whatsapp_number-hint'}
                />
                <p id="whatsapp_number-hint" className="text-[11px] text-muted-foreground">
                  Otomatis dinormalisasi ke format internasional (628...).
                </p>
                {errors.whatsapp_number && (
                  <p id="whatsapp_number-error" className="text-xs text-destructive">{errors.whatsapp_number.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp_message_template" className="text-xs font-semibold">
                  Template Pesan WhatsApp
                </Label>
                <Textarea
                  id="whatsapp_message_template"
                  rows={3}
                  {...register('whatsapp_message_template')}
                  placeholder="Halo, saya ingin memesan buku {judul} seharga {harga}..."
                  className="text-xs"
                  aria-invalid={Boolean(errors.whatsapp_message_template)}
                  aria-describedby={errors.whatsapp_message_template ? 'whatsapp_message_template-error' : 'whatsapp_message_template-hint'}
                />
                <p id="whatsapp_message_template-hint" className="text-[10px] text-muted-foreground">
                  Gunakan placeholder <code>{'{judul}'}</code> dan <code>{'{harga}'}</code>.
                </p>
                {errors.whatsapp_message_template && (
                  <p id="whatsapp_message_template-error" className="text-xs text-destructive">{errors.whatsapp_message_template.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shopee_url" className="text-xs font-semibold">
                  Tautan Toko Shopee (Opsional)
                </Label>
                <Input
                  id="shopee_url"
                  {...register('shopee_url')}
                  placeholder="https://shopee.co.id/frasaklausa/..."
                  aria-invalid={Boolean(errors.shopee_url)}
                  aria-describedby={errors.shopee_url ? 'shopee_url-error' : undefined}
                />
                {errors.shopee_url && (
                  <p id="shopee_url-error" className="text-xs text-destructive">{errors.shopee_url.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tokopedia_url" className="text-xs font-semibold">
                  Tautan Tokopedia (Opsional)
                </Label>
                <Input
                  id="tokopedia_url"
                  {...register('tokopedia_url')}
                  placeholder="https://tokopedia.com/frasaklausa/..."
                  aria-invalid={Boolean(errors.tokopedia_url)}
                  aria-describedby={errors.tokopedia_url ? 'tokopedia_url-error' : undefined}
                />
                {errors.tokopedia_url && (
                  <p id="tokopedia_url-error" className="text-xs text-destructive">{errors.tokopedia_url.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pratinjau Langsung Tombol Checkout Publik (PRD §10.4) */}
          <Card className="border-primary/20 bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pratinjau Tombol Checkout Publik
              </CardTitle>
              <CardDescription className="text-[11px]">
                Tombol Shopee & Tokopedia otomatis disembunyikan jika URL dikosongkan untuk mencegah dead-clicks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* WhatsApp Checkout Button (Selalu Ada) */}
              <a
                href={waResolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Pesan via WhatsApp</span>
              </a>

              {/* Shopee Button (Hanya tampil jika ada URL) */}
              {watchedShopeeUrl ? (
                <a
                  href={watchedShopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white p-2.5 text-xs font-semibold transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Beli di Shopee</span>
                </a>
              ) : (
                <div className="border border-dashed rounded p-2 text-center text-[10px] text-muted-foreground">
                  (Tombol Shopee tersembunyi karena link kosong)
                </div>
              )}

              {/* Tokopedia Button (Hanya tampil jika ada URL) */}
              {watchedTokopediaUrl ? (
                <a
                  href={watchedTokopediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 text-xs font-semibold transition-colors"
                >
                  <Store className="h-4 w-4" />
                  <span>Beli di Tokopedia</span>
                </a>
              ) : (
                <div className="border border-dashed rounded p-2 text-center text-[10px] text-muted-foreground">
                  (Tombol Tokopedia tersembunyi karena link kosong)
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pengaturan Publikasi & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Status Katalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_published" className="text-xs font-semibold">
                    Publikasikan ke Website
                  </Label>
                  <p id="is_published-hint" className="text-[11px] text-muted-foreground">
                    Buku akan tampil di katalog publik Frasa Klausa Media.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="is_published"
                  render={({ field }) => (
                    <Switch
                      id="is_published"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-describedby="is_published-hint"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_featured" className="text-xs font-semibold">
                    Buku Pilihan / Unggulan
                  </Label>
                  <p id="is_featured-hint" className="text-[11px] text-muted-foreground">
                    Sorot buku di carousel beranda utama.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="is_featured"
                  render={({ field }) => (
                    <Switch
                      id="is_featured"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-describedby="is_featured-hint"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Dialog Pemilih Buku Terkait */}
      <Dialog open={relatedModalOpen} onOpenChange={setRelatedModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Pilih Buku Terkait</DialogTitle>
            <DialogDescription className="text-xs">
              Cari dan tautkan rekomendasi buku yang relevan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="related-search-input"
                aria-label="Cari buku terkait berdasarkan judul atau penulis"
                placeholder="Ketik judul atau penulis..."
                value={relatedSearchQuery}
                onChange={(e) => setRelatedSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y border rounded-md">
              {isSearchingRelated ? (
                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mencari buku...</span>
                </div>
              ) : relatedSearchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Tidak ada buku ditemukan.
                </div>
              ) : (
                relatedSearchResults.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 text-xs"
                  >
                    <div>
                      <p className="font-medium text-foreground">{b.title}</p>
                      <p className="text-[11px] text-muted-foreground">{b.author}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleSelectRelatedBook(b)}
                      disabled={(watchedRelatedIds || []).includes(b.id)}
                    >
                      {(watchedRelatedIds || []).includes(b.id) ? 'Terpilih' : 'Pilih'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
export default BookForm;
