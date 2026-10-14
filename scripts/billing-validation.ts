import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  formatPrice,
  periodEnd,
  PLAN_PRICES_TETRI,
} from "../src/lib/billing/plans";
import { verifyBogCallback } from "../src/lib/billing/bog";
import { assertTbcBillingConfigured, createTbcOrder, getTbcPaymentDetails } from "../src/lib/billing/tbc";

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

void (async () => {
  const originalFetch = globalThis.fetch;
  const environment = { APP_URL: process.env.APP_URL, TBC_DEVELOPER_API_KEY: process.env.TBC_DEVELOPER_API_KEY, TBC_CLIENT_ID: process.env.TBC_CLIENT_ID, TBC_CLIENT_SECRET: process.env.TBC_CLIENT_SECRET, TBC_API_BASE_URL: process.env.TBC_API_BASE_URL };
  process.env.APP_URL = "https://astro.example";
  process.env.TBC_DEVELOPER_API_KEY = "test-developer-key";
  process.env.TBC_CLIENT_ID = "test-merchant-id";
  process.env.TBC_CLIENT_SECRET = "test-merchant-secret";
  process.env.TBC_API_BASE_URL = "https://api.tbcbank.ge";
  const requests: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith("/v1/tpay/access-token")) return new Response(JSON.stringify({ access_token: "test-access-token", token_type: "Bearer", expires_in: 3600 }), { status: 200 });
    if (url.endsWith("/v1/tpay/payments") && init.method === "POST") return new Response(JSON.stringify({ payId: "tpay-test123", links: [{ rel: "approval_url", uri: "https://tpay.tbcbank.ge/checkout/test123" }] }), { status: 200 });
    if (url.endsWith("/v1/tpay/payments/tpay-test123")) return new Response(JSON.stringify({ payId: "tpay-test123", status: "Succeeded", currency: "GEL", amount: 4.99, returnedAmount: 0 }), { status: 200 });
    throw new Error("Unexpected TBC test request: " + url);
  }) as typeof fetch;
  try {
    assertTbcBillingConfigured();
    const created = await createTbcOrder({ externalOrderId: "external-order-123", plan: "pro", duration: "month", userIpAddress: "192.0.2.1" });
    assert.equal(created.orderId, "tpay-test123");
    assert.equal(new URL(created.checkoutUrl).origin, "https://tpay.tbcbank.ge");
    const requestBody = JSON.parse(String(requests[1]?.init.body));
    assert.equal(requestBody.amount.total, 4.99);
    assert.equal(requestBody.merchantPaymentId, "external-order-123");
    assert.equal(requestBody.callbackUrl, "https://astro.example/api/billing/tbc/callback");
    assert.equal(new Headers(requests[1]?.init.headers).get("authorization"), "Bearer test-access-token");
    const details = await getTbcPaymentDetails("tpay-test123");
    assert.equal(details.status, "Succeeded");
    assert.equal(details.amount, 4.99);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
  console.log("Billing configuration, calendar periods, BOG signatures, and mocked TBC checkout/receipt validation passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
