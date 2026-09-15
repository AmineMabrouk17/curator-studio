import { EncryptJWT, jwtDecrypt } from "jose";

export const SESSION_COOKIE = "curator_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

async function deriveSecretKey(secret: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return new Uint8Array(digest);
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const key = await deriveSecretKey(secret);
  return new EncryptJWT({ curator: true })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .encrypt(key);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    const key = await deriveSecretKey(secret);
    const { payload } = await jwtDecrypt(token, key);
    return payload.curator === true;
  } catch {
    return false;
  }
}

export async function readSession(
  request: Request,
): Promise<string | null> {
  if (typeof request === "object" && "headers" in request) {
    const cookies = request.headers.get("cookie");
    if (!cookies) return null;
    for (const part of cookies.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === SESSION_COOKIE) {
        const value = rest.join("=");
        return (await verifySessionToken(decodeURIComponent(value))) ? value : null;
      }
    }
  }
  return null;
}

export async function authenticatePassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  const actualHash = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  const expectedHash = await crypto.subtle.digest("SHA-256", encoder.encode(expected));
  const a = new Uint8Array(actualHash);
  const b = new Uint8Array(expectedHash);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export const SESSION_COOKIE_OPTIONS: {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};