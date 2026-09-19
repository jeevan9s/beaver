"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as syllabus from "@/app/types/syllabus";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { DateTimePicker } from "@/app/components/custom/DateTimePicker";

interface ReviewFormProps {
  initialEvents: syllabus.Event[];
  filename: string;
  onReset: () => void;
  onSynced: () => void;
}

const MotionButton = motion.create(Button);

const ease = [0.16, 1, 0.3, 1] as const;
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

const DAY_LABELS: Record<string, string> = {
  MO: "Mon",
  TU: "Tue",
  WE: "Wed",
  TH: "Thu",
  FR: "Fri",
  SA: "Sat",
  SU: "Sun",
};

function formatRecurrence(recurrence?: syllabus.Recurrence | null) {
  if (!recurrence || recurrence.byDay.length === 0) return null;

  const days = recurrence.byDay.map((day) => DAY_LABELS[day] ?? day).join(", ");
  const until = recurrence.until ? ` until ${formatWhen(recurrence.until)}` : "";

  return `repeats weekly on ${days}${until}`;
}

function formatWhen(value?: string) {
  if (!value) return "no date";

  const match = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(.*))?$/.exec(value);
  if (!match) return value;

  const [, datePart, timePart] = match;
  const [year, month, day] = datePart.split("-").map(Number);
  const base = new Date(year, month - 1, day);

  if (!timePart) {
    return base.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      ...(base.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
    });
  }

  const [hour, minute] = timePart.split(":").map(Number);
  const when = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute);

  const dayLabel = when.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(base.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
  });

  return `${dayLabel}, ${when.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function ReviewForm({
  initialEvents,
  filename,
  onReset,
  onSynced,
}: ReviewFormProps) {
  const [events, setEvents] = useState<syllabus.Event[]>(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const previousEventsRef = useRef<syllabus.Event[]>(initialEvents);

  const count = events.length;
  const plural = count === 1 ? "" : "s";
  const hasBlankName = events.some((event) => !event.name?.trim());
  const syncDisabled = isSyncing || count === 0 || hasBlankName;

  const updateEvent = (id: string, patch: Partial<syllabus.Event>) => {
    setEvents((current) =>
      current.map((event) => (event.id === id ? { ...event, ...patch } : event))
    );
  };

  const removeEvent = (id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
    setEditingId((current) => (current === id ? null : current));
  };

  const handleUndo = () => {
    setEvents(previousEventsRef.current);
    setStatus("changes reverted.");
    setShowUndo(false);
  };

  const handleSync = async () => {
    if (count === 0 || hasBlankName) return;

    previousEventsRef.current = [...events];
    setEditingId(null);
    setIsSyncing(true);
    setStatus("syncing to google calendar...");
    setShowUndo(false);

    try {
      const response = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) {
        setStatus(
          response.status === 401 || response.status === 403
            ? "google calendar access expired. sign out and back in, then try again."
            : "couldn't sync some events. try again in a moment."
        );
        setShowUndo(false);
        return;
      }

      setStatus(`Beaver synced ${count} event${plural} to your calendar.`);
      setShowUndo(true);
    } catch (error) {
      console.error(error);
      setStatus("couldn't sync right now. try again in a moment.");
      setShowUndo(false);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="flex w-full min-w-0 max-w-[34rem] flex-col font-manrope text-black lg:max-w-[38rem] 2xl:max-w-[44rem]"
    >
      <div className="min-w-0">
        <h2 className="text-xl font-medium tracking-tight sm:text-2xl 2xl:text-3xl">
          {count > 0
            ? `Beaver found ${count} event${plural}`
            : "no events left"}
        </h2>
        <p className="mt-1 truncate text-xs tracking-tight text-neutral-500 sm:text-sm">
          from {filename}
        </p>
      </div>

      {count > 0 ? (
        <ul className="mt-6 max-h-[50dvh] divide-y divide-neutral-300/60 overflow-y-auto overflow-x-hidden border-y border-neutral-300/60 sm:mt-8 sm:max-h-[55dvh]">
          <AnimatePresence initial={false}>
            {events.map((event) => {
              const isEditing = editingId === event.id;

              return (
                <motion.li
                  key={event.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden"
                >
                  {isEditing ? (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3 px-1 py-4"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    >
                      <Input
                        autoFocus
                        aria-label="event name"
                        placeholder="event name"
                        value={event.name ?? ""}
                        onChange={(e) =>
                          updateEvent(event.id, { name: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditingId(null);
                        }}
                        className={fieldClass}
                      />

                      <DateTimePicker
                        value={event.date ?? ""}
                        onChange={(next) =>
                          updateEvent(event.id, { date: next })
                        }
                      />

                      <Textarea
                        aria-label="notes"
                        placeholder="notes"
                        rows={3}
                        value={event.summary ?? ""}
                        onChange={(e) =>
                          updateEvent(event.id, { summary: e.target.value })
                        }
                        className={`${fieldClass} min-h-0 resize-none`}
                      />

                      <div className="flex items-center justify-between">
                        <MotionButton
                          type="button"
                          variant="ghost"
                          {...grow()}
                          onClick={() => removeEvent(event.id)}
                          className={`${textButtonClass} -ml-2.5`}
                        >
                          remove
                        </MotionButton>
                        <MotionButton
                          type="button"
                          variant="ghost"
                          {...grow()}
                          onClick={() => setEditingId(null)}
                          className={`${textButtonClass} -mr-2.5 text-black hover:text-neutral-600`}
                        >
                          done
                        </MotionButton>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start justify-between gap-4 px-1 py-3.5 sm:py-4"
                    >
                      <motion.button
                        type="button"
                        onClick={() => setEditingId(event.id)}
                        {...grow(false, 1.01)}
                        className="min-w-0 flex-1 origin-left cursor-pointer rounded-md text-left [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
                      >
                        <span className="block text-sm font-medium leading-snug tracking-tight sm:text-base">
                          {event.name || "untitled event"}
                        </span>
                        <span className="mt-0.5 block text-xs tracking-tight text-neutral-500 sm:text-sm">
                          {formatWhen(event.date)}
                          {event.recurrence && ` \u00b7 ${formatRecurrence(event.recurrence)}`}
                        </span>
                        {event.summary && (
                          <span className="mt-1.5 block text-xs leading-relaxed tracking-tight text-neutral-500 sm:text-sm">
                            {event.summary}
                          </span>
                        )}
                      </motion.button>

                      <div className="flex shrink-0 items-center">
                        <MotionButton
                          type="button"
                          variant="ghost"
                          {...grow()}
                          onClick={() => setEditingId(event.id)}
                          className={textButtonClass}
                        >
                          edit
                        </MotionButton>
                        <MotionButton
                          type="button"
                          variant="ghost"
                          {...grow()}
                          onClick={() => removeEvent(event.id)}
                          className={`${textButtonClass} -mr-2.5`}
                        >
                          remove
                        </MotionButton>
                      </div>
                    </motion.div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="mt-6 text-sm tracking-tight text-neutral-500 sm:mt-8">
          go back to try another file.
        </p>
      )}

      <div
        aria-live="polite"
        className="mt-4 flex min-h-[1.25rem] items-center gap-3 text-xs tracking-tight text-neutral-500 sm:text-sm"
      >
        {hasBlankName ? (
          <span>every event needs a name before syncing.</span>
        ) : (
          status && <span>{status}</span>
        )}
        {showUndo && !hasBlankName && (
          <motion.button
            type="button"
            onClick={handleUndo}
            {...grow()}
            className="cursor-pointer text-black underline underline-offset-4 transition-colors hover:text-neutral-600 focus-visible:outline-none"
          >
            undo
          </motion.button>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <MotionButton
          type="button"
          variant="ghost"
          {...grow()}
          onClick={onReset}
          className="h-auto cursor-pointer rounded-full border border-neutral-300 bg-transparent px-6 py-3 font-manrope text-sm font-normal tracking-tight text-neutral-600 shadow-none hover:bg-transparent hover:text-black sm:py-2.5"
        >
          cancel
        </MotionButton>
        <MotionButton
          type="button"
          disabled={syncDisabled}
          {...grow(syncDisabled)}
          onClick={handleSync}
          className="h-auto cursor-pointer rounded-full bg-black px-6 py-3 font-manrope text-sm font-medium tracking-tight text-white shadow-none hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:opacity-100 sm:py-2.5"
        >
          {isSyncing ? "syncing..." : "sync to calendar"}
        </MotionButton>
      </div>
    </motion.div>
  );
}