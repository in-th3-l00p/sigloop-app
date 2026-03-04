import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { CardStore, ChainGateway } from "./types.js"
import { cardAuth } from "./lib/auth.js"
import { ApiError, toErrorResponse } from "./lib/errors.js"
import { enforceCardIsUsable, enforceLimitsAndPolicies } from "./lib/policies.js"
import { trackProgressTransaction } from "./lib/tx-tracker.js"

const transferSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
  value: z.string().regex(/^\d+$/, "Must be a wei string"),
  description: z.string().max(240).optional(),
})

const txQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional(),
})

export function createApp(store: CardStore, chainGateway: ChainGateway) {
  const app = new Hono()

  app.onError((error, c) => toErrorResponse(c, error))

  app.get("/health", (c) => c.json({ ok: true, service: "card-service" }))

  app.get("/openapi.json", (c) => c.json(openApiSpec))

  app.use("/v1/card/*", cardAuth(store))

  app.get("/v1/card/me", (c) => {
    const runtime = c.get("runtime")
    return c.json({
      id: runtime.card.id,
      accountId: runtime.card.accountId,
      accountAddress: runtime.account.address,
      name: runtime.card.name,
      status: runtime.card.status,
      chain: runtime.card.chain,
      createdAt: runtime.card.createdAt,
    })
  })

  app.get("/v1/card/balance", async (c) => {
    const runtime = c.get("runtime")
    const balance = await chainGateway.getBalance(runtime.card.chain, runtime.account.address)

    return c.json({
      balance,
      currency: "ETH",
      chain: runtime.card.chain,
      spent: runtime.card.spent,
    })
  })

  app.get("/v1/card/limits", (c) => {
    const runtime = c.get("runtime")
    const remaining = runtime.card.limit
      ? (BigInt(runtime.card.limit) - BigInt(runtime.card.spent)).toString()
      : null

    return c.json({
      limit: runtime.card.limit ?? null,
      spent: runtime.card.spent,
      remaining,
      resetPeriod: runtime.card.limitResetPeriod ?? null,
      resetAt: runtime.card.limitResetAt ?? null,
    })
  })

  app.get("/v1/card/policies", (c) => {
    const runtime = c.get("runtime")
    return c.json({ policies: runtime.card.policies })
  })

  app.get("/v1/card/summary", async (c) => {
    const runtime = c.get("runtime")
    const [balance, txs] = await Promise.all([
      chainGateway.getBalance(runtime.card.chain, runtime.account.address),
      store.listTransactions(c.get("cardSecret"), 5),
    ])

    return c.json({
      card: {
        id: runtime.card.id,
        name: runtime.card.name,
        status: runtime.card.status,
      },
      balance,
      limit: runtime.card.limit ?? null,
      spent: runtime.card.spent,
      recentTransactions: txs,
    })
  })

  app.get("/v1/card/transactions", zValidator("query", txQuerySchema), async (c) => {
    const query = c.req.valid("query")
    const transactions = await store.listTransactions(c.get("cardSecret"), query.limit)
    return c.json({ transactions })
  })

  app.post("/v1/card/transactions/quote", zValidator("json", transferSchema), async (c) => {
    const runtime = c.get("runtime")
    const input = c.req.valid("json")

    enforceCardIsUsable(runtime.card)
    enforceLimitsAndPolicies(runtime.card, input)

    const balance = await chainGateway.getBalance(runtime.card.chain, runtime.account.address)
    if (BigInt(balance) < BigInt(input.value)) {
      throw new ApiError(402, "INSUFFICIENT_BALANCE", "Card balance is insufficient")
    }

    return c.json({
      allowed: true,
      quote: {
        amount: input.value,
        networkFee: "21000000000000",
        total: (BigInt(input.value) + 21000000000000n).toString(),
      },
    })
  })

  app.post("/v1/card/transactions", zValidator("json", transferSchema), async (c) => {
    const runtime = c.get("runtime")
    const secret = c.get("cardSecret")
    const input = c.req.valid("json")

    enforceCardIsUsable(runtime.card)
    enforceLimitsAndPolicies(runtime.card, input)

    const balance = await chainGateway.getBalance(runtime.card.chain, runtime.account.address)
    if (BigInt(balance) < BigInt(input.value)) {
      throw new ApiError(402, "INSUFFICIENT_BALANCE", "Card balance is insufficient")
    }

    const sent = await chainGateway.sendTransaction({
      chainSlug: runtime.account.chain,
      privateKey: runtime.account.privateKey,
      to: input.to,
      value: input.value,
    })

    const tx = {
      hash: sent.hash,
      from: runtime.account.address,
      to: input.to,
      value: input.value,
      direction: "out",
      status: sent.status,
      chain: runtime.account.chain,
      description: input.description,
    }

    await store.saveTransactionBySecret(secret, tx)

    if (sent.status === "progress") {
      const retryWindowMs = Number(process.env.TX_RETRY_WINDOW_MS ?? 120000)
      void trackProgressTransaction({
        store,
        chainGateway,
        secret,
        hash: sent.hash,
        chainSlug: runtime.account.chain,
        privateKey: runtime.account.privateKey,
        timeoutMs: retryWindowMs,
      })
    }

    return c.json({ transaction: tx }, 201)
  })

  app.post("/v1/card/pause", async (c) => {
    const result = await store.setCardStatus(c.get("cardSecret"), "paused")
    return c.json(result)
  })

  app.post("/v1/card/resume", async (c) => {
    const result = await store.setCardStatus(c.get("cardSecret"), "active")
    return c.json(result)
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
    version: "0.2.0",
    description: "Secret-authenticated card API backed by Convex and ZeroDev kernel transactions.",
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
    "/openapi.json": { get: { summary: "OpenAPI schema" } },
    "/v1/card/me": { get: { summary: "Card profile" } },
    "/v1/card/balance": { get: { summary: "Live chain balance" } },
    "/v1/card/limits": { get: { summary: "Limit and spent details" } },
    "/v1/card/policies": { get: { summary: "Policy rules" } },
    "/v1/card/summary": { get: { summary: "Card + recent activity" } },
    "/v1/card/transactions": {
      get: { summary: "Transaction history" },
      post: { summary: "Execute transaction with ZeroDev kernel" },
    },
    "/v1/card/transactions/quote": { post: { summary: "Preflight quote and policy check" } },
    "/v1/card/pause": { post: { summary: "Pause card" } },
    "/v1/card/resume": { post: { summary: "Resume card" } },
  },
}
