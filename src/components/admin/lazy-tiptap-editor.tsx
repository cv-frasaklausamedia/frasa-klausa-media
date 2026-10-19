'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { TiptapEditorProps } from './tiptap-editor';

export type LazyTiptapEditorProps = TiptapEditorProps;

/**
 * Lazy-loaded Tiptap Editor.
 * Menghindari pemuatan bundle Tiptap yang berat pada initial page load
 * dan hanya diimpor saat halaman formulir dibuka di client.
 */
export const LazyTiptapEditor = dynamic<LazyTiptapEditorProps>(
  () => import('./tiptap-editor').then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2 rounded-md border border-input p-3">
        <div className="flex gap-1 border-b pb-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded ml-auto" />
        </div>
        <Skeleton className="h-28 w-full rounded" />
      </div>
    ),
  }
);
