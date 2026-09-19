
# Beaver

I built Beaver to automate the tedious process of turning course syllabi into structured calendar events.

Originally, this feature was internal to a desktop-app I built, Calmeca, but I decided to strip the extraction service and create a web-based platform for it, Beaver.

Beaver takes a PDF syllabus, extracts its text, uses OpenAI to identify academic events, lets the user review and confirm the extracted data, and then synchronizes those events with Google Calendar.

The application is built around a server-side Next.js architecture, with PDF processing, AI extraction, authentication, event normalization, recurrence handling, and Google Calendar synchronization handled through API routes.

## Stack

- **Next.js** — application framework and server-side API routes
- **React** — frontend
- **TypeScript** — application and data models
- **OpenAI API** — syllabus event extraction
- **pdf-parse** — server-side PDF text extraction
- **Google OAuth** — authentication and Calendar authorization
- **Google Calendar API** — event synchronization

## Syllabus Extraction

Syllabi are uploaded to a Next.js API route. The server parses the PDF, cleans the extracted text, and sends it to OpenAI using a structured extraction prompt.

```ts
const file = await extractFile(req);
const { text, pageCount } = await processPDF(file);
const events = await extractEvents(text);

return NextResponse.json({
  success: true,
  filename: file.name,
  pageCount,
  events,
});
````

PDF processing is performed server-side using `pdf-parse`:

```ts
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
```

Extracted text is normalized before being passed to the model:

```ts
function clean(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
```

## AI Event Extraction

The extraction pipeline sends the cleaned syllabus text to OpenAI along with a structured prompt and requests a JSON response.

```ts
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: syllabusText,
    },
  ],
  response_format: { type: "json_object" },
});

const parsed = JSON.parse(
  completion.choices[0].message.content || "{}"
);
```

The raw model output is normalized into Beaver's syllabus event model:

```ts
return rawEvents
  .map((e, index) => ({
    id: e.id || `event-${index}`,
    name: e.name || "untitled event",
    date: e.date ?? null,
    summary: e.summary ?? undefined,
    recurrence: sanitizeRecurrence(e.recurrence),
  }))
  .filter(
    (e) => e.date !== null || e.recurrence !== null
  );
```

Events without a usable date or recurrence are discarded rather than having dates invented for them.

## Event Model

Extracted events contain the information required for user review and Google Calendar synchronization:

```ts
{
  id: string;
  name: string;
  date: string | null;
  summary?: string;
  recurrence: Recurrence | null;
}
```

Recurring events currently support weekly recurrence:

```ts
{
  freq: "WEEKLY",
  byDay: ["MO", "WE"],
  interval: 1,
  until: "2026-12-01"
}
```

Recurrence data is sanitized before being used:

```ts
const VALID_DAYS = new Set([
  "MO", "TU", "WE", "TH",
  "FR", "SA", "SU"
]);

function sanitizeRecurrence(
  raw: RawEvent["recurrence"]
): syllabus.Recurrence | null {
  if (!raw || raw.freq !== "WEEKLY") return null;

  const byDay = (raw.byDay ?? [])
    .filter(
      (day) =>
        typeof day === "string" &&
        VALID_DAYS.has(day.toUpperCase())
    )
    .map((day) => day.toUpperCase());

  if (byDay.length === 0) return null;

  return {
    freq: "WEEKLY",
    byDay,
    interval:
      typeof raw.interval === "number" && raw.interval > 0
        ? raw.interval
        : 1,
    until: raw.until ?? null,
  };
}
```

## Google Calendar

Extracted events are reviewed and confirmed before being synchronized with Google Calendar.

Calendar synchronization is handled server-side through the Google Calendar API:

```ts
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
      ...(recurrenceRule
        ? { recurrence: recurrenceRule }
        : {}),
    }),
  }
);
```

The server converts extracted dates into Google Calendar-compatible event times:

```ts
function buildTimes(
  value: string | null | undefined,
  timeZone: string
) {
  const match = pattern.exec(value ?? "");
  if (!match) return null;

  const [, y, mo, d, h, mi] = match;

  if (h === undefined) {
    const next = new Date(
      Date.UTC(+y, +mo - 1, +d + 1)
    );

    return {
      start: { date: `${y}-${mo}-${d}` },
      end: {
        date: next.toISOString().slice(0, 10),
      },
    };
  }

  const start = `${y}-${mo}-${d}T${h}:${mi}:00`;

  const end = new Date(
    Date.UTC(+y, +mo - 1, +d, +h + 1, +mi)
  )
    .toISOString()
    .slice(0, 19);

  return {
    start: { dateTime: start, timeZone },
    end: { dateTime: end, timeZone },
  };
}
```

Recurring events are converted into Google Calendar `RRULE` definitions:

```ts
const parts = [
  `FREQ=${recurrence.freq}`,
  `BYDAY=${recurrence.byDay.join(",")}`,
  `INTERVAL=${recurrence.interval ?? 1}`,
];
```

When a recurrence has no explicit end date, Beaver limits it to a finite number of occurrences:

```ts
const DEFAULT_RECURRENCE_COUNT = 14;
```

## Authentication

Google authentication is handled through Beaver's Next.js authentication layer.

Calendar API routes retrieve the authenticated session before performing synchronization:

```ts
const session = await auth();
const accessToken = session?.accessToken;

if (!accessToken || session?.error) {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401 }
  );
}
```

Google Calendar API access is handled server-side rather than exposing calendar credentials directly to the client.

## Synchronization

Multiple confirmed events can be synchronized in a single request.

The synchronization endpoint:

1. Authenticates the user
2. Validates the submitted events
3. Converts dates and times
4. Generates recurrence rules
5. Creates Google Calendar events
6. Tracks successful and failed events
7. Returns a synchronization summary

```ts
return NextResponse.json({
  success: true,
  syncedCount,
});
```

Partial failures are reported without discarding events that were successfully synchronized:

```ts
{
  error: "some events failed to sync",
  syncedCount,
  failed
}
```

## Environment

The application requires credentials for the external services used by the server:

```env
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

## Development

```bash
npm install
npm run dev
```

Jeevan Sanchez, 2026
