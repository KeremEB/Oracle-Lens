import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-rso-auth/v1/authorization/userinfo. Undocumented LCU
// endpoint — returns a signed JWT (`userInfo`) issued by Riot's own RSO auth
// service for the client's already-authenticated session. We only ever read
// informational claims out of it (country, account creation date), never
// use it to authenticate anything ourselves, so no signature verification
// is performed or needed — this is strictly a read of data the client
// already trusts about its own logged-in session, per the "local client
// only, no credentials handled" rule.
interface LcuUserInfoResponse {
  userInfo: string;
}

export interface RsoUserInfo {
  /** ISO 3166-1 alpha-3 country code, e.g. "tur" — verified live. */
  country?: string;
  /** Account creation time, epoch milliseconds — verified live (`acct.created_at`). */
  accountCreatedAt?: number;
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | undefined {
  const payloadSegment = jwt.split('.')[1];
  if (!payloadSegment) return undefined;

  try {
    return JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return undefined;
  }
}

export async function getRsoUserInfo(credentials: Credentials): Promise<RsoUserInfo> {
  const response = await createHttp1Request(
    { url: '/lol-rso-auth/v1/authorization/userinfo', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`rso userinfo request failed with status ${response.status}`);
  }

  const { userInfo } = response.json<LcuUserInfoResponse>();
  const payload = decodeJwtPayload(userInfo);
  if (!payload) return {};

  const acct = payload.acct as { created_at?: unknown } | undefined;

  return {
    country: typeof payload.country === 'string' ? payload.country : undefined,
    accountCreatedAt: typeof acct?.created_at === 'number' ? acct.created_at : undefined,
  };
}
