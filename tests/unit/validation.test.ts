import test from "node:test";
import assert from "node:assert/strict";
import { validateContact } from "../../src/lib/validation.ts";

test("valid contact input passes", () => {
  const errors = validateContact({ name: "山田", emailOrPhone: "customer@example.invalid", quantity: 10, desiredDate: "来月", designStatus: "rough", message: "相談したい", consent: true, honeypot: "" });
  assert.deepEqual(errors, {});
});

test("invalid contact input returns field errors", () => {
  const errors = validateContact({ name: "", emailOrPhone: "bad", quantity: 0, desiredDate: "", designStatus: "bad", message: "x".repeat(2001), consent: false, honeypot: "" });
  assert.equal(errors.name, "お名前を入力してください。");
  assert.ok(errors.emailOrPhone);
  assert.ok(errors.quantity);
  assert.ok(errors.designStatus);
  assert.ok(errors.message);
  assert.ok(errors.consent);
});
