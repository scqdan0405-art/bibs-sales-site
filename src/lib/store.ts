import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export type PublishStatus = "draft" | "published";
export type SiteSettings = {
  brandName: string;
  tagline: string;
  description: string;
  companyName: string;
  contactEmail: string;
  businessHours: string;
  privacyPolicy: string;
  termsNote: string;
};
export type PriceItem = { id: string; label: string; priceYen: number; unit: string; description: string; status: PublishStatus };
export type CaseStudy = { id: string; title: string; category: string; summary: string; body: string; imageAlt: string; status: PublishStatus };
export type Faq = { id: string; question: string; answer: string; sortOrder: number; status: PublishStatus };
export type Notice = { id: string; title: string; body: string; status: PublishStatus };
export type AttachmentMeta = { id: string; inquiryId: string; originalName: string; storedName: string; mimeType: string; sizeBytes: number; createdAt: string };
export type Inquiry = {
  id: string;
  publicId: string;
  name: string;
  emailOrPhone: string;
  quantity: number;
  desiredDate: string;
  designStatus: string;
  message: string;
  consent: boolean;
  mailStatus: "pending" | "sent" | "failed";
  createdAt: string;
  updatedAt: string;
};
export type AdminUser = { id: string; email: string; passwordHash: string; failedCount: number; lockedUntil: string | null; createdAt: string; updatedAt: string };
export type Session = { id: string; userId: string; csrfToken: string; expiresAt: string; createdAt: string };
export type AuditLog = { id: string; actorId: string; action: string; target: string; summary: string; createdAt: string };
export type StoreData = {
  site: SiteSettings;
  prices: PriceItem[];
  cases: CaseStudy[];
  faqs: Faq[];
  notices: Notice[];
  inquiries: Inquiry[];
  attachments: AttachmentMeta[];
  adminUsers: AdminUser[];
  sessions: Session[];
  auditLogs: AuditLog[];
  rateLimits: Record<string, { count: number; resetAt: number }>;
};

const storePath = "data/store.json";
const seedPath = "data/seed.json";

export function nowIso(): string {
  return new Date().toISOString();
}

export function loadStore(): StoreData {
  if (!existsSync(storePath)) {
    const seed = JSON.parse(readFileSync(seedPath, "utf8")) as Pick<StoreData, "site" | "prices" | "cases" | "faqs" | "notices">;
    const initial: StoreData = { ...seed, inquiries: [], attachments: [], adminUsers: [], sessions: [], auditLogs: [], rateLimits: {} };
    saveStore(initial);
    return initial;
  }
  return JSON.parse(readFileSync(storePath, "utf8")) as StoreData;
}

export function saveStore(data: StoreData): void {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(data, null, 2), "utf8");
}

export function updateStore(mutator: (data: StoreData) => void): StoreData {
  const data = loadStore();
  mutator(data);
  saveStore(data);
  return data;
}

export function createId(): string {
  return randomUUID();
}

export function published<T extends { status: PublishStatus }>(items: T[]): T[] {
  return items.filter((item) => item.status === "published");
}
