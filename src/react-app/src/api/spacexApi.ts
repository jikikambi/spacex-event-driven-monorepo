import { ConfigService } from "../config";

export interface Launch {
  id: string;
  name: string;
}

export async function getLaunch(id: string): Promise<Launch> {

  const config = new ConfigService();
  const API = config.settings.gateway.baseUrl;

  const response = await fetch(`${API}/launch/${id}`);

  if (!response.ok) {
    throw new Error("Failed to load launch");
  }

  return response.json();
}