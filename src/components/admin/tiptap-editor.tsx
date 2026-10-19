'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
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
  Undo,
  Redo,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TiptapEditor({
  value,
  onChange,
  disabled = false,
}: TiptapEditorProps) {
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

    // Hanya izinkan skema aman
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      toast.error('Tautan hanya boleh diawali dengan https:// atau mailto:');
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Toolbar Tiptap (Heading 2-4, Bold, Italic, Strike, Lists, Quote, Code, Link, Undo/Redo) */}
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
