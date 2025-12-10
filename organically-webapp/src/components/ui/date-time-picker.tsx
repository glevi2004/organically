"use client";

import * as React from "react";
import { format, isBefore, startOfDay, addMinutes } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Minimum minutes from now that the datetime must be (default: 5) */
  minMinutesFromNow?: number;
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Pick a date & time",
  className,
  minMinutesFromNow = 5,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Get time string from date
  const getTimeString = (date: Date | undefined): string => {
    if (!date) return "12:00";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [time, setTime] = React.useState<string>(getTimeString(value));

  // Update time when value changes externally
  React.useEffect(() => {
    if (value) {
      setTime(getTimeString(value));
    }
  }, [value]);

  // Check if a date is disabled (before today)
  const isDateDisabled = React.useCallback((date: Date) => {
    const today = startOfDay(new Date());
    return isBefore(date, today);
  }, []);

  // Get minimum allowed datetime
  const getMinDateTime = React.useCallback(() => {
    return addMinutes(new Date(), minMinutesFromNow);
  }, [minMinutesFromNow]);

  // Handle date selection from calendar
  const handleDateSelect = React.useCallback(
    (selectedDate: Date | undefined) => {
      if (!selectedDate) {
        onChange?.(undefined);
        return;
      }

      // Apply current time to the selected date
      const [hours, minutes] = time.split(":");
      const newDate = new Date(selectedDate);
      newDate.setHours(
        Number.parseInt(hours, 10),
        Number.parseInt(minutes, 10),
        0,
        0
      );

      // If resulting datetime is in the past, adjust time to minimum
      const minDateTime = getMinDateTime();
      if (isBefore(newDate, minDateTime)) {
        const minHours = minDateTime.getHours().toString().padStart(2, "0");
        const minMinutes = (Math.ceil(minDateTime.getMinutes() / 5) * 5)
          .toString()
          .padStart(2, "0");
        const adjustedTime = `${minHours}:${minMinutes}`;
        setTime(adjustedTime);
        newDate.setHours(
          Number.parseInt(minHours, 10),
          Number.parseInt(minMinutes, 10),
          0,
          0
        );
      }

      onChange?.(newDate);
    },
    [time, onChange, getMinDateTime]
  );

  // Handle time change
  const handleTimeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value;

      if (value) {
        const [hours, minutes] = newTime.split(":");
        const newDate = new Date(value);
        newDate.setHours(
          Number.parseInt(hours, 10),
          Number.parseInt(minutes, 10),
          0,
          0
        );

        // Validate: don't allow times in the past
        const minDateTime = getMinDateTime();
        if (isBefore(newDate, minDateTime)) {
          // Adjust to minimum allowed time
          const minHours = minDateTime.getHours().toString().padStart(2, "0");
          const minMinutes = (Math.ceil(minDateTime.getMinutes() / 5) * 5)
            .toString()
            .padStart(2, "0");
          const adjustedTime = `${minHours}:${minMinutes}`;
          setTime(adjustedTime);
          newDate.setHours(
            Number.parseInt(minHours, 10),
            Number.parseInt(minMinutes, 10),
            0,
            0
          );
        } else {
          setTime(newTime);
        }

        onChange?.(newDate);
      } else {
        setTime(newTime);
      }
    },
    [value, onChange, getMinDateTime]
  );

  // Get minimum time for the time input (only applies if date is today)
  const getMinTime = React.useCallback(() => {
    if (!value) return undefined;
    const today = startOfDay(new Date());
    const selectedDay = startOfDay(value);
    if (selectedDay.getTime() === today.getTime()) {
      const minDateTime = getMinDateTime();
      const hours = minDateTime.getHours().toString().padStart(2, "0");
      const minutes = (Math.ceil(minDateTime.getMinutes() / 5) * 5)
        .toString()
        .padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return undefined;
  }, [value, getMinDateTime]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            `${format(value, "PPP")} at ${time}`
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="divide-y overflow-hidden bg-background">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            initialFocus
          />
          <div className="space-y-2 p-4">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={handleTimeChange}
              min={getMinTime()}
              className="w-full"
              disabled={!value}
            />
            {!value && (
              <p className="text-xs text-muted-foreground">
                Select a date first
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
