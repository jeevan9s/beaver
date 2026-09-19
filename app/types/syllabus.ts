export interface Recurrence {
    freq: "WEEKLY";
    byDay: string[]; // RRULE day codes, e.g. ["MO", "WE"]
    interval?: number;
    until?: string | null; // ISO date (YYYY-MM-DD) of the last possible occurrence
}

export interface Event {
    id: string;
    name: string; 
    date: string | null; 
    summary?: string;
    recurrence?: Recurrence | null;
}

export interface RawEvent {
  id?: string;
  name?: string;
  date?: string | null;
  summary?: string;
  recurrence?: Recurrence | null;
}

export interface Response {
    success: boolean; 
    filename: string;
    pageCount: number; 
    events: Event[];
    calendarSynced: boolean;
}

export interface Preview {
    events: Event[]; 
    success: boolean;
}

export interface ConfirmedPayload {
    events: Event[]; 
}