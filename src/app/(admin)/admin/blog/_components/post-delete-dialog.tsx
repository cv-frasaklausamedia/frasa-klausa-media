'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
import { deletePostAction } from '@/actions/post';
import type { PostListItem } from '@/lib/posts/types';

interface PostDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostListItem | null;
}

export function PostDeleteDialog({
  open,
  onOpenChange,
  post,
}: PostDeleteDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!post) return null;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await deletePostAction(post.id);

        if (response.ok) {
          toast.success(`Artikel "${post.title}" berhasil dihapus.`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(response.error.message || 'Gagal menghapus artikel.');
        }
      } catch (err) {
        console.error('[PostDeleteDialog] Error:', err);
        toast.error('Terjadi kesalahan saat menghapus artikel.');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Hapus Artikel Blog</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
            <p>
              Apakah Anda yakin ingin menghapus artikel{' '}
              <strong className="text-foreground font-semibold">
                &ldquo;{post.title}&rdquo;
              </strong>
              ?
            </p>
            <p className="text-xs bg-muted/60 p-2 rounded text-muted-foreground border border-border/40">
              Tindakan ini permanen. Seluruh konten artikel beserta berkas gambar cover
              dan gambar inline terkait yang tersimpan di storage akan dihapus.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Hapus Permanen</span>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
