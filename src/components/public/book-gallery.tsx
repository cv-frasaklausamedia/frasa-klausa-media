'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BookGalleryItem } from '@/lib/books/types';

interface BookGalleryProps {
  coverUrl: string | null;
  title: string;
  gallery: BookGalleryItem[];
}

export function BookGallery({ coverUrl, title, gallery }: BookGalleryProps) {
  // Susun seluruh daftar gambar: cover utama sebagai gambar pertama jika ada
  const allImages = React.useMemo(() => {
    const list: { id: string; url: string; alt: string }[] = [];
    if (coverUrl) {
      list.push({
        id: 'cover',
        url: coverUrl,
        alt: `Sampul utama ${title}`,
      });
    }
    gallery.forEach((g, index) => {
      // Hindari duplikasi jika URL cover sama dengan gambar di galeri
      if (g.image_url !== coverUrl) {
        list.push({
          id: g.id || `gallery-${index}`,
          url: g.image_url,
          alt: g.alt_text || `Gambar galeri ${index + 1} untuk ${title}`,
        });
      }
    });
    return list;
  }, [coverUrl, gallery, title]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  const currentImage = allImages[activeIndex] ?? allImages[0];

  const handlePrev = React.useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  }, [allImages.length]);

  const handleNext = React.useCallback(() => {
    setActiveIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  }, [allImages.length]);

  // Navigasi Keyboard (Panah Kiri & Panah Kanan)
  React.useEffect(() => {
    if (allImages.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allImages.length, handlePrev, handleNext]);

  if (allImages.length === 0) {
    return (
      <div className="flex w-full aspect-[3/4] flex-col items-center justify-center rounded-2xl border bg-muted/40 p-8 text-center text-muted-foreground">
        <BookOpen className="h-16 w-16 mb-4 stroke-1" />
        <p className="font-serif italic text-sm">Tidak ada gambar pratinjau tersedia</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Gambar Utama (Aspect Ratio 3/4) */}
      <div className="group relative w-full aspect-[3/4] overflow-hidden rounded-2xl border bg-muted/30 shadow-xs">
        {currentImage ? (
          <Image
            src={currentImage.url}
            alt={currentImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 40vw"
            priority
            className="object-cover transition-transform duration-300 group-hover:scale-102"
          />
        ) : null}

        {/* Indikator Angka Gambar */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-xs shadow-xs">
            {activeIndex + 1} / {allImages.length}
          </div>
        )}

        {/* Tombol Panah Navigasi Gambar */}
        {allImages.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handlePrev}
              aria-label="Gambar sebelumnya"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full opacity-80 backdrop-blur-xs hover:opacity-100 shadow-sm transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleNext}
              aria-label="Gambar selanjutnya"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full opacity-80 backdrop-blur-xs hover:opacity-100 shadow-sm transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Baris Thumbnail Galeri */}
      {allImages.length > 1 && (
        <div
          role="tablist"
          aria-label="Thumbnail galeri buku"
          className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none"
        >
          {allImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={img.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Pilih gambar ${idx + 1} dari ${allImages.length}`}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted/40 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'border-primary ring-2 ring-primary/20 scale-102'
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
