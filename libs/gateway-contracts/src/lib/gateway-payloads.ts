// -------------------------------
// Payload Shapes
// -------------------------------
export interface Rocket {
  id: string;
  name: string;
  [key: string]: any; // fallback for unknown fields
}

export interface Ship {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Payload {
  id: string;
  type: string;
  [key: string]: any;
}

export interface Launch {
  id: string;
  name: string;
  rocket: string;
  payloads: string[];
  ships: string[];
  [key: string]: any;
}

export interface EnrichedLaunchPayload {
  launch: Launch;
  rocket: Rocket | null;
  payloads: Payload[];
  ships: Ship[];
}