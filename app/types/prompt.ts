export const prompt = `Extract all academic events, assignments, exams, midterms, quizzes, labs, tutorials, and key course deliverables from the supplied syllabus text.

Return a JSON object containing an array called "events". If no events are found, return an empty array.

For each event, extract:
- name: The title of the event, always prefixed with the course code when one is identifiable from the syllabus (e.g. "CPSC 221 Midterm 1", "CPSC 221 Assignment 3", "MATH 200 Weekly Tutorial"). If no course code can be found, use just the event title. Use null if the title itself is unknown.
- date: The specific date formatted as ISO (YYYY-MM-DD), or ISO date-time (YYYY-MM-DDTHH:MM) if a start time is given. If the year is omitted, infer it from the context. For a recurring event, this must be the date of its FIRST occurrence (see RECURRING EVENTS below) — never null when a recurrence is present.
- summary: An ultra-brief ultra-concise description, including weight (e.g. "Worth 15%"). Use null if absent.
- recurrence: null for one-off events. For events that repeat on a weekly cadence, an object: { "freq": "WEEKLY", "byDay": [...], "interval": 1, "until": "YYYY-MM-DD" }.

Rules & Guidelines:
1. MIDTERMS & TESTS: Classify major tests or midterms explicitly. Do not label them as standard assignments. Name them "<Course Code> Midterm" (with a number if there are multiple, e.g. "<Course Code> Midterm 1"). A midterm is always its own one-off event with an explicit date (never "recurrence") — even if it happens to fall during a normal lecture/lab time slot, still emit it as a separate entry with that date.
   - If no date is found, mark as "all-day". 
   - Ignore anything about finals.
2. RECURRING EVENTS: For weekly labs, tutorials, quizzes, or problem sets that repeat on the same day(s) each week:
   - Set "date" to the first occurrence (derive it from the term/semester start date plus the weekday the event occurs on).
   - Set "recurrence.freq" to "WEEKLY" and "recurrence.byDay" to the two-letter RRULE weekday codes it repeats on (MO, TU, WE, TH, FR, SA, SU).
   - Set "recurrence.until" to the last day of classes / term end date ONLY if it is explicitly stated in the syllabus. If it is not stated, leave "until" as null — do not guess or estimate it.
   - Ensure recurring events don't get inserted in TWICE. 
   - Do not set "recurrence" for one-time events such as a single midterm, final, or assignment due date.
3. COURSE CODE PREFIX: Identify the course code (e.g. "CPSC 221", "MATH 200") from the syllabus header/title and prepend it to every event name, separated by a space, so events from different courses stay distinguishable.
4. NO DATE, NO EVENT: Never invent, guess, or default a date. If a one-off event (assignment, midterm, final exam, etc.) is mentioned but no real date is given anywhere in the text — e.g. a final exam listed only as "TBD", "to be scheduled", or with no date at all — omit that event from the output entirely instead of including it with a fabricated or placeholder date.
5. UNKNOWN VALUES: Always use null for any field that cannot be explicitly found or reliably inferred from the document (other than "date", which follows rule 4). Do not guess random data.
`;