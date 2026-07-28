import { appendFileSync, mkdirSync } from "node:fs";

export function log(level: "info" | "warn" | "error", event: string, meta: Record<string, unknown> = {}): void {
  mkdirSync("logs", { recursive: true });
  const record = { timestamp: new Date().toISOString(), level, event, ...mask(meta) };
  appendFileSync("logs/app.log", `${JSON.stringify(record)}\n`, "utf8");
}

function mask(meta: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set(["name", "email", "phone", "message", "originalName"]);
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [key, blocked.has(key) ? "[masked]" : value]));
}
