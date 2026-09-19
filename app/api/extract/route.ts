import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { getPath } from "pdf-parse/worker";
import { prompt } from "@/app/types/prompt";
import OpenAI from "openai";
import { auth } from "@/app/auth";
import * as syllabus from "@/app/types/syllabus";

export const runtime = "nodejs";

PDFParse.setWorker(getPath());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RawEvent {
  id?: string;
  name?: string;
  date?: string;
  summary?: string;
  recurrence?: {
    freq?: string;
    byDay?: string[];
    interval?: number;
    until?: string | null;
  } | null;
}

const VALID_DAYS = new Set(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);

function sanitizeRecurrence(raw: RawEvent["recurrence"]): syllabus.Recurrence | null {
  if (!raw || raw.freq !== "WEEKLY") return null;

  const byDay = (raw.byDay ?? []).filter(
    (day): day is string => typeof day === "string" && VALID_DAYS.has(day.toUpperCase()),
  ).map((day) => day.toUpperCase());

  if (byDay.length === 0) return null;

  return {
    freq: "WEEKLY",
    byDay,
    interval: typeof raw.interval === "number" && raw.interval > 0 ? raw.interval : 1,
    until: raw.until ?? null,
  };
}

export async function POST(req: Request): Promise<NextResponse<syllabus.Response>> {
  try {
    const session = await auth();
    const accessToken = (session as { accessToken?: string })?.accessToken;

    const file = await extractFile(req);
    const { text, pageCount } = await processPDF(file);
    const events = await extractEvents(text);

    return NextResponse.json({
      success: true,
      filename: file.name,
      pageCount,
      events,
      calendarSynced: Boolean(accessToken && events.length > 0),
    });
  } catch (error) {
    console.error("extraction pipeline error:", error);
    return NextResponse.json(
      {
        success: false,
        filename: "",
        pageCount: 0,
        events: [],
        calendarSynced: false,
      },
      { status: 500 },
    );
  }
}

async function extractFile(req: Request): Promise<File> {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) throw new Error("no file provided");
  return file;
}

function clean(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function processPDF(
  file: File,
): Promise<{ text: string; pageCount: number }> {
  const buf = await file.arrayBuffer();
  const parser = new PDFParse({ data: Buffer.from(buf) });

  try {
    const parsedData = await parser.getText();
    const cleaned = clean(parsedData.text);

    return {
      text: cleaned,
      pageCount: parsedData.total || 1,
    };
  } finally {
    await parser.destroy();
  }
}

async function extractEvents(syllabusText: string): Promise<syllabus.Event[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      { role: "user", content: syllabusText },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(completion.choices[0].message.content || "{}"); 
  const rawEvents: RawEvent[] = parsed.events || []; 

  return rawEvents
    .map((e, index) => ({
      id: e.id || `event-${index}`,
      name: e.name || "untitled event",
      date: e.date ?? null,
      summary: e.summary ?? undefined,
      recurrence: sanitizeRecurrence(e.recurrence),
    }))
    // no explicit (or derivable, for recurring) date - drop rather than invent one
    .filter((e) => e.date !== null || e.recurrence !== null);
}