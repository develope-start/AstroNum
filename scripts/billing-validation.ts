import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  formatPrice,
  periodEnd,
  PLAN_PRICES_TETRI,
} from "../src/lib/billing/plans";
import { getBillingConfigurationReadiness } from "../src/lib/billing/settings";
import { matchesPaymentFilters, type PaymentFilterValues } from "../src/lib/billing/adminFilters";
import { verifyBogCallback, verifyBogConnection } from "../src/lib/billing/bog";
import { assertTbcBillingConfigured, createTbcOrder, getTbcPaymentDetails, verifyTbcConnection } from "../src/lib/billing/tbc";

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
const billingReadiness = getBillingConfigurationReadiness();
assert.equal(billingReadiness.settingsAvailable, false);
assert.deepEqual(billingReadiness.providers.map(({ id, enabled }) => [id, enabled]), [["BOG", false], ["TBC", false]]);
assert.ok(billingReadiness.providers.every(({ configured }) => typeof configured === "boolean"));

const emptyPaymentFilters: PaymentFilterValues = {
  paymentStatus: "ALL",
  paymentProvider: "ALL",
  paymentPlan: "ALL",
  paymentAmountMin: "",
  paymentAmountMax: "",
  paymentDateFrom: "",
  paymentDateTo: "",
};
const paidBogPro = [{ status: "PAID", provider: "BOG", plan: "pro", amountTetri: 499, paidAt: "2026-10-14T12:00:00.000Z" }];
assert.equal(matchesPaymentFilters([], emptyPaymentFilters), true);
assert.equal(matchesPaymentFilters([], { ...emptyPaymentFilters, paymentStatus: "UNPAID" }), true);
assert.equal(matchesPaymentFilters([{ ...paidBogPro[0], status: "PENDING" }], { ...emptyPaymentFilters, paymentStatus: "UNPAID" }), true);
assert.equal(matchesPaymentFilters(paidBogPro, { ...emptyPaymentFilters, paymentStatus: "UNPAID" }), false);
assert.equal(matchesPaymentFilters([], { ...emptyPaymentFilters, paymentStatus: "UNPAID", paymentPlan: "pro" }), false);
assert.equal(matchesPaymentFilters(paidBogPro, { ...emptyPaymentFilters, paymentProvider: "BOG", paymentPlan: "pro", paymentAmountMin: "4.99", paymentDateFrom: "2026-10-14" }), true);
assert.equal(matchesPaymentFilters(paidBogPro, { ...emptyPaymentFilters, paymentProvider: "TBC" }), false);

void (async () => {
  const originalFetch = globalThis.fetch;
  const environment = {
    APP_URL: process.env.APP_URL,
    BOG_ENVIRONMENT: process.env.BOG_ENVIRONMENT,
    BOG_CLIENT_ID: process.env.BOG_CLIENT_ID,
    BOG_CLIENT_SECRET: process.env.BOG_CLIENT_SECRET,
    BOG_CALLBACK_URL: process.env.BOG_CALLBACK_URL,
    BOG_CALLBACK_PUBLIC_KEY: process.env.BOG_CALLBACK_PUBLIC_KEY,
    TBC_DEVELOPER_API_KEY: process.env.TBC_DEVELOPER_API_KEY,
    TBC_CLIENT_ID: process.env.TBC_CLIENT_ID,
    TBC_CLIENT_SECRET: process.env.TBC_CLIENT_SECRET,
    TBC_API_BASE_URL: process.env.TBC_API_BASE_URL,
  };
  process.env.APP_URL = "https://astro.example";
  process.env.BOG_ENVIRONMENT = "sandbox";
  process.env.BOG_CLIENT_ID = "test-bog-client";
  process.env.BOG_CLIENT_SECRET = "test-bog-secret";
  process.env.BOG_CALLBACK_URL = "https://astro.example/api/billing/bog/callback";
  process.env.BOG_CALLBACK_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" }).toString();
  process.env.TBC_DEVELOPER_API_KEY = "test-developer-key";
  process.env.TBC_CLIENT_ID = "test-merchant-id";
  process.env.TBC_CLIENT_SECRET = "test-merchant-secret";
  process.env.TBC_API_BASE_URL = "https://api.tbcbank.ge";
  const requests: Array<{ url: string; init: RequestInit }> = [];
  let rejectTbcAuth = false;
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith("/protocol/openid-connect/token")) return new Response(JSON.stringify({ access_token: "test-bog-access-token", expires_in: 3600 }), { status: 200 });
    if (url.endsWith("/v1/tpay/access-token")) {
      if (rejectTbcAuth) return new Response("unauthorized", { status: 401 });
      return new Response(JSON.stringify({ access_token: "test-access-token", token_type: "Bearer", expires_in: 3600 }), { status: 200 });
    }
    if (url.endsWith("/v1/tpay/payments") && init.method === "POST") return new Response(JSON.stringify({ payId: "tpay-test123", links: [{ rel: "approval_url", uri: "https://tpay.tbcbank.ge/checkout/test123" }] }), { status: 200 });
    if (url.endsWith("/v1/tpay/payments/tpay-test123")) return new Response(JSON.stringify({ payId: "tpay-test123", status: "Succeeded", currency: "GEL", amount: 4.99, returnedAmount: 0 }), { status: 200 });
    throw new Error("Unexpected TBC test request: " + url);
  }) as typeof fetch;
  try {
    assertTbcBillingConfigured();
    assert.deepEqual(await verifyBogConnection(), { environment: "sandbox" });
    await verifyTbcConnection();
    assert.equal(requests.filter(({ url }) => url.endsWith("/protocol/openid-connect/token")).length, 1);
    assert.equal(requests.filter(({ url }) => url.endsWith("/v1/tpay/access-token")).length, 1);
    const created = await createTbcOrder({ externalOrderId: "external-order-123", plan: "pro", duration: "month", userIpAddress: "192.0.2.1" });
    assert.equal(created.orderId, "tpay-test123");
    assert.equal(new URL(created.checkoutUrl).origin, "https://tpay.tbcbank.ge");
    const paymentRequest = requests.find(({ url, init }) => url.endsWith("/v1/tpay/payments") && init.method === "POST");
    assert.ok(paymentRequest);
    const requestBody = JSON.parse(String(paymentRequest.init.body));
    assert.equal(requestBody.amount.total, 4.99);
    assert.equal(requestBody.merchantPaymentId, "external-order-123");
    assert.equal(requestBody.callbackUrl, "https://astro.example/api/billing/tbc/callback");
    assert.equal(new Headers(paymentRequest.init.headers).get("authorization"), "Bearer test-access-token");
    const details = await getTbcPaymentDetails("tpay-test123");
    assert.equal(details.status, "Succeeded");
    assert.equal(details.amount, 4.99);
    rejectTbcAuth = true;
    await assert.rejects(verifyTbcConnection(), /HTTP 401/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
  console.log("Billing configuration, calendar periods, BOG signatures, and mocked TBC checkout/receipt validation passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
