'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteBlogCategoryAction } from '@/actions/blog-category';
import type { BlogCategoryItem } from '@/lib/blog-categories/types';

interface BlogCategoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BlogCategoryItem | null;
  onSuccess?: () => void;
}

export function BlogCategoryDeleteDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: BlogCategoryDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!category) return null;

  const hasAssociatedPosts = category.post_count > 0;

  const handleDelete = async () => {
    if (hasAssociatedPosts) return;

    try {
      setIsDeleting(true);
      const res = await deleteBlogCategoryAction(category.id);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      toast.success(`Kategori "${category.name}" berhasil dihapus.`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('[BlogCategoryDeleteDialog] Delete error:', error);
      toast.error('Gagal menghapus kategori blog.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {hasAssociatedPosts ? (
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <AlertDialogTitle>
              {hasAssociatedPosts ? 'Kategori Terproteksi' : 'Hapus Kategori Blog'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 text-sm">
            {hasAssociatedPosts ? (
              <span className="block space-y-2">
                <span>
                  Kategori <strong className="text-foreground">&quot;{category.name}&quot;</strong> tidak dapat dihapus karena saat ini masih digunakan oleh{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {category.post_count} artikel blog
                  </strong>.
                </span>
                <span className="block text-xs text-muted-foreground bg-muted p-2.5 rounded-md border">
                  Sesuai integritas data dan kebijakan sistem (PRD §6.2.F), Anda harus memindahkan atau menghapus artikel-artikel tersebut terlebih dahulu sebelum kategori ini dapat dihapus.
                </span>
              </span>
            ) : (
              <span>
                Apakah Anda yakin ingin menghapus kategori{' '}
                <strong className="text-foreground">&quot;{category.name}&quot;</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting}>
            {hasAssociatedPosts ? 'Tutup' : 'Batal'}
          </AlertDialogCancel>
          {!hasAssociatedPosts && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus Kategori'
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
