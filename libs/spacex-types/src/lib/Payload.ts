export interface DragonCapsule {
  capsule: string | null;
  mass_returned_kg: number | null;
  mass_returned_lbs: number | null;
  flight_time_sec: number | null;
  manifest: string | null;
  water_landing: boolean | null;
  land_landing: boolean | null;
}

export interface Payload {
  id: string;
  name: string;
  type: string;
  reused: boolean;
  launch: string; // launch ID
  customers: string[];
  norad_ids: number[];
  nationalities: string[];
  manufacturers: string[];
  mass_kg: number | null;
  mass_lbs: number | null;
  orbit: string | null;
  reference_system: string | null;
  regime: string | null;
  longitude: number | null;
  semi_major_axis_km: number | null;
  eccentricity: number | null;
  periapsis_km: number | null;
  apoapsis_km: number | null;
  inclination_deg: number | null;
  period_min: number | null;
  lifespan_years: number | null;
  epoch: string | null;
  mean_motion: number | null;
  raan: number | null;
  arg_of_pericenter: number | null;
  mean_anomaly: number | null;
  dragon: DragonCapsule;
}