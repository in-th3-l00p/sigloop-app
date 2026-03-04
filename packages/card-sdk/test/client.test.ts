import { describe, expect, it, vi } from "vitest"
import { CardApiError, createCardClient } from "../src"

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  })
}

describe("CardClient", () => {
  it("injects card secret and fetches profile", async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      expect((init?.headers as Headers).get("x-card-secret")).toBe("sgl_test")
      return jsonResponse({
        id: "card_1",
        accountId: "acc_1",
        accountAddress: "0xabc",
        name: "Trader",
        status: "active",
        chain: "sepolia",
        createdAt: Date.now(),
      })
    })

    const client = createCardClient({ baseUrl: "http://localhost:8787", cardSecret: "sgl_test", fetch: fetchMock as any })
    const me = await client.me()
    expect(me.name).toBe("Trader")
  })

  it("auto-generates idempotency key for createTransaction", async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const key = (init?.headers as Headers).get("idempotency-key")
      expect(key).toBeTruthy()
      return jsonResponse({
        transaction: {
          hash: "0x1",
          from: "0x2",
          to: "0x3",
          value: "1",
          direction: "out",
          status: "success",
          chain: "sepolia",
        },
      })
    })

    const client = createCardClient({ baseUrl: "http://localhost:8787", cardSecret: "sgl_test", fetch: fetchMock as any })
    const res = await client.createTransaction({ to: "0x000000000000000000000000000000000000dEaD", value: "1" })
    expect(res.transaction.status).toBe("success")
  })

  it("maps API errors to CardApiError", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse(
        {
          error: {
            code: "CARD_LIMIT_EXCEEDED",
            message: "Card spending limit exceeded",
          },
        },
        { status: 402 },
      )
    })

    const client = createCardClient({ baseUrl: "http://localhost:8787", cardSecret: "sgl_test", fetch: fetchMock as any })

    await expect(client.quoteTransaction({ to: "0x000000000000000000000000000000000000dEaD", value: "1" }))
      .rejects.toMatchObject({
        status: 402,
        code: "CARD_LIMIT_EXCEEDED",
      })
  })

  it("supports public endpoints without secret", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true, service: "card-service" }))
    const client = createCardClient({ baseUrl: "http://localhost:8787", fetch: fetchMock as any })
    const health = await client.health()
    expect(health.ok).toBe(true)
  })
})
