import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createId, type AttachmentMeta } from "./store.ts";
import { getConfig } from "./config.ts";

export type UploadedPart = { name: string; filename: string; contentType: string; data: Buffer };
export type FileValidationResult = { ok: true; meta: Omit<AttachmentMeta, "inquiryId" | "createdAt"> } | { ok: false; error: string };

const maxFileSize = 5 * 1024 * 1024;
const maxTotalSize = 15 * 1024 * 1024;

export function validateAndStoreFiles(files: UploadedPart[]): FileValidationResult[] {
  if (files.length > 3) return [{ ok: false, error: "添付ファイルは最大3件までです。" }];
  const total = files.reduce((sum, file) => sum + file.data.length, 0);
  if (total > maxTotalSize) return [{ ok: false, error: "添付ファイルの合計サイズは15MB以内にしてください。" }];
  return files.map(validateAndStoreFile);
}

function validateAndStoreFile(file: UploadedPart): FileValidationResult {
  if (file.data.length > maxFileSize) return { ok: false, error: `${file.filename} は5MB以内にしてください。` };
  const ext = extension(file.filename);
  const detected = detectMime(file.data);
  const allowed = new Map([
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["png", "image/png"],
    ["pdf", "application/pdf"]
  ]);
  if (!allowed.has(ext) || allowed.get(ext) !== file.contentType || detected !== file.contentType) {
    return { ok: false, error: `${file.filename} はJPEG、PNG、PDFのみ添付できます。` };
  }
  const id = createId();
  const storedName = `${id}.${ext === "jpeg" ? "jpg" : ext}`;
  mkdirSync(getConfig().uploadDir, { recursive: true });
  writeFileSync(join(getConfig().uploadDir, storedName), file.data);
  return { ok: true, meta: { id, originalName: file.filename.slice(0, 180), storedName, mimeType: file.contentType, sizeBytes: file.data.length } };
}

function extension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function detectMime(buffer: Buffer): string {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "%PDF") return "application/pdf";
  return "application/octet-stream";
}
