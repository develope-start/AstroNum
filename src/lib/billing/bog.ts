import { createPublicKey, verify } from "node:crypto";
import {
  BILLING_DURATIONS,
  PLAN_PRICES_TETRI,
  type BillablePlan,
  type BillingDuration,
} from "@/lib/billing/plans";

type BogEnvironment = "sandbox" | "production";

type BogConfig = {
  environment: BogEnvironment;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  callbackPublicKey: string;
  appUrl: string;
  apiUrl: string;
  oauthUrl: string;
};

type BogOrderResponse = {
  id?: string;
  _links?: { redirect?: { href?: string } };
};

export type BogOrderDetails = {
  orderId: string;
  externalOrderId: string;
  status: string;
  amount: number;
  currency: string;
};

let cachedToken: { value: string; expiresAt: number } | undefined;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
}

function getBogConfig(): BogConfig {
  const environment = process.env.BOG_ENVIRONMENT?.trim() || "sandbox";
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("BOG_ENVIRONMENT must be sandbox or production");
  }

  const callbackUrl = new URL(requiredEnv("BOG_CALLBACK_URL"));
  if (callbackUrl.protocol !== "https:") {
    throw new Error("BOG_CALLBACK_URL must use HTTPS");
  }

  const appUrl = new URL(requiredEnv("APP_URL"));
  if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") {
    throw new Error("APP_URL must use HTTPS outside localhost");
  }

  const pem = requiredEnv("BOG_CALLBACK_PUBLIC_KEY").replace(/\\n/g, "\n");
  createPublicKey(pem);

  return {
    environment,
    clientId: requiredEnv("BOG_CLIENT_ID"),
    clientSecret: requiredEnv("BOG_CLIENT_SECRET"),
    callbackUrl: callbackUrl.toString(),
    callbackPublicKey: pem,
    appUrl: appUrl.toString().replace(/\/$/, ""),
    apiUrl: environment === "sandbox" ? "https://api-sandbox.bog.ge" : "https://api.bog.ge",
    oauthUrl: environment === "sandbox" ? "https://oauth2-sandbox.bog.ge" : "https://oauth2.bog.ge",
  };
}

async function getAccessToken(config: BogConfig, forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response: Response;
  try {
    response = await fetch(`${config.oauthUrl}/auth/realms/bog/protocol/openid-connect/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`BOG OAuth request failed with HTTP ${response.status}`);

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("access_token" in payload) || typeof payload.access_token !== "string") {
    throw new Error("BOG OAuth response did not contain an access token");
  }
  const rawExpiry = "expires_in" in payload ? Number(payload.expires_in) : NaN;
  const expiresAt = rawExpiry > 1_000_000_000_000 ? rawExpiry : Date.now() + rawExpiry * 1000;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error("BOG OAuth response contained an invalid token expiry");
  }

  cachedToken = { value: payload.access_token, expiresAt };
  return cachedToken.value;
}

async function bogRequest<T>(config: BogConfig, path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken(config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept-Language": "ka",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`BOG API request failed with HTTP ${response.status}`);
  return (await response.json()) as T;
}

export async function createBogOrder(input: {
  externalOrderId: string;
  plan: BillablePlan;
  duration: BillingDuration;
}): Promise<{ orderId: string; checkoutUrl: string }> {
  const config = getBogConfig();
  const amount = PLAN_PRICES_TETRI[input.plan][input.duration] / 100;
  const result = await bogRequest<BogOrderResponse>(config, "/payments/v1/ecommerce/orders", {
    method: "POST",
    headers: { "Idempotency-Key": input.externalOrderId },
    body: JSON.stringify({
      callback_url: config.callbackUrl,
      external_order_id: input.externalOrderId,
      capture: "automatic",
      purchase_units: {
        currency: "GEL",
        total_amount: amount,
        basket: [{
          quantity: 1,
          unit_price: amount,
          product_id: `astronum-${input.plan}-${input.duration}`,
          description: `AstroNum ${input.plan} - ${BILLING_DURATIONS[input.duration].label}`,
          total_price: amount,
        }],
      },
      redirect_urls: {
        success: `${config.appUrl}/checkout/result?order=${encodeURIComponent(input.externalOrderId)}`,
        fail: `${config.appUrl}/checkout/result?order=${encodeURIComponent(input.externalOrderId)}&result=failed`,
      },
    }),
  });

  const orderId = result.id;
  const checkoutUrl = result._links?.redirect?.href;
  if (!orderId || !checkoutUrl) throw new Error("BOG order response is missing its payment redirect");

  const redirect = new URL(checkoutUrl);
  if (redirect.protocol !== "https:" || !(redirect.hostname === "bog.ge" || redirect.hostname.endsWith(".bog.ge"))) {
    throw new Error("BOG returned an invalid payment redirect URL");
  }
  return { orderId, checkoutUrl: redirect.toString() };
}

export async function getBogOrderDetails(orderId: string): Promise<BogOrderDetails> {
  const config = getBogConfig();
  const result = await bogRequest<unknown>(
    config,
    `/payments/v1/receipt/${encodeURIComponent(orderId)}`,
    { method: "GET" },
  );
  if (!result || typeof result !== "object") throw new Error("BOG payment details response was invalid");

  const record = result as Record<string, unknown>;
  const purchaseUnits = record.purchase_units;
  const units = purchaseUnits && typeof purchaseUnits === "object"
    ? purchaseUnits as Record<string, unknown>
    : {};
  const statusRecord = record.order_status;
  const statusObject = statusRecord && typeof statusRecord === "object"
    ? statusRecord as Record<string, unknown>
    : {};
  const order = record.order_id;
  const external = record.external_order_id;
  const status = statusObject.key;
  const rawAmount = units.request_amount ?? units.total_amount ?? units.amount;
  const rawCurrency = units.currency_code ?? units.request_currency ?? units.currency;
  const amount = Number(rawAmount);

  if (
    typeof order !== "string" ||
    typeof external !== "string" ||
    typeof status !== "string" ||
    !Number.isFinite(amount) ||
    typeof rawCurrency !== "string"
  ) {
    throw new Error("BOG payment details response is missing required order fields");
  }

  return { orderId: order, externalOrderId: external, status, amount, currency: rawCurrency };
}

export function verifyBogCallback(rawBody: Buffer, signature: string, publicKeyPem: string): boolean {
  if (!signature || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) return false;
  try {
    return verify(
      "RSA-SHA256",
      rawBody,
      createPublicKey(publicKeyPem.replace(/\\n/g, "\n")),
      Buffer.from(signature, "base64"),
    );
  } catch {
    return false;
  }
}

export function getBogCallbackPublicKey(): string {
  return requiredEnv("BOG_CALLBACK_PUBLIC_KEY").replace(/\\n/g, "\n");
}

export function assertBogBillingConfigured(): void {
  getBogConfig();
}

export async function verifyBogConnection(): Promise<{ environment: BogEnvironment }> {
  const config = getBogConfig();
  await getAccessToken(config, true);
  return { environment: config.environment };
}
