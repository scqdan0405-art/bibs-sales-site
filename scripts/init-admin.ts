import { createId, nowIso, updateStore } from "../src/lib/store.ts";
import { getConfig } from "../src/lib/config.ts";
import { hashPassword } from "../src/lib/security.ts";

const config = getConfig();
updateStore((data) => {
  const existing = data.adminUsers.find((user) => user.email === config.adminEmail);
  if (existing) {
    existing.passwordHash = hashPassword(config.adminPassword);
    existing.failedCount = 0;
    existing.lockedUntil = null;
    existing.updatedAt = nowIso();
    return;
  }
  const now = nowIso();
  data.adminUsers.push({ id: createId(), email: config.adminEmail, passwordHash: hashPassword(config.adminPassword), failedCount: 0, lockedUntil: null, createdAt: now, updatedAt: now });
});
console.log("admin initialized");
