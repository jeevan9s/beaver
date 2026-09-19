export interface Event {
    id: string;
    name: string; 
    date: string; 
    summary?: string;
}

export interface RawEvent {
  id?: string;
  name?: string;
  date?: string;
  summary?: string;
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