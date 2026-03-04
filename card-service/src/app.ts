import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { CardStore } from "./data/store.js"
import { cardAuth } from "./lib/auth.js"
import { ApiError, toErrorResponse } from "./lib/errors.js"
import { enforceCardIsUsable, enforceLimitsAndPolicies } from "./lib/policies.js"

const transferSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
  value: z.string().regex(/^\d+$/, "Must be a wei string"),
  description: z.string().max(240).optional(),
})

const txQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional(),
})

export function createApp(store: CardStore) {
  const app = new Hono()

  app.onError((error, c) => toErrorResponse(c, error))

  app.get("/health", (c) => c.json({ ok: true, service: "card-service" }))

  app.get("/openapi.json", (c) => c.json(openApiSpec))

  app.use("/v1/card/*", cardAuth(store))

  app.get("/v1/card/me", (c) => {
    const card = c.get("card")
    return c.json({
      id: card.id,
      accountId: card.accountId,
      name: card.name,
      status: card.status,
      chain: card.chain,
      currency: card.currency,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    })
  })

  app.get("/v1/card/balance", (c) => {
    const card = c.get("card")
    return c.json({
      balance: card.balance,
      currency: card.currency,
      chain: card.chain,
      spent: card.spent,
    })
  })

  app.get("/v1/card/limits", (c) => {
    const card = c.get("card")
    return c.json({
      limit: card.limit ?? null,
      spent: card.spent,
      remaining: card.limit ? (BigInt(card.limit) - BigInt(card.spent)).toString() : null,
      resetPeriod: card.limitResetPeriod ?? null,
      resetAt: card.limitResetAt ?? null,
    })
  })

  app.get("/v1/card/policies", (c) => {
    const card = c.get("card")
    return c.json({ policies: card.policies })
  })

  app.get("/v1/card/summary", async (c) => {
    const card = c.get("card")
    const txs = await store.listTransactions(card.id, 5)
    return c.json({
      card: {
        id: card.id,
        name: card.name,
        status: card.status,
      },
      balance: card.balance,
      limit: card.limit ?? null,
      spent: card.spent,
      recentTransactions: txs,
    })
  })

  app.get("/v1/card/transactions", zValidator("query", txQuerySchema), async (c) => {
    const result = c.req.valid("query")
    const card = c.get("card")
    const transactions = await store.listTransactions(card.id, result.limit)
    return c.json({ transactions })
  })

  app.post("/v1/card/transactions", zValidator("json", transferSchema), async (c) => {
    const card = c.get("card")
    const input = c.req.valid("json")

    enforceCardIsUsable(card)
    enforceLimitsAndPolicies(card, input)

    const tx = await store.addTransaction(card, input)
    return c.json({ transaction: tx }, 201)
  })

  app.post("/v1/card/transactions/quote", zValidator("json", transferSchema), (c) => {
    const card = c.get("card")
    const input = c.req.valid("json")

    enforceCardIsUsable(card)
    enforceLimitsAndPolicies(card, input)

    return c.json({
      allowed: true,
      quote: {
        amount: input.value,
        networkFee: "21000000000000",
        total: (BigInt(input.value) + 21000000000000n).toString(),
      },
    })
  })

  app.post("/v1/card/pause", async (c) => {
    const card = c.get("card")
    card.status = "paused"
    card.updatedAt = Date.now()
    await store.saveCard(card)
    return c.json({ status: card.status })
  })

  app.post("/v1/card/resume", async (c) => {
    const card = c.get("card")
    card.status = "active"
    card.updatedAt = Date.now()
    await store.saveCard(card)
    return c.json({ status: card.status })
  })

  app.notFound((c) => {
    throw new ApiError(404, "NOT_FOUND", `Route ${c.req.method} ${c.req.path} not found`)
  })

  return app
}

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Sigloop Card Service",
    version: "0.1.0",
    description: "Secret-authenticated card API for agent-controlled spending.",
  },
  servers: [{ url: "http://localhost:8787" }],
  components: {
    securitySchemes: {
      CardSecret: {
        type: "apiKey",
        in: "header",
        name: "x-card-secret",
      },
    },
  },
  security: [{ CardSecret: [] }],
  paths: {
    "/health": { get: { summary: "Service health" } },
    "/v1/card/me": { get: { summary: "Card profile" } },
    "/v1/card/balance": { get: { summary: "Balance details" } },
    "/v1/card/limits": { get: { summary: "Limit and spent details" } },
    "/v1/card/policies": { get: { summary: "Policy rules" } },
    "/v1/card/summary": { get: { summary: "Card + recent activity" } },
    "/v1/card/transactions": {
      get: { summary: "Transaction history" },
      post: { summary: "Execute transaction" },
    },
    "/v1/card/transactions/quote": { post: { summary: "Preflight quote and policy check" } },
    "/v1/card/pause": { post: { summary: "Pause card" } },
    "/v1/card/resume": { post: { summary: "Resume card" } },
  },
}
