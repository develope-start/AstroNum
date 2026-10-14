import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  formatPrice,
  periodEnd,
  PLAN_PRICES_TETRI,
} from "../src/lib/billing/plans";
import { verifyBogCallback } from "../src/lib/billing/bog";

assert.equal(PLAN_PRICES_TETRI.pro.month, 499);
assert.equal(PLAN_PRICES_TETRI.pro.half_year, 2545);
assert.equal(PLAN_PRICES_TETRI.pro.year, 4790);
assert.equal(PLAN_PRICES_TETRI.enterprise.month, 799);
assert.equal(PLAN_PRICES_TETRI.enterprise.half_year, 4075);
assert.equal(PLAN_PRICES_TETRI.enterprise.year, 7670);
assert.equal(formatPrice("pro", "month"), "4.99 ₾");

assert.equal(
  periodEnd(new Date("2025-01-31T12:30:00.000Z"), "month").toISOString(),
  "2025-02-28T12:30:00.000Z",
);
assert.equal(
  periodEnd(new Date("2024-02-29T12:30:00.000Z"), "year").toISOString(),
  "2025-02-28T12:30:00.000Z",
);

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const body = Buffer.from('{"event":"order_payment","body":{"order_id":"order-1"}}');
const signature = sign("RSA-SHA256", body, privateKey).toString("base64");
assert.equal(verifyBogCallback(body, signature, publicKey.export({ type: "spki", format: "pem" }).toString()), true);
assert.equal(verifyBogCallback(Buffer.from(`${body.toString()} `), signature, publicKey.export({ type: "spki", format: "pem" }).toString()), false);
assert.equal(verifyBogCallback(body, "invalid-signature", publicKey.export({ type: "spki", format: "pem" }).toString()), false);

console.log("Billing configuration, calendar periods, pricing and callback signature validation passed.");
