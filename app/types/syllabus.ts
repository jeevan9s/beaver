export interface Recurrence {
    freq: "WEEKLY";
    byDay: string[]; 
    interval?: number;
    until?: string | null; 
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