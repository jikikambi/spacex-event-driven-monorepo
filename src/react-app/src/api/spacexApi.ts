export interface Launch {
  id: string;
  name: string;
}

const API = "http://localhost:3001/api";

export async function getLaunch(id: string): Promise<Launch> {
  const response = await fetch(`${API}/launch/${id}`);

  if (!response.ok) {
    throw new Error("Failed to load launch");
  }

  return response.json();
}