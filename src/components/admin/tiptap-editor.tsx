'use client';

import { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Loader2,
  Undo,
  Redo,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowImages?: boolean;
  onImageUpload?: (file: File) => Promise<{ url: string; path?: string }>;
  onImageInserted?: (path: string) => void;
}

export function TiptapEditor({
  value,
  onChange,
  disabled = false,
  allowImages = false,
  onImageUpload,
  onImageInserted,
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-primary underline underline-offset-4 font-medium',
        },
      }),
      ...(allowImages
        ? [
            Image.configure({
              inline: false,
              allowBase64: false,
              HTMLAttributes: {
                class: 'rounded-lg max-w-full h-auto my-4 shadow-sm border border-border/40',
                loading: 'lazy',
              },
            }),
          ]
        : []),
    ],
    content: value || '',
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      // Jika hanya menyisakan tag paragraf kosong (<p></p>), kirimkan string kosong
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[160px] p-3 text-sm'
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan tautan URL (contoh: https://example.com):', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Hanya izinkan skema aman http, https, mailto (PRD §15.5)
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      toast.error('Tautan hanya boleh diawali dengan https://, http:// atau mailto:');
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
      })
      .run();
  };

  const handleImageButtonClick = () => {
    if (onImageUpload) {
      fileInputRef.current?.click();
    } else {
      const url = window.prompt('Masukkan URL gambar (https://...):');
      if (url && /^https?:\/\//i.test(url)) {
        const alt = window.prompt('Teks alternatif gambar (opsional):') || '';
        editor.chain().focus().setImage({ src: url, alt }).run();
      } else if (url) {
        toast.error('URL gambar harus menggunakan protokol http:// atau https://');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar file yang sama bisa dipilih lagi jika diperlukan
    e.target.value = '';

    // Validasi tipe berkas klien
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format gambar tidak didukung. Harap pilih JPEG, PNG, atau WebP.');
      return;
    }

    // Validasi ukuran berkas klien (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar melebihi batas maksimal 5 MB.');
      return;
    }

    if (!onImageUpload) return;

    try {
      setIsUploadingImage(true);
      const result = await onImageUpload(file);
      if (result && result.url) {
        const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        editor
          .chain()
          .focus()
          .setImage({ src: result.url, alt: altText })
          .run();

        if (result.path && onImageInserted) {
          onImageInserted(result.path);
        }
        toast.success('Gambar berhasil diunggah dan disisipkan.');
      }
    } catch (err) {
      console.error('[TiptapEditor] Gagal mengunggah gambar inline:', err);
      toast.error('Gagal mengunggah gambar. Silakan coba kembali.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Hidden input untuk pemilihan berkas gambar inline */}
      {allowImages && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploadingImage}
        />
      )}

      {/* Toolbar Tiptap (Heading 2-4, Bold, Italic, Strike, Lists, Quote, Code, Link, Image, Undo/Redo) */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="Tebal (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="Miring (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('strike') && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          title="Coret"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 2 }) && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          title="Judul 2 (H2)"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 3 }) && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          title="Judul 3 (H3)"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 4 }) && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          disabled={disabled}
          title="Judul 4 (H4)"
        >
          <Heading4 className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="Daftar Poin"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title="Daftar Bernomor"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('blockquote') && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          title="Kutipan"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('code') && 'bg-muted text-primary')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={disabled}
          title="Kode Inline"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-muted text-primary')}
          onClick={setLink}
          disabled={disabled}
          title="Sisipkan Tautan"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {editor.isActive('link') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={disabled}
            title="Hapus Tautan"
          >
            <Unlink className="h-4 w-4 text-destructive" />
          </Button>
        )}

        {allowImages && (
          <>
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleImageButtonClick}
              disabled={disabled || isUploadingImage}
              title="Sisipkan Gambar Inline"
            >
              {isUploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 ml-auto"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          title="Urungkan (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          title="Ulangi (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
export default TiptapEditor;
