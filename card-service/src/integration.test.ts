import { afterAll, beforeAll, describe, expect, it } from "vitest"

const CARD_SERVICE_BASE_URL = process.env.CARD_SERVICE_BASE_URL ?? "http://localhost:8787"
const CARD_SECRET = process.env.CARD_SERVICE_TEST_SECRET ?? "sgl_81edeecc-4f5d-44a5-881a-3d44ee01440a"

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (path.startsWith("/v1/")) {
    headers.set("x-card-secret", CARD_SECRET)
  }

  return fetch(`${CARD_SERVICE_BASE_URL}${path}`, {
    ...init,
    headers,
  })
}

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true"

describe.runIf(runIntegration)("card-service integration", () => {
  let originalStatus: "active" | "paused" = "active"

  beforeAll(async () => {
    const me = await request("/v1/card/me")
    expect(me.status).toBe(200)
    const payload = await me.json()
    originalStatus = payload.status
  })

  afterAll(async () => {
    const me = await request("/v1/card/me")
    if (me.status !== 200) return
    const payload = await me.json()
    if (payload.status !== originalStatus) {
      if (originalStatus === "active") {
        await request("/v1/card/resume", { method: "POST" })
      } else {
        await request("/v1/card/pause", { method: "POST" })
      }
    }
  })

  it("responds to health and openapi", async () => {
    const healthResponse = await request("/health")
    expect(healthResponse.status).toBe(200)
    const healthJson = await healthResponse.json()
    expect(healthJson).toMatchObject({ ok: true, service: "card-service" })

    const openApiResponse = await request("/openapi.json")
    expect(openApiResponse.status).toBe(200)
    const openApiJson = await openApiResponse.json()
    expect(openApiJson).toMatchObject({ openapi: "3.1.0" })
  })

  it("covers every authenticated endpoint", async () => {
    const meResponse = await request("/v1/card/me")
    expect(meResponse.status).toBe(200)
    const me = await meResponse.json()
    expect(me).toMatchObject({
      id: expect.any(String),
      accountId: expect.any(String),
      accountAddress: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
      name: expect.any(String),
      chain: expect.any(String),
      status: expect.any(String),
    })

    const [balance, limits, policies, summary, listTx] = await Promise.all([
      request("/v1/card/balance"),
      request("/v1/card/limits"),
      request("/v1/card/policies"),
      request("/v1/card/summary"),
      request("/v1/card/transactions?limit=10"),
    ])

    expect(balance.status).toBe(200)
    expect(limits.status).toBe(200)
    expect(policies.status).toBe(200)
    expect(summary.status).toBe(200)
    expect(listTx.status).toBe(200)

    const quoteBad = await request("/v1/card/transactions/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: "0x123", value: "abc" }),
    })
    expect(quoteBad.status).toBe(400)

    const quoteGood = await request("/v1/card/transactions/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: me.accountAddress, value: "1" }),
    })
    expect([200, 400, 402, 403]).toContain(quoteGood.status)

    const txNoIdempotency = await request("/v1/card/transactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: me.accountAddress, value: "1" }),
    })
    expect(txNoIdempotency.status).toBe(400)

    const paused = await request("/v1/card/pause", { method: "POST" })
    expect(paused.status).toBe(200)
    const pausedJson = await paused.json()
    expect(pausedJson).toMatchObject({ status: "paused" })

    const resumed = await request("/v1/card/resume", { method: "POST" })
    expect(resumed.status).toBe(200)
    const resumedJson = await resumed.json()
    expect(resumedJson).toMatchObject({ status: "active" })
  })

  it("rejects requests with invalid secret", async () => {
    const response = await fetch(`${CARD_SERVICE_BASE_URL}/v1/card/me`, {
      headers: {
        "x-card-secret": "sgl_invalid",
      },
    })

    expect(response.status).toBe(401)
    const payload = await response.json()
    expect(payload).toMatchObject({
      error: {
        code: "INVALID_SECRET",
      },
    })
  })
})
