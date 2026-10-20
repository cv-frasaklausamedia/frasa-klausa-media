'use client';

import * as React from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);

  // Gunakan useSyncExternalStore untuk URL browser tanpa efek cascading setState
  const browserUrl = React.useSyncExternalStore(
    () => () => {},
    () => (typeof window !== 'undefined' ? window.location.href : ''),
    () => ''
  );
  const fullUrl = url || browserUrl;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        toast.success('Tautan artikel berhasil disalin ke papan klip!');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Gagal menyalin tautan:', err);
      toast.error('Gagal menyalin tautan.');
    }
  };

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(fullUrl);

  const waUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1.5">
        <Share2 className="h-3.5 w-3.5" /> Bagikan:
      </span>

      {/* Salin Tautan */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="h-8 gap-1.5 text-xs px-2.5"
        title="Salin Tautan"
        aria-label="Salin Tautan"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tersalin</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Salin Tautan</span>
          </>
        )}
      </Button>

      {/* WhatsApp */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs px-2.5 hover:text-emerald-600 hover:border-emerald-500/40"
      >
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Bagikan ke WhatsApp"
          aria-label="Bagikan ke WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span>WhatsApp</span>
        </a>
      </Button>

      {/* X / Twitter */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs px-2.5 hover:text-foreground"
      >
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Bagikan ke X"
          aria-label="Bagikan ke X (Twitter)"
        >
          <span className="font-bold text-xs">𝕏</span>
          <span>Post</span>
        </a>
      </Button>

      {/* Facebook */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs px-2.5 hover:text-blue-600 hover:border-blue-500/40"
      >
        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Bagikan ke Facebook"
          aria-label="Bagikan ke Facebook"
        >
          <span className="font-bold text-xs text-blue-600">f</span>
          <span>Facebook</span>
        </a>
      </Button>
    </div>
  );
}
