export interface Ship {
  id: string;
  legacy_id: string | null;
  model: string | null;
  type: string | null;
  roles: string[];
  imo: number | null;
  mmsi: number | null;
  abs: number | null;
  class: number | null;
  mass_kg: number | null;
  mass_lbs: number | null;
  year_built: number | null;
  home_port: string | null;
  status: string | null;
  speed_kn: number | null;
  course_deg: number | null;
  latitude: number | null;
  longitude: number | null;
  link: string | null;
  image: string | null;
  name: string;
  active: boolean;
  launches: string[]; // array of launch IDs
  last_ais_update: string | null;
}
