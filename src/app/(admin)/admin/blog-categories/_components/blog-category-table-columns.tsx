'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BlogCategoryItem } from '@/lib/blog-categories/types';

interface ColumnActionsProps {
  category: BlogCategoryItem;
  onEdit: (category: BlogCategoryItem) => void;
  onDelete: (category: BlogCategoryItem) => void;
}

function ColumnActions({ category, onEdit, onDelete }: ColumnActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          aria-label={`Aksi untuk kategori ${category.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => onEdit(category)}
          className="cursor-pointer flex items-center gap-2"
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
          <span>Edit Kategori</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(category)}
          className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span>Hapus Kategori</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderSortIcon(field: string, currentSort: string) {
  if (currentSort === `${field}_asc`) {
    return <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />;
  }
  if (currentSort === `${field}_desc`) {
    return <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />;
  }
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-60" />;
}

export function getBlogCategoryColumns({
  onEdit,
  onDelete,
  onSort,
  currentSort,
}: {
  onEdit: (category: BlogCategoryItem) => void;
  onDelete: (category: BlogCategoryItem) => void;
  onSort: (field: string) => void;
  currentSort: string;
}): ColumnDef<BlogCategoryItem>[] {
  return [
    {
      accessorKey: 'name',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold"
          onClick={() => onSort('name')}
        >
          <span>Nama Kategori</span>
          {renderSortIcon('name', currentSort)}
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground text-sm">{item.name}</span>
            {item.description ? (
              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                {item.description}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => {
        return (
          <Badge
            variant="outline"
            className="font-mono text-[11px] font-normal text-muted-foreground bg-muted/30"
          >
            {row.original.slug}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'post_count',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold"
          onClick={() => onSort('posts')}
        >
          <span>Jumlah Artikel</span>
          {renderSortIcon('posts', currentSort)}
        </Button>
      ),
      cell: ({ row }) => {
        const count = row.original.post_count;
        return (
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span
              className={`text-xs font-medium ${
                count > 0 ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {count} Artikel
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold"
          onClick={() => onSort('created_at')}
        >
          <span>Tanggal Dibuat</span>
          {renderSortIcon('created_at', currentSort)}
        </Button>
      ),
      cell: ({ row }) => {
        const dateStr = row.original.created_at;
        try {
          const formatted = format(new Date(dateStr), 'd MMM yyyy, HH:mm', {
            locale: id,
          });
          return <span className="text-xs text-muted-foreground">{formatted}</span>;
        } catch {
          return <span className="text-xs text-muted-foreground">{dateStr}</span>;
        }
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ColumnActions
            category={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  ];
}
