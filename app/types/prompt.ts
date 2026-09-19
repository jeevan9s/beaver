export const prompt = `Extract all academic events, assignments, exams, midterms, quizzes, labs, tutorials, and key course deliverables from the supplied syllabus text.

Return a JSON object containing an array called "events". If no events are found, return an empty array.

For each event, extract:
- name: The official title or description of the event/assignment (e.g. "Midterm 1", "Assignment 3", "Weekly Lab"). Use null if unknown.
- date: The specific date formatted as ISO (YYYY-MM-DD). If the year is omitted, infer it from the context. For recurring weekly items without a fixed start date, set to null.
- summary: An ultra-brief ultra-concise description, including weight (e.g. "Worth 15%"). Use null if absent.

Rules & Guidelines:
1. MIDTERMS & TESTS: Classify major tests or midterms explicitly. Do not label them as standard assignments.
2. RECURRING EVENTS: For weekly labs, tutorials, or problem sets that repeat, capture them clearly in the name/summary and handle dates gracefully.
3. UNKNOWN VALUES: Always use null for any field that cannot be explicitly found or reliably inferred from the document. Do not guess random data.
`;