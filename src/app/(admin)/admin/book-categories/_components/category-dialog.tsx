'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  categoryFormSchema,
  generateSlug,
  type CategoryFormInput,
} from '@/validations/category';
import { createCategoryAction, updateCategoryAction } from '@/actions/category';
import type { BookCategoryItem } from '@/lib/categories/types';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit: BookCategoryItem | null;
  onSuccess?: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  categoryToEdit,
  onSuccess,
}: CategoryDialogProps) {
  const isEditing = Boolean(categoryToEdit);
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      seo_title: '',
      seo_description: '',
    },
    mode: 'onTouched',
  });

  const {
    watch,
    setValue,
    reset,
    setError,
    formState: { isSubmitting },
  } = form;

  const currentName = watch('name');
  const currentSeoTitle = watch('seo_title') ?? '';
  const currentSeoDesc = watch('seo_description') ?? '';

  // Isi form jika sedang mode Edit, atau reset jika Tambah Baru
  useEffect(() => {
    if (open) {
      if (categoryToEdit) {
        reset({
          name: categoryToEdit.name,
          slug: categoryToEdit.slug,
          description: categoryToEdit.description ?? '',
          seo_title: categoryToEdit.seo_title ?? '',
          seo_description: categoryToEdit.seo_description ?? '',
        });
        setAutoSlug(false);
      } else {
        reset({
          name: '',
          slug: '',
          description: '',
          seo_title: '',
          seo_description: '',
        });
        setAutoSlug(true);
      }
    }
  }, [open, categoryToEdit, reset]);

  // Handle otomatisasi slug saat nama diubah
  useEffect(() => {
    if (autoSlug && currentName) {
      const generated = generateSlug(currentName);
      setValue('slug', generated, { shouldValidate: true });
    }
  }, [currentName, autoSlug, setValue]);

  const onSubmit = async (values: CategoryFormInput) => {
    try {
      if (isEditing && categoryToEdit) {
        const res = await updateCategoryAction(categoryToEdit.id, values);
        if (!res.ok) {
          if (res.error.fieldErrors) {
            Object.entries(res.error.fieldErrors).forEach(([field, messages]) => {
              setError(field as keyof CategoryFormInput, {
                type: 'server',
                message: messages[0],
              });
            });
          }
          toast.error(res.error.message);
          return;
        }
        toast.success(`Kategori "${values.name}" berhasil diperbarui.`);
      } else {
        const res = await createCategoryAction(values);
        if (!res.ok) {
          if (res.error.fieldErrors) {
            Object.entries(res.error.fieldErrors).forEach(([field, messages]) => {
              setError(field as keyof CategoryFormInput, {
                type: 'server',
                message: messages[0],
              });
            });
          }
          toast.error(res.error.message);
          return;
        }
        toast.success(`Kategori "${values.name}" berhasil ditambahkan.`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('[CategoryDialog] Submit error:', error);
      toast.error('Terjadi kesalahan pada sistem saat menyimpan data.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Kategori Buku' : 'Tambah Kategori Buku'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui rincian kategori buku di bawah ini. Pastikan slug tetap ramah SEO.'
              : 'Tambahkan kategori baru untuk mengelompokkan katalog buku Frasa Klausa Media.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Field Nama Kategori */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama Kategori <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Sastra Klasik, Antologi Puisi"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Slug & Switch Auto-generate */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      Slug URL <span className="text-destructive">*</span>
                    </FormLabel>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-slug-toggle"
                        checked={autoSlug}
                        onCheckedChange={setAutoSlug}
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor="auto-slug-toggle"
                        className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" /> Auto Slug
                      </Label>
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="sastra-klasik"
                      disabled={isSubmitting || autoSlug}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Struktur URL kategori: <code>/kategori/{field.value || 'slug-kategori'}</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Deskripsi */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Penjelasan singkat mengenai kategori buku ini..."
                      rows={3}
                      disabled={isSubmitting}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bagian Meta SEO */}
            <div className="border-t pt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pengaturan SEO
              </div>

              <FormField
                control={form.control}
                name="seo_title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Meta Title</FormLabel>
                      <span
                        className={`text-[11px] ${
                          currentSeoTitle.length > 70
                            ? 'text-destructive font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {currentSeoTitle.length} / 70
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Judul SEO untuk mesin pencari..."
                        disabled={isSubmitting}
                        className="h-8 text-xs"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seo_description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Meta Description</FormLabel>
                      <span
                        className={`text-[11px] ${
                          currentSeoDesc.length > 160
                            ? 'text-destructive font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {currentSeoDesc.length} / 160
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi cuplikan ringkas untuk Google..."
                        rows={2}
                        disabled={isSubmitting}
                        className="text-xs"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  'Perbarui Kategori'
                ) : (
                  'Simpan Kategori'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
