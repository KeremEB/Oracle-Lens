import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /riotclient/region-locale. Not part of the summoner or honor
// APIs — region isn't in either payload, so this is a third, separate
// endpoint. Community-known, undocumented, and not verified against every
// client version; accountSummary mapper falls back to "Unknown" if it fails.
export interface LcuRegionLocale {
  region: string;
  locale: string;
}

export async function getRegionLocale(credentials: Credentials): Promise<LcuRegionLocale> {
  const response = await createHttp1Request(
    { url: '/riotclient/region-locale', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`region-locale request failed with status ${response.status}`);
  }

  return response.json<LcuRegionLocale>();
}
