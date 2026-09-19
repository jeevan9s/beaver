import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import * as syllabus from "@/app/types/syllabus";

const pattern = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

// terms rarely run longer than this - keeps recurrence from repeating forever when no end date is known
const DEFAULT_RECURRENCE_COUNT = 14;

function buildTimes(value: string | null | undefined, timeZone: string) {
  const match = pattern.exec(value ?? "");
  if (!match) return null;

  const [, y, mo, d, h, mi] = match;

  if (h === undefined) {
    const next = new Date(Date.UTC(+y, +mo - 1, +d + 1));
    return {
      start: { date: `${y}-${mo}-${d}` },
      end: { date: next.toISOString().slice(0, 10) },
    };
  }

  const start = `${y}-${mo}-${d}T${h}:${mi}:00`;
  const end = new Date(Date.UTC(+y, +mo - 1, +d, +h + 1, +mi))
    .toISOString()
    .slice(0, 19);

  return {
    start: { dateTime: start, timeZone },
    end: { dateTime: end, timeZone },
  };
}

function buildRecurrenceRule(
  recurrence: syllabus.Recurrence | null | undefined,
  isAllDay: boolean,
): string[] | undefined {
  if (!recurrence || recurrence.byDay.length === 0) return undefined;

  const parts = [
    `FREQ=${recurrence.freq}`,
    `BYDAY=${recurrence.byDay.join(",")}`,
    `INTERVAL=${recurrence.interval ?? 1}`,
  ];

  const untilMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(recurrence.until ?? "");
  if (untilMatch) {
    const [, y, mo, d] = untilMatch;
    parts.push(isAllDay ? `UNTIL=${y}${mo}${d}` : `UNTIL=${y}${mo}${d}T235959Z`);
  } else {
    parts.push(`COUNT=${DEFAULT_RECURRENCE_COUNT}`);
  }

  return [`RRULE:${parts.join(";")}`];
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken || session?.error) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body: syllabus.ConfirmedPayload & { timeZone?: string } =
      await req.json();
    const { events, timeZone = "UTC" } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "no events provided for sync" },
        { status: 400 }
      );
    }

    let syncedCount = 0;
    const failed: { name: string; status: number }[] = [];

    for (const event of events) {
      const times = buildTimes(event.date, timeZone);

      if (!times) {
        failed.push({ name: event.name, status: 400 });
        continue;
      }

      const recurrenceRule = buildRecurrenceRule(event.recurrence, "date" in times.start);

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: event.name,
            description: event.summary,
            ...times,
            ...(recurrenceRule ? { recurrence: recurrenceRule } : {}),
          }),
        }
      );

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "calendar access denied", syncedCount },
          { status: response.status }
        );
      }

      if (!response.ok) {
        console.error(
          "google calendar error:",
          response.status,
          await response.text()
        );
        failed.push({ name: event.name, status: response.status });
        continue;
      }

      syncedCount += 1;
    }

    if (failed.length > 0) {
      return NextResponse.json(
        { error: "some events failed to sync", syncedCount, failed },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, syncedCount });
  } catch (error) {
    console.error("failed to process event updates:", error);
    return NextResponse.json(
      { error: "failed to sync confirmed events" },
      { status: 500 }
    );
  }
}