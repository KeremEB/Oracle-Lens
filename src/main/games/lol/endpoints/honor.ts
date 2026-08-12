import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-honor-v2/v1/profile. Undocumented LCU endpoint.
// `checkpoint` (progress toward the next honor level) is also in the
// payload but isn't used — this account's checkpoint value is a
// nonsensical -1, and there was nowhere in the UI actually displaying it.
export interface LcuHonorProfile {
  honorLevel: number;
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
