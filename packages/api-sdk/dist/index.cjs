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
  ApiApiError: () => ApiApiError,
  ApiClient: () => ApiClient,
  ApiNetworkError: () => ApiNetworkError,
  ApiTimeoutError: () => ApiTimeoutError,
  createApiClient: () => createApiClient
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var ApiApiError = class extends Error {
  status;
  code;
  details;
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
};
var ApiTimeoutError = class extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "ApiTimeoutError";
  }
};
var ApiNetworkError = class extends Error {
  constructor(message = "Network request failed") {
    super(message);
    this.name = "ApiNetworkError";
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
var ApiClient = class {
  baseUrl;
  apiKey;
  timeoutMs;
  fetchImpl;
  headers;
  idempotencyKeyFactory;
  beforeRequest;
  afterResponse;
  constructor(options) {
    if (!options.baseUrl) throw new Error("baseUrl is required");
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 15e3;
    if (options.fetch) {
      this.fetchImpl = options.fetch.bind(globalThis);
    } else {
      this.fetchImpl = globalThis.fetch.bind(globalThis);
    }
    this.headers = options.headers;
    this.idempotencyKeyFactory = options.idempotencyKeyFactory ?? createDefaultIdempotencyKey;
    this.beforeRequest = options.beforeRequest;
    this.afterResponse = options.afterResponse;
  }
  async request(method, path, options) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? this.timeoutMs);
    const headers = mergeHeaders(this.headers, options?.headers);
    if (options?.body !== void 0) {
      headers.set("content-type", "application/json");
    }
    if (options?.requireApiKey !== false) {
      if (!this.apiKey) {
        clearTimeout(timeout);
        throw new ApiApiError("apiKey is required for this endpoint", 400, "MISSING_API_KEY");
      }
      headers.set("x-api-key", this.apiKey);
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
        throw new ApiApiError(
          payload?.error?.message ?? `Request failed with status ${response.status}`,
          response.status,
          payload?.error?.code,
          json
        );
      }
      return json ?? {};
    } catch (error) {
      if (error instanceof ApiApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiTimeoutError();
      }
      throw new ApiNetworkError(error instanceof Error ? error.message : "Unknown network error");
    } finally {
      clearTimeout(timeout);
    }
  }
  health() {
    return this.request("GET", "/health", { requireApiKey: false });
  }
  openApi() {
    return this.request("GET", "/openapi.json", { requireApiKey: false });
  }
  me() {
    return this.request("GET", "/v1/me");
  }
  listApiKeys() {
    return this.request("GET", "/v1/api-keys");
  }
  createApiKey(input) {
    return this.request("POST", "/v1/api-keys", { body: input });
  }
  updateApiKeyPolicy(apiKeyId, input) {
    return this.request("PATCH", `/v1/api-keys/${apiKeyId}`, { body: input });
  }
  revokeApiKey(apiKeyId) {
    return this.request("DELETE", `/v1/api-keys/${apiKeyId}`);
  }
  listAccounts() {
    return this.request("GET", "/v1/accounts");
  }
  createAccount(input) {
    return this.request("POST", "/v1/accounts", { body: input });
  }
  provisionAccount(input) {
    return this.request("POST", "/v1/accounts/provision", { body: input });
  }
  getAccount(accountId) {
    return this.request("GET", `/v1/accounts/${accountId}`);
  }
  updateAccount(accountId, input) {
    return this.request("PATCH", `/v1/accounts/${accountId}`, { body: input });
  }
  removeAccount(accountId) {
    return this.request("DELETE", `/v1/accounts/${accountId}`);
  }
  listAccountTransactions(accountId) {
    return this.request("GET", `/v1/accounts/${accountId}/transactions`);
  }
  sendTransaction(accountId, input, options = {}) {
    const idempotencyKey = options.idempotencyKey ?? this.idempotencyKeyFactory();
    return this.request("POST", `/v1/accounts/${accountId}/transactions`, {
      body: input,
      headers: { "idempotency-key": idempotencyKey }
    });
  }
  listAccountCards(accountId) {
    return this.request("GET", `/v1/accounts/${accountId}/cards`);
  }
  createCard(input) {
    return this.request("POST", "/v1/cards", { body: input });
  }
  getCard(cardId) {
    return this.request("GET", `/v1/cards/${cardId}`);
  }
  updateCard(cardId, input) {
    return this.request("PATCH", `/v1/cards/${cardId}`, { body: input });
  }
  removeCard(cardId) {
    return this.request("DELETE", `/v1/cards/${cardId}`);
  }
  listCardTransactions(cardId) {
    return this.request("GET", `/v1/cards/${cardId}/transactions`);
  }
  listCardIntegrations(cardId) {
    return this.request("GET", `/v1/cards/${cardId}/integrations`);
  }
  createIntegration(input) {
    return this.request("POST", "/v1/integrations", { body: input });
  }
  updateIntegration(integrationId, input) {
    return this.request("PATCH", `/v1/integrations/${integrationId}`, { body: input });
  }
  removeIntegration(integrationId) {
    return this.request("DELETE", `/v1/integrations/${integrationId}`);
  }
  listContacts() {
    return this.request("GET", "/v1/contacts");
  }
  createContact(input) {
    return this.request("POST", "/v1/contacts", { body: input });
  }
  removeContact(contactId) {
    return this.request("DELETE", `/v1/contacts/${contactId}`);
  }
};
function createApiClient(options) {
  return new ApiClient(options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiApiError,
  ApiClient,
  ApiNetworkError,
  ApiTimeoutError,
  createApiClient
});
