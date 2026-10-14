import { PLAN_PRICES_TETRI, type BillablePlan, type BillingDuration } from "@/lib/billing/plans";

type TbcConfig = { apiUrl: string; apiKey: string; clientId: string; clientSecret: string; appUrl: string };
type TbcTokenResponse = { access_token?: unknown; expires_in?: unknown; token_type?: unknown };
type TbcPaymentResponse = { payId?: unknown; links?: Array<{ uri?: unknown; rel?: unknown }> };
export type TbcPaymentDetails = { payId: string; status: string; currency: string; amount: number; returnedAmount: number };
let cachedToken: { value: string; expiresAt: number } | undefined;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
}
function getConfig(): TbcConfig {
  const apiUrl = new URL(process.env.TBC_API_BASE_URL?.trim() || "https://api.tbcbank.ge");
  if (apiUrl.protocol !== "https:" || !(apiUrl.hostname === "api.tbcbank.ge" || apiUrl.hostname.endsWith(".tbcbank.ge"))) {
    throw new Error("TBC_API_BASE_URL must be an HTTPS TBC Bank host");
  }
  const appUrl = new URL(requiredEnv("APP_URL"));
  if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") throw new Error("APP_URL must use HTTPS outside localhost");
  return {
    apiUrl: apiUrl.toString().replace(/\/$/, ""),
    apiKey: requiredEnv("TBC_DEVELOPER_API_KEY"),
    clientId: requiredEnv("TBC_CLIENT_ID"),
    clientSecret: requiredEnv("TBC_CLIENT_SECRET"),
    appUrl: appUrl.toString().replace(/\/$/, ""),
  };
}
export function assertTbcBillingConfigured(): void { getConfig(); }

export async function verifyTbcConnection(): Promise<void> {
  await getAccessToken(getConfig(), true);
}

async function request(url: string, init: RequestInit, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, cache: "no-store", signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}
async function getAccessToken(config: TbcConfig, forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value;
  const response = await request(`${config.apiUrl}/v1/tpay/access-token`, {
    method: "POST",
    headers: { apikey: config.apiKey, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret }),
  });
  if (!response.ok) throw new Error(`TBC token request failed with HTTP ${response.status}`);
  const data = await response.json() as TbcTokenResponse;
  if (typeof data.access_token !== "string" || (data.token_type && data.token_type !== "Bearer")) throw new Error("TBC token response is invalid");
  const expiresIn = Number(data.expires_in);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error("TBC token expiry is invalid");
  cachedToken = { value: data.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  return cachedToken.value;
}
async function tbcRequest<T>(config: TbcConfig, endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken(config);
  const response = await request(`${config.apiUrl}${endpoint}`, {
    ...init,
    headers: { apikey: config.apiKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`TBC API request failed with HTTP ${response.status}`);
  return await response.json() as T;
}

export async function createTbcOrder(input: {
  externalOrderId: string;
  plan: BillablePlan;
  duration: BillingDuration;
  userIpAddress: string;
}): Promise<{ orderId: string; checkoutUrl: string }> {
  const config = getConfig();
  const amount = PLAN_PRICES_TETRI[input.plan][input.duration] / 100;
  const returnUrl = new URL(`${config.appUrl}/checkout/result`);
  returnUrl.searchParams.set("order", input.externalOrderId);
  returnUrl.searchParams.set("provider", "TBC");
  const response = await tbcRequest<TbcPaymentResponse>(config, "/v1/tpay/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: { currency: "GEL", total: amount, subtotal: amount, tax: 0, shipping: 0 },
      returnurl: returnUrl.toString(),
      userIpAddress: input.userIpAddress,
      expirationMinutes: 12,
      callbackUrl: `${config.appUrl}/api/billing/tbc/callback`,
      language: "KA",
      merchantPaymentId: input.externalOrderId,
      skipInfoMessage: true,
    }),
  });
  if (typeof response.payId !== "string" || !Array.isArray(response.links)) throw new Error("TBC payment response is missing required fields");
  const approvalUrl = response.links.find((link) => link.rel === "approval_url" && typeof link.uri === "string")?.uri;
  if (typeof approvalUrl !== "string") throw new Error("TBC payment response has no approval URL");
  const redirect = new URL(approvalUrl);
  if (redirect.protocol !== "https:" || !(redirect.hostname === "tpay.tbcbank.ge" || redirect.hostname.endsWith(".tbcbank.ge"))) throw new Error("TBC returned an invalid checkout URL");
  return { orderId: response.payId, checkoutUrl: redirect.toString() };
}

export async function getTbcPaymentDetails(payId: string): Promise<TbcPaymentDetails> {
  if (!/^[A-Za-z0-9_-]{6,100}$/.test(payId)) throw new Error("Invalid TBC payment ID");
  const config = getConfig();
  const response = await tbcRequest<Record<string, unknown>>(config, `/v1/tpay/payments/${encodeURIComponent(payId)}`, { method: "GET" });
  const amount = Number(response.amount);
  const returnedAmount = Number(response.returnedAmount ?? 0);
  if (response.payId !== payId || typeof response.status !== "string" || typeof response.currency !== "string" || !Number.isFinite(amount) || !Number.isFinite(returnedAmount)) {
    throw new Error("TBC payment details are incomplete");
  }
  return { payId, status: response.status, currency: response.currency, amount, returnedAmount };
}