"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

const MotionButton = motion.create(Button);
const spring = { type: "spring", stiffness: 500, damping: 32 } as const;
const grow = (disabled = false, amount = 1.03) => ({
  whileHover: disabled ? undefined : { scale: amount },
  whileTap: disabled ? undefined : { scale: 0.97 },
  transition: spring,
});

const fieldClass =
  "h-auto w-full min-w-0 rounded-lg border-neutral-300/70 bg-white/60 px-3 py-2 font-manrope text-sm tracking-tight text-black shadow-none placeholder:text-neutral-400 focus-visible:border-black/40 focus-visible:ring-2 focus-visible:ring-black/10";

const textButtonClass =
  "h-auto cursor-pointer rounded-full bg-transparent px-2.5 py-1 font-manrope text-xs font-normal tracking-tight text-neutral-400 shadow-none hover:bg-transparent hover:text-black focus-visible:ring-2 focus-visible:ring-black/10 sm:text-sm";

const dateTimePattern = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(.*))?$/;

const pad = (n: number) => String(n).padStart(2, "0");

function toIsoDate(day: Date) {
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

function toLocalDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseWhen(value?: string) {
  if (!value) return { date: "", time: "", tail: ":00" };
  const match = dateTimePattern.exec(value);
  if (!match) return null;
  return { date: match[1], time: match[2] ?? "", tail: match[3] || ":00" };
}

function combineWhen(date: string, time: string, tail: string) {
  if (!date) return "";
  return time ? `${date}T${time}${tail}` : date;
}

function formatWhen(value?: string) {
  if (!value) return "no date";
  const parsed = parseWhen(value);
  if (!parsed || !parsed.date) return value;

  const [hour, minute] = parsed.time
    ? parsed.time.split(":").map(Number)
    : [0, 0];
  const base = toLocalDate(parsed.date);
  const when = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
  );
  const sameYear = base.getFullYear() === new Date().getFullYear();

  const dayLabel = when.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });

  if (!parsed.time) return dayLabel;

  const timeLabel = when.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dayLabel}, ${timeLabel}`;
}

export function DateTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsed = parseWhen(value);

  if (!parsed) {
    return (
      <Input
        aria-label="date"
        placeholder="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    );
  }

  const selected = parsed.date ? toLocalDate(parsed.date) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <MotionButton
            type="button"
            variant="outline"
            aria-label="pick date and time"
            {...grow(false, 1.01)}
            className={`${fieldClass} flex cursor-pointer items-center justify-start gap-2 text-left font-normal hover:bg-white/80 hover:text-black`}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-neutral-500" />
        <span className="truncate">
          {value ? formatWhen(value) : "pick date and time"}
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.stopPropagation();
        }}
        className="w-auto max-w-[calc(100vw-1.5rem)] rounded-2xl border-neutral-200 bg-white p-3 font-manrope text-black shadow-lg"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(day) => {
            if (!day) return;
            onChange(combineWhen(toIsoDate(day), parsed.time, parsed.tail));
          }}
          className="p-0 [--cell-size:2.25rem] [&_button]:cursor-pointer [&_button]:transition-transform [&_button:not(:disabled):hover]:scale-105"
        />

        <div className="mt-3 flex items-end gap-3 border-t border-neutral-200 pt-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs tracking-tight text-neutral-500">time</span>
            <Input
              type="time"
              value={parsed.time}
              onChange={(e) =>
                onChange(
                  combineWhen(
                    parsed.date || toIsoDate(new Date()),
                    e.target.value,
                    parsed.tail,
                  ),
                )
              }
              className={`${fieldClass} cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
          </label>

          {parsed.time && (
            <MotionButton
              type="button"
              variant="ghost"
              {...grow()}
              onClick={() => onChange(combineWhen(parsed.date, "", parsed.tail))}
              className={textButtonClass}
            >
              all day
            </MotionButton>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <MotionButton
            type="button"
            {...grow()}
            onClick={() => setOpen(false)}
            className="h-auto cursor-pointer rounded-full bg-black px-5 py-2 font-manrope text-sm font-medium tracking-tight text-white shadow-none hover:bg-neutral-800"
          >
            done
          </MotionButton>
        </div>
      </PopoverContent>
    </Popover>
  );
}
