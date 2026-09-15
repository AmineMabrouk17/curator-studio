import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./auth";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}