import test from "node:test";
import assert from "node:assert/strict";
import { loadStore } from "../../src/lib/store.ts";

test("seed store has public content", () => {
  const store = loadStore();
  assert.ok(store.site.brandName);
  assert.ok(store.prices.length >= 1);
  assert.ok(store.cases.length >= 1);
  assert.ok(store.faqs.length >= 1);
});
