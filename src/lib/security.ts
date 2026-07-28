import { createHmac, randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { IncomingMessage, ServerResponse } from "node:http";
import { createId, loadStore, nowIso, saveStore, updateStore, type AdminUser, type Session } from "./store.ts";
import { getConfig } from "./config.ts";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const hash = pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return `pbkdf2$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [, salt, hash] = stored.split("$");
  const test = pbkdf2Sync(password, salt, 210000, 32, "sha256");
  return timingSafeEqual(Buffer.from(hash, "hex"), test);
}

export function cookieHeader(name: string, value: string, maxAgeSeconds: number): string {
  const secure = getConfig().env === "production" ? " Secure;" : "";
  return `${name}=${value}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const raw = req.headers.cookie ?? "";
  return Object.fromEntries(raw.split(";").map((part) => part.trim().split("=")).filter((pair) => pair.length === 2));
}

export function sign(value: string): string {
  return createHmac("sha256", getConfig().sessionSecret).update(value).digest("hex");
}

export function createSession(userId: string): string {
  const id = createId();
  const csrfToken = randomBytes(24).toString("hex");
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  updateStore((data) => {
    data.sessions.push({ id, userId, csrfToken, expiresAt, createdAt });
  });
  return `${id}.${sign(id)}`;
}

export function getSession(req: IncomingMessage): Session | null {
  const token = parseCookies(req).admin_session;
  if (!token) return null;
  const [id, signature] = token.split(".");
  if (!id || signature !== sign(id)) return null;
  const session = loadStore().sessions.find((item) => item.id === id);
  if (!session || Date.parse(session.expiresAt) < Date.now()) return null;
  return session;
}

export function requireAdmin(req: IncomingMessage, res: ServerResponse): Session | null {
  const session = getSession(req);
  if (!session) {
    redirect(res, "/admin/login");
    return null;
  }
  return session;
}

export function verifyCsrf(req: IncomingMessage, token: string): boolean {
  const session = getSession(req);
  return Boolean(session && session.csrfToken === token);
}

export function logout(req: IncomingMessage, res: ServerResponse): void {
  const session = getSession(req);
  if (session) {
    updateStore((data) => {
      data.sessions = data.sessions.filter((item) => item.id !== session.id);
    });
  }
  res.setHeader("Set-Cookie", cookieHeader("admin_session", "", 0));
}

export function findAdmin(email: string): AdminUser | undefined {
  return loadStore().adminUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function redirect(res: ServerResponse, location: string): void {
  res.writeHead(303, { Location: location });
  res.end();
}

export function applySecurityHeaders(res: ServerResponse, noindex = false): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; form-action 'self'; frame-ancestors 'none'");
  if (noindex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (getConfig().env === "production") res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const store = loadStore();
  const entry = store.rateLimits[key];
  if (!entry || entry.resetAt < now) {
    store.rateLimits[key] = { count: 1, resetAt: now + windowMs };
    saveStore(store);
    return true;
  }
  entry.count += 1;
  saveStore(store);
  return entry.count <= limit;
}
