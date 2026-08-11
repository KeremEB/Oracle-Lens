import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-honor-v2/v1/profile. Undocumented LCU endpoint.
export interface LcuHonorProfile {
  honorLevel: number;
  checkpoint: number;
}

export async function getHonorProfile(credentials: Credentials): Promise<LcuHonorProfile> {
  const response = await createHttp1Request(
    { url: '/lol-honor-v2/v1/profile', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`honor profile request failed with status ${response.status}`);
  }

  return response.json<LcuHonorProfile>();
}
