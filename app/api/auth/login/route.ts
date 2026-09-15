import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { authenticatePassword, createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

const MAX_FAILURES = 10;
const LOCK_MS = 15 * 60 * 1000;

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const db = await getDb();
  const ip = clientIp(request);
  const now = Date.now();

  const attempts = await db
    .select()
    .from(schema.loginAttempts)
    .where(eq(schema.loginAttempts.ip, ip))
    .get();

  if (attempts?.lockedUntil && attempts.lockedUntil.getTime() > now) {
    const wait = Math.ceil((attempts.lockedUntil.getTime() - now) / 1000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${wait}s.` },
      { status: 429 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ok = await authenticatePassword(body.password ?? "");

  if (ok) {
    await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.ip, ip));
    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return response;
  }

  const failed = (attempts?.failed ?? 0) + 1;
  const lockedUntil = failed >= MAX_FAILURES ? new Date(now + LOCK_MS) : null;
  await db
    .insert(schema.loginAttempts)
    .values({ ip, failed: lockedUntil ? 0 : failed, lockedUntil })
    .onConflictDoUpdate({
      target: schema.loginAttempts.ip,
      set: { failed: lockedUntil ? 0 : failed, lockedUntil },
    });

  return NextResponse.json(
    { error: "Incorrect password" },
    { status: 401 },
  );
}