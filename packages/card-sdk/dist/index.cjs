"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CardApiError: () => CardApiError,
  CardClient: () => CardClient,
  CardNetworkError: () => CardNetworkError,
  CardTimeoutError: () => CardTimeoutError,
  createCardClient: () => createCardClient
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var CardApiError = class extends Error {
  status;
  code;
  details;
  constructor(message, status, code, details) {
    super(message);
    this.name = "CardApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
};
var CardTimeoutError = class extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "CardTimeoutError";
  }
};
var CardNetworkError = class extends Error {
  constructor(message = "Network request failed") {
    super(message);
    this.name = "CardNetworkError";
  }
};

// src/client.ts
function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}
function createDefaultIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `sdk_${crypto.randomUUID()}`;
  }
  return `sdk_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
function mergeHeaders(...sets) {
  const headers = new Headers();
  for (const set of sets) {
    if (!set) continue;
    for (const [k, v] of Object.entries(set)) {
      if (v !== void 0) headers.set(k, v);
    }
  }
  return headers;
}
async function readJsonSafe(response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return void 0;
  }
  try {
    return await response.json();
  } catch {
    return void 0;
  }
}
var CardClient = class {
  baseUrl;
  cardSecret;
  timeoutMs;
  fetchImpl;
  headers;
  idempotencyKeyFactory;
  beforeRequest;
  afterResponse;
  constructor(options) {
    if (!options.baseUrl) throw new Error("baseUrl is required");
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.cardSecret = options.cardSecret;
    this.timeoutMs = options.timeoutMs ?? 15e3;
    this.fetchImpl = options.fetch ?? fetch;
    this.headers = options.headers;
    this.idempotencyKeyFactory = options.idempotencyKeyFactory ?? createDefaultIdempotencyKey;
    this.beforeRequest = options.beforeRequest;
    this.afterResponse = options.afterResponse;
  }
  async request(method, path, options) {
    const query = options?.query ? `?${new URLSearchParams(
      Object.entries(options.query).filter(([, value]) => value !== void 0).map(([key, value]) => [key, String(value)])
    )}` : "";
    const url = `${this.baseUrl}${path}${query}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? this.timeoutMs);
    const headers = mergeHeaders(this.headers, options?.headers);
    if (options?.body !== void 0) {
      headers.set("content-type", "application/json");
    }
    if (options?.requireSecret !== false) {
      if (!this.cardSecret) {
        clearTimeout(timeout);
        throw new CardApiError("cardSecret is required for this endpoint", 400, "MISSING_CARD_SECRET");
      }
      headers.set("x-card-secret", this.cardSecret);
    }
    const context = {
      path,
      method,
      url,
      headers
    };
    try {
      await this.beforeRequest?.(context);
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body: options?.body !== void 0 ? JSON.stringify(options.body) : void 0,
        signal: controller.signal
      });
      await this.afterResponse?.(context, response);
      const json = await readJsonSafe(response);
      if (!response.ok) {
        const payload = json;
        throw new CardApiError(
          payload?.error?.message ?? `Request failed with status ${response.status}`,
          response.status,
          payload?.error?.code,
          json
        );
      }
      return json ?? {};
    } catch (error) {
      if (error instanceof CardApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new CardTimeoutError();
      }
      throw new CardNetworkError(error instanceof Error ? error.message : "Unknown network error");
    } finally {
      clearTimeout(timeout);
    }
  }
  health() {
    return this.request("GET", "/health", { requireSecret: false });
  }
  openApi() {
    return this.request("GET", "/openapi.json", { requireSecret: false });
  }
  me() {
    return this.request("GET", "/v1/card/me");
  }
  balance() {
    return this.request("GET", "/v1/card/balance");
  }
  limits() {
    return this.request("GET", "/v1/card/limits");
  }
  policies() {
    return this.request("GET", "/v1/card/policies");
  }
  summary() {
    return this.request("GET", "/v1/card/summary");
  }
  transactions(query = {}) {
    return this.request("GET", "/v1/card/transactions", {
      query: { limit: query.limit }
    });
  }
  quoteTransaction(input) {
    return this.request("POST", "/v1/card/transactions/quote", {
      body: input
    });
  }
  createTransaction(input, options = {}) {
    const idempotencyKey = options.idempotencyKey ?? this.idempotencyKeyFactory();
    return this.request("POST", "/v1/card/transactions", {
      body: input,
      headers: { "idempotency-key": idempotencyKey }
    });
  }
  pause() {
    return this.request("POST", "/v1/card/pause");
  }
  resume() {
    return this.request("POST", "/v1/card/resume");
  }
};
function createCardClient(options) {
  return new CardClient(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CardApiError,
  CardClient,
  CardNetworkError,
  CardTimeoutError,
  createCardClient
});
