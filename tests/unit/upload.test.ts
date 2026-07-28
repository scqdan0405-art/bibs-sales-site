import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAndStoreFiles } from "../../src/lib/upload.ts";

test("stores png when mime extension and signature match", () => {
  const dir = mkdtempSync(join(tmpdir(), "bibs-upload-"));
  process.env.UPLOAD_DIR = dir;
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  const result = validateAndStoreFiles([{ name: "files", filename: "sample.png", contentType: "image/png", data: png }]);
  assert.equal(result[0].ok, true);
  rmSync(dir, { recursive: true, force: true });
});

test("rejects disguised html upload", () => {
  const result = validateAndStoreFiles([{ name: "files", filename: "sample.png", contentType: "image/png", data: Buffer.from("<script>") }]);
  assert.equal(result[0].ok, false);
});
