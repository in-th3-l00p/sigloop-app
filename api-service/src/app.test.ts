import { describe, expect, it, vi } from "vitest"
import { createApp } from "./app.js"
import type { ApiStore } from "./types.js"

function createMockStore(overrides: Partial<ApiStore> = {}): ApiStore {
  const base: ApiStore = {
    authorizeApiRequest: vi.fn(async () => ({
      ok: true as const,
      apiKeyId: "key_1",
      userId: "user_1",
      keyName: "Main",
      keyPrefix: "sgapi_123",
      scopes: ["admin"],
      ipAllowlist: [],
      rateLimitPerMinute: 120,
    })),
    logRequest: vi.fn(async () => {}),

    listApiKeys: vi.fn(async () => []),
    createApiKey: vi.fn(async () => ({ id: "k1", apiKey: "sgapi_value" })),
    updateApiKeyPolicy: vi.fn(async () => ({})),
    revokeApiKey: vi.fn(async () => ({ ok: true })),

    listAccounts: vi.fn(async () => []),
    getAccount: vi.fn(async () => ({})),
    createAccount: vi.fn(async () => ({})),
    updateAccount: vi.fn(async () => ({})),
    removeAccount: vi.fn(async () => ({ ok: true })),
    getAccountWithPrivateKey: vi.fn(async () => ({
      _id: "acc_1",
      address: "0x0000000000000000000000000000000000000001",
      privateKey: "0x1111111111111111111111111111111111111111111111111111111111111111",
      chain: "sepolia",
    })),

    listContacts: vi.fn(async () => []),
    createContact: vi.fn(async () => ({})),
    removeContact: vi.fn(async () => ({ ok: true })),

    listTransactionsByAccount: vi.fn(async () => []),
    createTransaction: vi.fn(async () => ({ _id: "tx_1", status: "progress", hash: "0xabc" })),
    updateTransactionStatus: vi.fn(async () => ({})),

    listCardsByAccount: vi.fn(async () => []),
    getCard: vi.fn(async () => ({})),
    createCard: vi.fn(async () => ({})),
    updateCard: vi.fn(async () => ({})),
    removeCard: vi.fn(async () => ({ ok: true })),
    listCardTransactions: vi.fn(async () => []),

    listIntegrationsByCard: vi.fn(async () => []),
    createIntegration: vi.fn(async () => ({})),
    updateIntegrationConfig: vi.fn(async () => ({})),
    removeIntegration: vi.fn(async () => ({ ok: true })),
  }

  return {
    ...base,
    ...overrides,
  }
}

describe("api-service app", () => {
  it("returns 401 when x-api-key is missing", async () => {
    const app = createApp(createMockStore())
    const response = await app.request("/v1/me")
    expect(response.status).toBe(401)
  })

  it("returns 403 for insufficient scope", async () => {
    const store = createMockStore({
      authorizeApiRequest: vi.fn(async () => ({ ok: false as const, reason: "INSUFFICIENT_SCOPE" as const })),
    })
    const app = createApp(store)

    const response = await app.request("/v1/accounts", {
      headers: { "x-api-key": "sgapi_test" },
    })
    expect(response.status).toBe(403)
  })

  it("returns 429 for rate-limited keys", async () => {
    const store = createMockStore({
      authorizeApiRequest: vi.fn(async () => ({ ok: false as const, reason: "RATE_LIMITED" as const })),
    })
    const app = createApp(store)

    const response = await app.request("/v1/accounts", {
      headers: { "x-api-key": "sgapi_test" },
    })
    expect(response.status).toBe(429)
  })

  it("supports admin key creation route", async () => {
    const store = createMockStore()
    const app = createApp(store)

    const response = await app.request("/v1/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "sgapi_test" },
      body: JSON.stringify({
        name: "Backend",
        scopes: ["read", "write"],
        rateLimitPerMinute: 60,
      }),
    })

    expect(response.status).toBe(201)
    expect(store.createApiKey).toHaveBeenCalledOnce()
    expect(store.logRequest).toHaveBeenCalled()
  })

  it("requires idempotency key for tx route", async () => {
    const app = createApp(createMockStore())

    const response = await app.request("/v1/accounts/acc_1/transactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "sgapi_test" },
      body: JSON.stringify({
        to: "0x0000000000000000000000000000000000000001",
        value: "1",
      }),
    })

    expect(response.status).toBe(400)
  })
})
