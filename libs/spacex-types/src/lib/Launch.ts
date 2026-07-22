export interface Links {
  patch: {
    small: string | null;
    large: string | null;
  };
  webcast: string | null;
  article: string | null;
  wikipedia: string | null;
}

export interface Core {
  core: string | null;
  flight: number | null;
  gridfins: boolean;
  legs: boolean;
  reused: boolean;
  landing_attempt: boolean;
  landing_success: boolean | null;
  landing_type: string | null;
  landpad: string | null;
}

export interface Failure {
  time: number
  altitude: any
  reason: string
}

export interface Launch {
  id: string;
  name: string;
  date_utc: string;
  date_unix: number;
  date_local: string;
  date_precision: string;
  success: boolean | null;
  details: string | null;
  rocket: string;
  launchpad: string;
  fairings: {
    reused: boolean;
    recovery_attempt: boolean
    recovered: boolean
    ships: string[]
  }
  links: {
    patch: { small: string | null; large: string | null };
    reddit: {
      campaign: string | null;
      launch: string | null;
      media: string | null;
      recovery: string | null;
    };
    flickr: {
      small: string[];
      original: string[];
    };
    presskit: string | null;
    webcast: string | null;
    youtube_id: string | null;
    article: string | null;
    wikipedia: string | null;
  };
  static_fire_date_utc: string;
  static_fire_date_unix: number;
  telemetry?: {
    flight_club: string | null;
  } | null;
  upcoming: boolean;
  cores: Core[];
  [key: string]: any; // optional: to allow other fields you don’t type yet
  ships: string[];
  payloads: string[];
  crew: string[];
  capsules: string[];
  failures: Failure[];
  window: number;
  net: boolean;
  tbd: boolean;
  auto_update: boolean;
  flight_number: number;
}
