'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DatePickerProps {
  id?: string;
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export function DatePicker({
  id,
  date,
  onDateChange,
  placeholder = 'Pilih tanggal',
  disabled = false,
  className,
  error = false,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal text-xs sm:text-sm h-9',
            !date && 'text-muted-foreground',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {date ? (
            format(date, 'PPP', { locale: localeId })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 border-border bg-popover shadow-md" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            onDateChange?.(selected);
            setOpen(false);
          }}
          disabled={
            fromDate || toDate
              ? (day) => {
                  if (fromDate && day < fromDate) return true;
                  if (toDate && day > toDate) return true;
                  return false;
                }
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
}
