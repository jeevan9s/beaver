import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import * as syllabus from "@/app/types/syllabus";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    const accessToken = (session as { accessToken?: string })?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    const body: syllabus.ConfirmedPayload = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "no events provided for sync" },
        { status: 400 }
      );
    }

    for (const event of events) {
      await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.name,
          description: event.summary,
          start: { date: event.date },
          end: { date: event.date }, 
        }),
      });
    }

    return NextResponse.json({ success: true, syncedCount: events.length });
  } catch (error) {
    console.error("failed to process event updates:", error);
    return NextResponse.json(
      { error: "failed to sync confirmed events" },
      { status: 500 }
    );
  }
}