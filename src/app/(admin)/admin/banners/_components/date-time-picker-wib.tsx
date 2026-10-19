'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  combineWibToUtc,
  splitUtcToWib,
} from '@/validations/banner';

interface DateTimePickerWibProps {
  id?: string;
  label?: string;
  value: string; // ISO UTC string
  onChange: (utcIso: string) => void;
  disabled?: boolean;
  error?: string;
}

export function DateTimePickerWib({
  id,
  label,
  value,
  onChange,
  disabled = false,
  error,
}: DateTimePickerWibProps) {
  const [open, setOpen] = React.useState(false);

  // Parse nilai UTC ke representasi WIB lokal
  const { date, timeString } = React.useMemo(() => {
    try {
      if (!value) {
        const now = new Date();
        return {
          date: now,
          timeString: '09:00',
        };
      }
      return splitUtcToWib(value);
    } catch {
      const now = new Date();
      return {
        date: now,
        timeString: '09:00',
      };
    }
  }, [value]);

  const selectedDate = date;
  const currentTime = timeString;

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    const updatedUtc = combineWibToUtc(newDate, currentTime);
    onChange(updatedUtc);
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d{2}:\d{2}$/.test(val)) {
      const updatedUtc = combineWibToUtc(selectedDate, val);
      onChange(updatedUtc);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          {label} <span className="text-muted-foreground font-normal">(WIB)</span>
        </Label>
      )}

      <div className="flex items-center gap-2">
        {/* Date Popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal text-xs sm:text-sm h-9',
                !value && 'text-muted-foreground',
                error && 'border-destructive'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              {selectedDate ? (
                format(selectedDate, 'PPP', { locale: localeId })
              ) : (
                <span>Pilih tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>

        {/* Time Input in WIB */}
        <div className="relative w-28 shrink-0">
          <Input
            type="time"
            value={currentTime}
            onChange={handleTimeChange}
            disabled={disabled}
            className={cn('h-9 text-xs sm:text-sm font-mono pr-2', error && 'border-destructive')}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
