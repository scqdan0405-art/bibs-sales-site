import { IncomingMessage } from "node:http";
import type { UploadedPart } from "./upload.ts";

export type ParsedMultipart = { fields: Record<string, string>; files: UploadedPart[] };

export async function readBody(req: IncomingMessage, limitBytes = 20 * 1024 * 1024): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += data.length;
    if (size > limitBytes) throw new Error("REQUEST_TOO_LARGE");
    chunks.push(data);
  }
  return Buffer.concat(chunks);
}

export function parseUrlEncoded(body: Buffer): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(body.toString("utf8")).entries());
}

export function parseMultipart(contentType: string, body: Buffer): ParsedMultipart {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!boundaryMatch) return { fields: {}, files: [] };
  const boundary = `--${boundaryMatch[1] ?? boundaryMatch[2]}`;
  const raw = body.toString("binary");
  const parts = raw.split(boundary).slice(1, -1);
  const fields: Record<string, string> = {};
  const files: UploadedPart[] = [];
  for (const part of parts) {
    const trimmed = part.replace(/^\r\n/, "").replace(/\r\n$/, "");
    const index = trimmed.indexOf("\r\n\r\n");
    if (index < 0) continue;
    const header = trimmed.slice(0, index);
    const content = trimmed.slice(index + 4);
    const name = /name="([^"]+)"/.exec(header)?.[1] ?? "";
    const filename = /filename="([^"]*)"/.exec(header)?.[1] ?? "";
    const contentTypeHeader = /content-type:\s*([^\r\n]+)/i.exec(header)?.[1] ?? "application/octet-stream";
    if (filename) {
      files.push({ name, filename, contentType: contentTypeHeader.toLowerCase(), data: Buffer.from(content, "binary") });
    } else if (name) {
      fields[name] = Buffer.from(content, "binary").toString("utf8");
    }
  }
  return { fields, files };
}
