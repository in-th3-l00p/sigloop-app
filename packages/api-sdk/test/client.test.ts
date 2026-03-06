import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ApiApiError,
  ApiClient,
  ApiNetworkError,
  ApiTimeoutError,
  createApiClient,
} from "../src"

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  })
}

function textResponse(text: string, init: ResponseInit = {}) {
  return new Response(text, {
    headers: { "content-type": "text/plain" },
    ...init,
  })
}

type State = {
  me: {
    ok: true
    apiKeyId: string
    userId: string
    keyName: string
    keyPrefix: string
    scopes: string[]
    ipAllowlist: string[]
    rateLimitPerMinute: number
  }
  apiKeys: Array<{
    id: string
    name: string
    keyPrefix: string
    scopes: string[]
    status: "active" | "paused" | "revoked"
  }>
  accounts: Array<{
    _id: string
    name: string
    chain: string
    icon: string
    address: string
    createdAt: number
  }>
  contacts: Array<{ _id: string; name: string; address: string }>
  cards: Array<{
    _id: string
    accountId: string
    name: string
    secret: string
    spent: string
    status: string
    createdAt: number
    limit?: string
  }>
  integrations: Array<{
    _id: string
    cardId: string
    presetId: string
    type: string
    platform: string
    name: string
    description: string
    status: string
    schemaVersion: number
    config?: Record<string, string>
    createdAt: number
    updatedAt: number
  }>
  txs: Array<{
    _id: string
    accountId: string
    hash: string
    from: string
    to: string
    value: string
    direction: string
    status: "progress" | "success" | "error"
    chain: string
    createdAt: number
  }>
}

function createFlowFetch() {
  const state: State = {
    me: {
      ok: true,
      apiKeyId: "key_1",
      userId: "user_1",
      keyName: "Main",
      keyPrefix: "sgapi_123",
      scopes: ["admin"],
      ipAllowlist: [],
      rateLimitPerMinute: 120,
    },
    apiKeys: [{ id: "key_1", name: "Main", keyPrefix: "sgapi_123", scopes: ["admin"], status: "active" }],
    accounts: [
      {
        _id: "acc_1",
        name: "Treasury",
        chain: "sepolia",
        icon: "wallet",
        address: "0x0000000000000000000000000000000000000001",
        createdAt: 1700000000000,
      },
    ],
    contacts: [{ _id: "ct_1", name: "Vendor", address: "0x0000000000000000000000000000000000000002" }],
    cards: [],
    integrations: [],
    txs: [],
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET"
    const url = new URL(typeof input === "string" ? input : input.toString())

    if (url.pathname !== "/health" && url.pathname !== "/openapi.json") {
      const apiKey = (init?.headers as Headers).get("x-api-key")
      if (!apiKey || apiKey !== "sgapi_test") {
        return jsonResponse({ error: { code: "MISSING_API_KEY", message: "Missing x-api-key header" } }, { status: 401 })
      }
    }

    if (method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "api-service" })
    }

    if (method === "GET" && url.pathname === "/openapi.json") {
      return jsonResponse({ openapi: "3.1.0", info: { title: "Sigloop API Service" } })
    }

    if (method === "GET" && url.pathname === "/v1/me") {
      return jsonResponse(state.me)
    }

    if (method === "GET" && url.pathname === "/v1/api-keys") {
      return jsonResponse({ apiKeys: state.apiKeys })
    }

    if (method === "POST" && url.pathname === "/v1/api-keys") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { name: string; scopes?: string[] }
      const key = {
        id: `key_${state.apiKeys.length + 1}`,
        name: body.name,
        keyPrefix: `sgapi_${state.apiKeys.length + 100}`,
        scopes: body.scopes ?? ["read", "write", "tx", "admin"],
        status: "active" as const,
        apiKey: "sgapi_secret",
      }
      state.apiKeys.unshift({ id: key.id, name: key.name, keyPrefix: key.keyPrefix, scopes: key.scopes, status: key.status })
      return jsonResponse({ apiKey: key }, { status: 201 })
    }

    if (method === "PATCH" && url.pathname.startsWith("/v1/api-keys/")) {
      const id = url.pathname.split("/")[3]
      const body = JSON.parse(String(init?.body ?? "{}")) as { name?: string }
      const current = state.apiKeys.find((row) => row.id === id)
      if (!current) return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
      if (body.name) current.name = body.name
      return jsonResponse({ apiKey: current })
    }

    if (method === "DELETE" && url.pathname.startsWith("/v1/api-keys/")) {
      const id = url.pathname.split("/")[3]
      const current = state.apiKeys.find((row) => row.id === id)
      if (current) current.status = "revoked"
      return jsonResponse({ ok: true })
    }

    if (method === "GET" && url.pathname === "/v1/accounts") {
      return jsonResponse({ accounts: state.accounts })
    }

    if (method === "POST" && url.pathname === "/v1/accounts") {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        name: string
        chain: string
        icon: string
        address: string
      }
      const account = {
        _id: `acc_${state.accounts.length + 1}`,
        name: body.name,
        chain: body.chain,
        icon: body.icon,
        address: body.address,
        createdAt: Date.now(),
      }
      state.accounts.unshift(account)
      return jsonResponse({ account }, { status: 201 })
    }

    if (method === "POST" && url.pathname === "/v1/accounts/provision") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { name: string; chain: string; icon?: string }
      const account = {
        _id: `acc_${state.accounts.length + 1}`,
        name: body.name,
        chain: body.chain,
        icon: body.icon ?? "wallet",
        address: "0x0000000000000000000000000000000000000003",
        createdAt: Date.now(),
      }
      state.accounts.unshift(account)
      return jsonResponse({ account }, { status: 201 })
    }

    if (method === "GET" && /^\/v1\/accounts\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      const account = state.accounts.find((row) => row._id === id)
      if (!account) return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
      return jsonResponse({ account })
    }

    if (method === "PATCH" && /^\/v1\/accounts\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      const account = state.accounts.find((row) => row._id === id)
      const body = JSON.parse(String(init?.body ?? "{}")) as { name?: string; icon?: string }
      if (!account) return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
      if (body.name !== undefined) account.name = body.name
      if (body.icon !== undefined) account.icon = body.icon
      return jsonResponse({ account })
    }

    if (method === "DELETE" && /^\/v1\/accounts\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      state.accounts = state.accounts.filter((row) => row._id !== id)
      return jsonResponse({ ok: true })
    }

    if (method === "GET" && /^\/v1\/accounts\/[^/]+\/transactions$/.test(url.pathname)) {
      const accountId = url.pathname.split("/")[3]
      return jsonResponse({ transactions: state.txs.filter((tx) => tx.accountId === accountId) })
    }

    if (method === "POST" && /^\/v1\/accounts\/[^/]+\/transactions$/.test(url.pathname)) {
      const accountId = url.pathname.split("/")[3]
      const idempotencyKey = (init?.headers as Headers).get("idempotency-key")
      if (!idempotencyKey) {
        return jsonResponse({ error: { code: "MISSING_IDEMPOTENCY_KEY", message: "Missing idempotency-key header" } }, { status: 400 })
      }

      const body = JSON.parse(String(init?.body ?? "{}")) as { to: string; value: string }
      const account = state.accounts.find((row) => row._id === accountId)
      const tx = {
        _id: `tx_${state.txs.length + 1}`,
        accountId,
        hash: `0x${state.txs.length + 1}`,
        from: account?.address ?? "0x0000000000000000000000000000000000000001",
        to: body.to,
        value: body.value,
        direction: "out",
        status: "success" as const,
        chain: account?.chain ?? "sepolia",
        createdAt: Date.now(),
      }
      state.txs.unshift(tx)
      return jsonResponse({ transaction: tx }, { status: 201 })
    }

    if (method === "GET" && /^\/v1\/accounts\/[^/]+\/cards$/.test(url.pathname)) {
      const accountId = url.pathname.split("/")[3]
      return jsonResponse({ cards: state.cards.filter((card) => card.accountId === accountId) })
    }

    if (method === "POST" && url.pathname === "/v1/cards") {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        accountId: string
        name: string
        secret: string
        limit?: string
      }
      const card = {
        _id: `card_${state.cards.length + 1}`,
        accountId: body.accountId,
        name: body.name,
        secret: body.secret,
        spent: "0",
        status: "active",
        limit: body.limit,
        createdAt: Date.now(),
      }
      state.cards.unshift(card)
      return jsonResponse({ card }, { status: 201 })
    }

    if (method === "GET" && /^\/v1\/cards\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      const card = state.cards.find((row) => row._id === id)
      if (!card) return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
      return jsonResponse({ card })
    }

    if (method === "PATCH" && /^\/v1\/cards\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      const card = state.cards.find((row) => row._id === id)
      const body = JSON.parse(String(init?.body ?? "{}")) as { name?: string; limit?: string }
      if (!card) return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
      if (body.name !== undefined) card.name = body.name
      if (body.limit !== undefined) card.limit = body.limit
      return jsonResponse({ card })
    }

    if (method === "DELETE" && /^\/v1\/cards\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      state.cards = state.cards.filter((row) => row._id !== id)
      return jsonResponse({ ok: true })
    }

    if (method === "GET" && /^\/v1\/cards\/[^/]+\/transactions$/.test(url.pathname)) {
      return jsonResponse({ transactions: [] })
    }

    if (method === "GET" && /^\/v1\/cards\/[^/]+\/integrations$/.test(url.pathname)) {
      const cardId = url.pathname.split("/")[3]
      return jsonResponse({ integrations: state.integrations.filter((integration) => integration.cardId === cardId) })
    }

    if (method === "POST" && url.pathname === "/v1/integrations") {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        cardId: string
        presetId: string
        type: string
        platform: string
        name: string
        description: string
        schemaVersion: number
        config?: Record<string, string>
      }
      const integration = {
        _id: `int_${state.integrations.length + 1}`,
        cardId: body.cardId,
        presetId: body.presetId,
        type: body.type,
        platform: body.platform,
        name: body.name,
        description: body.description,
        status: "configured",
        schemaVersion: body.schemaVersion,
        config: body.config,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      state.integrations.unshift(integration)
      return jsonResponse({ integration }, { status: 201 })
    }

    if (method === "PATCH" && /^\/v1\/integrations\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      const current = state.integrations.find((row) => row._id === id)
      const body = JSON.parse(String(init?.body ?? "{}")) as { config?: Record<string, string> }
      if (!current) return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
      current.config = { ...(current.config ?? {}), ...(body.config ?? {}) }
      current.updatedAt = Date.now()
      return jsonResponse({ integration: current })
    }

    if (method === "DELETE" && /^\/v1\/integrations\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      state.integrations = state.integrations.filter((row) => row._id !== id)
      return jsonResponse({ ok: true })
    }

    if (method === "GET" && url.pathname === "/v1/contacts") {
      return jsonResponse({ contacts: state.contacts })
    }

    if (method === "POST" && url.pathname === "/v1/contacts") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { name: string; address: string }
      const contact = {
        _id: `ct_${state.contacts.length + 1}`,
        name: body.name,
        address: body.address,
      }
      state.contacts.push(contact)
      return jsonResponse({ contact }, { status: 201 })
    }

    if (method === "DELETE" && /^\/v1\/contacts\/[^/]+$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3]
      state.contacts = state.contacts.filter((row) => row._id !== id)
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
  })

  return { fetchMock, state }
}

describe("API SDK - flow coverage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("runs a complete real flow through all public endpoints", async () => {
    const { fetchMock } = createFlowFetch()
    const beforeRequest = vi.fn()
    const afterResponse = vi.fn()

    const client = createApiClient({
      baseUrl: "http://localhost:8788///",
      apiKey: "sgapi_test",
      headers: { "x-app": "dashboard" },
      fetch: fetchMock as unknown as typeof fetch,
      beforeRequest,
      afterResponse,
      idempotencyKeyFactory: () => "sdk_fixed",
    })

    const health = await client.health()
    expect(health).toEqual({ ok: true, service: "api-service" })

    const openapi = await client.openApi()
    expect(openapi).toMatchObject({ openapi: "3.1.0" })

    const me = await client.me()
    expect(me.userId).toBe("user_1")

    const keys = await client.listApiKeys()
    expect(keys.apiKeys).toHaveLength(1)

    const createdKey = await client.createApiKey({ name: "Worker", scopes: ["read", "write"] })
    expect(createdKey.apiKey.name).toBe("Worker")

    const updatedKey = await client.updateApiKeyPolicy(createdKey.apiKey.id!, { name: "Worker Updated" })
    expect(updatedKey.apiKey.name).toBe("Worker Updated")

    const revoked = await client.revokeApiKey(createdKey.apiKey.id!)
    expect(revoked.ok).toBe(true)

    const accounts = await client.listAccounts()
    expect(accounts.accounts).toHaveLength(1)

    const created = await client.createAccount({
      name: "Ops",
      chain: "sepolia",
      icon: "wallet",
      address: "0x0000000000000000000000000000000000000004",
      privateKey: "0x1234",
    })
    expect(created.account.name).toBe("Ops")

    const provisioned = await client.provisionAccount({ name: "Auto", chain: "sepolia" })
    expect(provisioned.account.address).toBe("0x0000000000000000000000000000000000000003")

    const account = await client.getAccount(created.account._id)
    expect(account.account._id).toBe(created.account._id)

    const patchedAccount = await client.updateAccount(created.account._id, { name: "Ops Updated" })
    expect(patchedAccount.account.name).toBe("Ops Updated")

    const sent = await client.sendTransaction(created.account._id, {
      to: "0x0000000000000000000000000000000000000002",
      value: "1",
    })
    expect(sent.transaction.status).toBe("success")

    const accountTxs = await client.listAccountTransactions(created.account._id)
    expect(accountTxs.transactions).toHaveLength(1)

    const createdCard = await client.createCard({
      accountId: created.account._id,
      name: "Ops card",
      secret: "sgl_123",
      limit: "100",
    })
    expect(createdCard.card.accountId).toBe(created.account._id)

    const fetchedCard = await client.getCard(createdCard.card._id)
    expect(fetchedCard.card._id).toBe(createdCard.card._id)

    const patchedCard = await client.updateCard(createdCard.card._id, { name: "Ops card updated" })
    expect(patchedCard.card.name).toBe("Ops card updated")

    const accountCards = await client.listAccountCards(created.account._id)
    expect(accountCards.cards).toHaveLength(1)

    const cardTxs = await client.listCardTransactions(createdCard.card._id)
    expect(cardTxs.transactions).toHaveLength(0)

    const integration = await client.createIntegration({
      cardId: createdCard.card._id,
      presetId: "preset_1",
      type: "automation",
      platform: "slack",
      name: "Slack alert",
      description: "Notify on spend",
      schemaVersion: 1,
      config: { language: "ts" },
    })
    expect(integration.integration.cardId).toBe(createdCard.card._id)

    const patchedIntegration = await client.updateIntegration(integration.integration._id, {
      config: { endpointBaseUrl: "https://api.example.com" },
    })
    expect(patchedIntegration.integration.config?.endpointBaseUrl).toBe("https://api.example.com")

    const cardIntegrations = await client.listCardIntegrations(createdCard.card._id)
    expect(cardIntegrations.integrations).toHaveLength(1)

    const removedIntegration = await client.removeIntegration(integration.integration._id)
    expect(removedIntegration.ok).toBe(true)

    const contacts = await client.listContacts()
    expect(contacts.contacts).toHaveLength(1)

    const createdContact = await client.createContact({
      name: "Merchant",
      address: "0x0000000000000000000000000000000000000005",
    })
    expect(createdContact.contact.name).toBe("Merchant")

    const removedContact = await client.removeContact(createdContact.contact._id)
    expect(removedContact.ok).toBe(true)

    const removedCard = await client.removeCard(createdCard.card._id)
    expect(removedCard.ok).toBe(true)

    const removedAccount = await client.removeAccount(created.account._id)
    expect(removedAccount.ok).toBe(true)

    expect(beforeRequest).toHaveBeenCalled()
    expect(afterResponse).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalled()

    const firstCallUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(firstCallUrl).toBe("http://localhost:8788/health")

    const txCreateCall = fetchMock.mock.calls.find((call) => {
      const url = new URL(String(call[0]))
      return /^\/v1\/accounts\/[^/]+\/transactions$/.test(url.pathname) && call[1]?.method === "POST"
    })
    expect((txCreateCall?.[1]?.headers as Headers).get("idempotency-key")).toBe("sdk_fixed")
    expect((txCreateCall?.[1]?.headers as Headers).get("x-app")).toBe("dashboard")
  })

  it("supports explicit idempotency key override", async () => {
    const { fetchMock } = createFlowFetch()
    const client = new ApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: fetchMock as unknown as typeof fetch,
    })

    await client.sendTransaction("acc_1", {
      to: "0x0000000000000000000000000000000000000002",
      value: "1",
    }, {
      idempotencyKey: "manual_key",
    })

    const txCreateCall = fetchMock.mock.calls.find((call) => {
      const url = new URL(String(call[0]))
      return /^\/v1\/accounts\/[^/]+\/transactions$/.test(url.pathname) && call[1]?.method === "POST"
    })

    expect((txCreateCall?.[1]?.headers as Headers).get("idempotency-key")).toBe("manual_key")
  })

  it("throws MISSING_API_KEY for protected endpoints", async () => {
    const client = createApiClient({ baseUrl: "http://localhost:8788", fetch: vi.fn() as unknown as typeof fetch })
    await expect(client.me()).rejects.toMatchObject({
      name: "ApiApiError",
      status: 400,
      code: "MISSING_API_KEY",
    })
  })

  it("maps API errors and fallback message for non-json errors", async () => {
    const apiErrorFetch = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "INSUFFICIENT_SCOPE",
            message: "API key does not have required scope",
          },
        },
        { status: 403 },
      ),
    )

    const client = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: apiErrorFetch as unknown as typeof fetch,
    })

    await expect(client.listAccounts()).rejects.toMatchObject({
      status: 403,
      code: "INSUFFICIENT_SCOPE",
      message: "API key does not have required scope",
    })

    const textErrorFetch = vi.fn(async () => textResponse("bad gateway", { status: 502 }))
    const client2 = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: textErrorFetch as unknown as typeof fetch,
    })

    await expect(client2.listAccounts()).rejects.toMatchObject({
      status: 502,
      message: "Request failed with status 502",
    })
  })

  it("returns empty object when successful response body is non-json", async () => {
    const fetchMock = vi.fn(async () => textResponse("ok", { status: 200 }))
    const client = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: fetchMock as unknown as typeof fetch,
    })

    const result = await client.openApi()
    expect(result).toEqual({})
  })

  it("maps timeout and network errors", async () => {
    const timeoutFetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"))
          })
        }),
    )

    const timeoutClient = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      timeoutMs: 10,
      fetch: timeoutFetch as unknown as typeof fetch,
    })

    await expect(timeoutClient.listAccounts()).rejects.toBeInstanceOf(ApiTimeoutError)

    const networkFetch = vi.fn(async () => {
      throw new Error("socket hang up")
    })

    const networkClient = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: networkFetch as unknown as typeof fetch,
    })

    await expect(networkClient.listAccounts()).rejects.toMatchObject({
      name: "ApiNetworkError",
      message: "socket hang up",
    })
  })

  it("validates constructor input and covers default idempotency generation branches", async () => {
    expect(() => new ApiClient({ baseUrl: "" })).toThrowError("baseUrl is required")

    const withCryptoFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({
        transaction: {
          _id: "tx_1",
          hash: "0x1",
          from: "0x0000000000000000000000000000000000000001",
          to: "0x0000000000000000000000000000000000000002",
          value: "1",
          direction: "out",
          status: "success",
          chain: "sepolia",
        },
      }),
    )
    const randomUUIDSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("00000000-0000-0000-0000-000000000001")
    const withCryptoClient = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: withCryptoFetch as unknown as typeof fetch,
    })
    await withCryptoClient.sendTransaction("acc_1", {
      to: "0x0000000000000000000000000000000000000002",
      value: "1",
    })
    const withCryptoInit = withCryptoFetch.mock.calls[0]?.[1]
    expect(withCryptoInit).toBeDefined()
    const withCryptoHeaders = withCryptoInit!.headers as Headers
    expect(withCryptoHeaders.get("idempotency-key")).toBe("sdk_00000000-0000-0000-0000-000000000001")
    randomUUIDSpy.mockRestore()

    const originalCrypto = globalThis.crypto
    vi.stubGlobal("crypto", undefined)
    const withoutCryptoFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({
        transaction: {
          _id: "tx_2",
          hash: "0x2",
          from: "0x0000000000000000000000000000000000000001",
          to: "0x0000000000000000000000000000000000000002",
          value: "1",
          direction: "out",
          status: "success",
          chain: "sepolia",
        },
      }),
    )
    const withoutCryptoClient = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: withoutCryptoFetch as unknown as typeof fetch,
    })
    await withoutCryptoClient.sendTransaction("acc_1", {
      to: "0x0000000000000000000000000000000000000002",
      value: "1",
    })
    const withoutCryptoInit = withoutCryptoFetch.mock.calls[0]?.[1]
    expect(withoutCryptoInit).toBeDefined()
    const withoutCryptoHeaders = withoutCryptoInit!.headers as Headers
    expect(withoutCryptoHeaders.get("idempotency-key")).toMatch(/^sdk_\d+_/)
    vi.stubGlobal("crypto", originalCrypto)
  })

  it("handles malformed json response and ignores undefined custom headers", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Headers
      expect(headers.has("x-maybe")).toBe(false)
      return new Response("not-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    })

    const client = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      headers: { "x-maybe": undefined as unknown as string },
      fetch: fetchMock as unknown as typeof fetch,
    })

    const value = await client.openApi()
    expect(value).toEqual({})
  })

  it("handles missing content-type and uses global fetch when no fetch option is provided", async () => {
    const originalFetch = globalThis.fetch
    const globalFetch = vi.fn(async () => new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", globalFetch)

    const client = createApiClient({
      baseUrl: "http://localhost:8788/",
      apiKey: "sgapi_test",
    })

    const value = await client.openApi()
    expect(value).toEqual({})
    expect(globalFetch).toHaveBeenCalledOnce()

    vi.stubGlobal("fetch", originalFetch)
  })

  it("maps unknown thrown values to ApiNetworkError with default message", async () => {
    const fetchMock = vi.fn(async () => {
      throw "boom"
    })

    const client = createApiClient({
      baseUrl: "http://localhost:8788",
      apiKey: "sgapi_test",
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(client.listAccounts()).rejects.toMatchObject({
      name: "ApiNetworkError",
      message: "Unknown network error",
    })
  })

  it("exposes error classes with expected fields", () => {
    const api = new ApiApiError("boom", 418, "TEAPOT", { a: 1 })
    expect(api.name).toBe("ApiApiError")
    expect(api.status).toBe(418)
    expect(api.code).toBe("TEAPOT")
    expect(api.details).toEqual({ a: 1 })

    const timeout = new ApiTimeoutError()
    expect(timeout.name).toBe("ApiTimeoutError")
    expect(timeout.message).toBe("Request timed out")

    const network = new ApiNetworkError()
    expect(network.name).toBe("ApiNetworkError")
    expect(network.message).toBe("Network request failed")
  })
})
