// -------------------------------
// Payload Shapes
// -------------------------------
export interface GatewayRocket {
  id: string;
  name: string;
  type: string;
  first_flight: string;
  mass: {

    kg: number;

    lb: number;

  };
  [key: string]: unknown; // fallback "Keep all extra fields, but I don't know their types"
}

export interface GatewayShip {
  id: string;
  name: string;
  mass_kg: number | null;
  [key: string]: unknown;
}

export interface GatewayPayload {
  id: string;
  type: string;
  name: string;
  mass_kg: number | null;
  [key: string]: unknown;
}

export interface GatewayLaunch {
  id: string;
  name: string;
  upcoming: boolean;
  date_utc: string; 
  success: boolean | null;
  details: string | null;
  links: {
    patch: {
      small: string | null;
      large: string | null;
    },
    webcast: string | null;
    article: string | null;
    wikipedia: string | null;
  }
  rocket: string;
  payloads: string[];
  ships: string[];
  [key: string]: unknown;
}

export interface EnrichedGatewayLaunch {
  launch: GatewayLaunch;
  rocket: GatewayRocket | null;
  payloads: GatewayPayload[];
  ships: GatewayShip[];
}