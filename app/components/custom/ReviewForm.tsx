"use client";

import { useMemo, useRef, useState } from "react";
import * as motion from "framer-motion/client";
import * as syllabus from "@/app/types/syllabus";

interface ReviewFormProps {
  initialEvents: syllabus.Event[];
  filename: string;
  onReset: () => void;
  onSynced: () => void;
}

export default function ReviewForm({
  initialEvents,
  filename,
  onReset,
  onSynced,
}: ReviewFormProps) {
  const [events, setEvents] = useState<syllabus.Event[]>(initialEvents);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const previousEventsRef = useRef<syllabus.Event[]>(initialEvents);

  const totalCount = useMemo(() => events.length, [events]);

  const removeEvent = (id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  const handleUndo = () => {
    setEvents(previousEventsRef.current);
    setStatus("Changes reverted.");
    setShowUndo(false);
  };

  const handleSync = async () => {
    if (events.length === 0) return;

    previousEventsRef.current = [...events];
    setIsSyncing(true);
    setStatus("Syncing events to Google Calendar...");
    setShowUndo(false);

    try {
      const response = await fetch("/api/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error("Unable to sync events");
      }

      setStatus(`Synced ${events.length} event${events.length === 1 ? "" : "s"} successfully.`);
      setShowUndo(true);
    } catch (error) {
      console.error(error);
      setStatus("Unable to sync events right now.");
      setShowUndo(false);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[28rem] md:max-w-[32rem] lg:max-w-[36rem] xl:max-w-[38rem] 2xl:max-w-[40rem] rounded-[1.5rem] border border-neutral-200/80 bg-white/80 p-4 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-5 lg:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-neutral-500">
            Review
          </p>
          <h2 className="mt-2 truncate text-base font-semibold text-neutral-900 sm:text-lg lg:text-xl">
            {filename}
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Back
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 text-[0.72rem] text-neutral-500 sm:text-xs">
        <span>
          {totalCount} event{totalCount === 1 ? "" : "s"} found
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-600">
          {events.length ? "Ready" : "No events"}
        </span>
      </div>

      <div className="space-y-3 sm:space-y-3.5">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, delay: index * 0.04, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-3.5 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.45)] sm:p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.18em] text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Event
                </div>
                <h3 className="mt-2 text-sm font-medium text-neutral-900 sm:text-[0.98rem]">
                  {event.name}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{event.date}</p>
                {event.summary && (
                  <p className="mt-2 text-xs leading-5 text-neutral-600 sm:text-sm">
                    {event.summary}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeEvent(event.id)}
                className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-[0.63rem] font-medium text-red-600 transition hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {status && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
          <p className="text-xs text-neutral-600 sm:text-sm">{status}</p>
          {showUndo && (
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-full border border-neutral-200 bg-white px-2.5 py-1.5 text-[0.68rem] font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Undo
            </button>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 sm:text-sm"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={isSyncing || events.length === 0}
          onClick={handleSync}
          className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-[0_12px_16px_-12px_rgba(0,0,0,0.8)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:text-sm"
        >
          {isSyncing ? "Syncing..." : "Sync to Calendar"}
        </button>
      </div>
    </motion.div>
  );
}
