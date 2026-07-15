export interface Launchpad {
  id: string;
  name: string;
  full_name: string;
  locality: string;
  region: string;
  latitude: number;
  longitude: number;
  landing_attempts: number;
  landing_successes: number;
  wikipedia:string;
  details: string;
  rockets: string[];
  timezone: string;
  launches: string[];
  status: string;
  type:string;
  images?: {
    large: string[];
  };
}