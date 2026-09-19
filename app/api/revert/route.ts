import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import * as syllabus from "@/app/types/syllabus";

const pattern = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken || session?.error) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body: { events: syllabus.Event[] } = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "no events provided for revert" },
        { status: 400 }
      );
    }

    let deletedCount = 0;


    for (const event of events) {
      const match = pattern.exec(event.date ?? "");
      if (!match) continue;

      const [, y, mo, d] = match;
      const timeMin = `${y}-${mo}-${d}T00:00:00Z`;
      const timeMax = `${y}-${mo}-${d}T23:59:59Z`;

      const searchParams = new URLSearchParams({
        timeMin,
        timeMax,
        q: event.name,
      });

      const listRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!listRes.ok) continue;

      const listData = await listRes.json();
      const items = listData.items || [];

      for (const item of items) {
        if (item.summary === event.name) {
          const deleteRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${item.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (deleteRes.ok || deleteRes.status === 410) {
            deletedCount += 1;
          }
        }
      }
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("failed to revert events:", error);
    return NextResponse.json(
      { error: "failed to revert calendar events" },
      { status: 500 }
    );
  }
}