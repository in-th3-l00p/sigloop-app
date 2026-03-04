import { afterEach, describe, expect, it, vi } from "vitest"
import {
  CardApiError,
  CardClient,
  CardNetworkError,
  CardTimeoutError,
  createCardClient,
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

type Tx = {
  hash: string
  from: string
  to: string
  value: string
  direction: "in" | "out"
  status: "progress" | "success" | "error"
  chain: string
  createdAt?: number
  description?: string
}

function createFlowFetch() {
  const state = {
    card: {
      id: "card_1",
      accountId: "acc_1",
      accountAddress: "0xabc",
      name: "Trader",
      status: "active" as "active" | "paused",
      chain: "sepolia",
      createdAt: 1700000000000,
    },
    balance: {
      balance: "2.500000000000000000",
      currency: "ETH",
      chain: "sepolia",
      spent: "0.100000000000000000",
    },
    limits: {
      limit: "5.000000000000000000",
      spent: "0.100000000000000000",
      remaining: "4.900000000000000000",
      resetPeriod: "monthly",
      resetAt: 1710000000000,
    },
    policies: [
      { type: "allowlist", value: "0xdead" },
      { type: "max_single_tx", value: "1.0" },
    ],
    transactions: [] as Tx[],
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET"
    const url = new URL(typeof input === "string" ? input : input.toString())

    if (url.pathname !== "/health" && url.pathname !== "/openapi.json") {
      const secret = (init?.headers as Headers).get("x-card-secret")
      if (!secret || secret !== "sgl_test") {
        return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Invalid card secret" } }, { status: 401 })
      }
    }

    if (method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "card-service" })
    }

    if (method === "GET" && url.pathname === "/openapi.json") {
      return jsonResponse({ openapi: "3.0.0", info: { title: "card-service" } })
    }

    if (method === "GET" && url.pathname === "/v1/card/me") {
      return jsonResponse(state.card)
    }

    if (method === "GET" && url.pathname === "/v1/card/balance") {
      return jsonResponse(state.balance)
    }

    if (method === "GET" && url.pathname === "/v1/card/limits") {
      return jsonResponse(state.limits)
    }

    if (method === "GET" && url.pathname === "/v1/card/policies") {
      return jsonResponse({ policies: state.policies })
    }

    if (method === "GET" && url.pathname === "/v1/card/summary") {
      return jsonResponse({
        card: { id: state.card.id, name: state.card.name, status: state.card.status },
        balance: state.balance.balance,
        limit: state.limits.limit,
        spent: state.balance.spent,
        recentTransactions: state.transactions.slice(0, 5),
      })
    }

    if (method === "GET" && url.pathname === "/v1/card/transactions") {
      const limit = Number(url.searchParams.get("limit") ?? "50")
      return jsonResponse({ transactions: state.transactions.slice(0, Number.isNaN(limit) ? 50 : limit) })
    }

    if (method === "POST" && url.pathname === "/v1/card/transactions/quote") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { to?: string; value?: string }
      if (!body.to || !body.value) {
        return jsonResponse({ error: { code: "INVALID_REQUEST", message: "Missing transaction fields" } }, { status: 400 })
      }
      return jsonResponse({
        allowed: true,
        quote: {
          amount: body.value,
          networkFee: "0.000100000000000000",
          total: (Number(body.value) + 0.0001).toFixed(6),
        },
      })
    }

    if (method === "POST" && url.pathname === "/v1/card/transactions") {
      const idempotencyKey = (init?.headers as Headers).get("idempotency-key")
      if (!idempotencyKey) {
        return jsonResponse({ error: { code: "MISSING_IDEMPOTENCY", message: "Missing idempotency key" } }, { status: 400 })
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as { to: string; value: string; description?: string }
      const tx: Tx = {
        hash: `0x${state.transactions.length + 1}`,
        from: state.card.accountAddress,
        to: body.to,
        value: body.value,
        direction: "out",
        status: "success",
        chain: state.card.chain,
        createdAt: Date.now(),
        description: body.description,
      }
      state.transactions.unshift(tx)
      return jsonResponse({ transaction: tx, idempotentReplay: false })
    }

    if (method === "POST" && url.pathname === "/v1/card/pause") {
      state.card.status = "paused"
      return jsonResponse({ status: "paused" })
    }

    if (method === "POST" && url.pathname === "/v1/card/resume") {
      state.card.status = "active"
      return jsonResponse({ status: "active" })
    }

    return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 })
  })

  return { fetchMock, state }
}

describe("Card SDK - flow coverage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("runs a complete real flow through all public endpoints", async () => {
    const { fetchMock } = createFlowFetch()
    const beforeRequest = vi.fn()
    const afterResponse = vi.fn()

    const client = createCardClient({
      baseUrl: "http://localhost:8787///",
      cardSecret: "sgl_test",
      headers: { "x-app": "dashboard" },
      fetch: fetchMock as unknown as typeof fetch,
      beforeRequest,
      afterResponse,
      idempotencyKeyFactory: () => "sdk_fixed",
    })

    const health = await client.health()
    expect(health).toEqual({ ok: true, service: "card-service" })

    const openapi = await client.openApi()
    expect(openapi).toMatchObject({ openapi: "3.0.0" })

    const me = await client.me()
    expect(me.name).toBe("Trader")

    const balance = await client.balance()
    expect(balance.currency).toBe("ETH")

    const limits = await client.limits()
    expect(limits.remaining).toBe("4.900000000000000000")

    const policies = await client.policies()
    expect(policies.policies).toHaveLength(2)

    const quote = await client.quoteTransaction({ to: "0xdead", value: "0.2", description: "coffee" })
    expect(quote.allowed).toBe(true)

    const created = await client.createTransaction({ to: "0xdead", value: "0.2", description: "coffee" })
    expect(created.transaction.to).toBe("0xdead")

    const listed = await client.transactions({ limit: 1 })
    expect(listed.transactions).toHaveLength(1)

    const summary = await client.summary()
    expect(summary.recentTransactions[0]?.to).toBe("0xdead")

    const paused = await client.pause()
    expect(paused.status).toBe("paused")

    const resumed = await client.resume()
    expect(resumed.status).toBe("active")

    expect(beforeRequest).toHaveBeenCalled()
    expect(afterResponse).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalled()

    const firstCallUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(firstCallUrl).toBe("http://localhost:8787/health")

    const txCreateCall = fetchMock.mock.calls.find((call) => {
      const url = new URL(String(call[0]))
      return url.pathname === "/v1/card/transactions" && call[1]?.method === "POST"
    })
    expect((txCreateCall?.[1]?.headers as Headers).get("idempotency-key")).toBe("sdk_fixed")
    expect((txCreateCall?.[1]?.headers as Headers).get("x-app")).toBe("dashboard")
  })

  it("supports explicit idempotency key override", async () => {
    const { fetchMock } = createFlowFetch()
    const client = new CardClient({ baseUrl: "http://localhost:8787", cardSecret: "sgl_test", fetch: fetchMock as unknown as typeof fetch })

    await client.createTransaction(
      { to: "0xbeef", value: "1" },
      {
        idempotencyKey: "manual_key",
      },
    )

    const txCreateCall = fetchMock.mock.calls.find((call) => {
      const url = new URL(String(call[0]))
      return url.pathname === "/v1/card/transactions" && call[1]?.method === "POST"
    })
    expect((txCreateCall?.[1]?.headers as Headers).get("idempotency-key")).toBe("manual_key")
  })

  it("throws MISSING_CARD_SECRET for protected endpoints", async () => {
    const client = createCardClient({ baseUrl: "http://localhost:8787", fetch: vi.fn() as unknown as typeof fetch })
    await expect(client.me()).rejects.toMatchObject({
      name: "CardApiError",
      status: 400,
      code: "MISSING_CARD_SECRET",
    })
  })

  it("maps API errors and fallback message for non-json errors", async () => {
    const apiErrorFetch = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "CARD_LIMIT_EXCEEDED",
            message: "Card spending limit exceeded",
          },
        },
        { status: 402 },
      ),
    )

    const client = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
      fetch: apiErrorFetch as unknown as typeof fetch,
    })

    await expect(client.quoteTransaction({ to: "0xdead", value: "1" })).rejects.toMatchObject({
      status: 402,
      code: "CARD_LIMIT_EXCEEDED",
      message: "Card spending limit exceeded",
    })

    const textErrorFetch = vi.fn(async () => textResponse("bad gateway", { status: 502 }))
    const client2 = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
      fetch: textErrorFetch as unknown as typeof fetch,
    })

    await expect(client2.balance()).rejects.toMatchObject({
      status: 502,
      message: "Request failed with status 502",
    })
  })

  it("returns empty object when successful response body is non-json", async () => {
    const fetchMock = vi.fn(async () => textResponse("ok", { status: 200 }))
    const client = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
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

    const timeoutClient = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
      timeoutMs: 10,
      fetch: timeoutFetch as unknown as typeof fetch,
    })

    await expect(timeoutClient.balance()).rejects.toBeInstanceOf(CardTimeoutError)

    const networkFetch = vi.fn(async () => {
      throw new Error("socket hang up")
    })

    const networkClient = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
      fetch: networkFetch as unknown as typeof fetch,
    })

    await expect(networkClient.balance()).rejects.toMatchObject({
      name: "CardNetworkError",
      message: "socket hang up",
    })
  })

  it("validates constructor input and covers default idempotency generation branches", async () => {
    expect(() => new CardClient({ baseUrl: "" })).toThrowError("baseUrl is required")

    const withCryptoFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({
        transaction: {
          hash: "0x1",
          from: "0xabc",
          to: "0xdef",
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
    const withCryptoClient = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
      fetch: withCryptoFetch as unknown as typeof fetch,
    })
    await withCryptoClient.createTransaction({ to: "0xdef", value: "1" })
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
          hash: "0x2",
          from: "0xabc",
          to: "0xdef",
          value: "1",
          direction: "out",
          status: "success",
          chain: "sepolia",
        },
      }),
    )
    const withoutCryptoClient = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
      fetch: withoutCryptoFetch as unknown as typeof fetch,
    })
    await withoutCryptoClient.createTransaction({ to: "0xdef", value: "1" })
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

    const client = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
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

    const client = createCardClient({
      baseUrl: "http://localhost:8787/",
    })

    const value = await client.openApi()
    expect(value).toEqual({})
    expect(globalFetch).toHaveBeenCalledOnce()

    vi.stubGlobal("fetch", originalFetch)
  })

  it("maps unknown thrown values to CardNetworkError with default message", async () => {
    const fetchMock = vi.fn(async () => {
      throw "boom"
    })

    const client = createCardClient({
      baseUrl: "http://localhost:8787",
      cardSecret: "sgl_test",
      fetch: fetchMock as unknown as typeof fetch,
    })

    await expect(client.balance()).rejects.toMatchObject({
      name: "CardNetworkError",
      message: "Unknown network error",
    })
  })

  it("exposes error classes with expected fields", () => {
    const api = new CardApiError("boom", 418, "TEAPOT", { a: 1 })
    expect(api.name).toBe("CardApiError")
    expect(api.status).toBe(418)
    expect(api.code).toBe("TEAPOT")
    expect(api.details).toEqual({ a: 1 })

    const timeout = new CardTimeoutError()
    expect(timeout.name).toBe("CardTimeoutError")
    expect(timeout.message).toBe("Request timed out")

    const network = new CardNetworkError()
    expect(network.name).toBe("CardNetworkError")
    expect(network.message).toBe("Network request failed")
  })
})
