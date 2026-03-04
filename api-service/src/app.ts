import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import type { Hex } from "viem"
import { apiKeyAuth } from "./lib/auth.js"
import { ApiError, toErrorResponse } from "./lib/errors.js"
import type { ApiStore } from "./types.js"
import { provisionSmartAccount, sendKernelTransaction, waitKernelFinality } from "./lib/zerodev.js"

const accountSchema = z.object({
  name: z.string().min(1),
  chain: z.string().min(1),
  icon: z.string().min(1),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  privateKey: z.string().min(1),
})

const accountPatchSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
})

const accountProvisionSchema = z.object({
  name: z.string().min(1),
  chain: z.string().min(1),
  icon: z.string().min(1).default("wallet"),
})

const sendTransactionSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.string().regex(/^\d+$/),
})

const contactSchema = z.object({
  name: z.string().min(1),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

const policySchema = z.object({
  type: z.string(),
  value: z.string(),
})

const cardSchema = z.object({
  accountId: z.string(),
  name: z.string().min(1),
  secret: z.string().min(1),
  limit: z.string().optional(),
  limitResetPeriod: z.string().optional(),
  policies: z.array(policySchema).optional(),
})

const cardPatchSchema = z.object({
  name: z.string().min(1).optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  limitResetPeriod: z.string().optional(),
  policies: z.array(policySchema).optional(),
})

const integrationSchema = z.object({
  cardId: z.string(),
  presetId: z.string(),
  type: z.string(),
  platform: z.string(),
  name: z.string(),
  description: z.string(),
  schemaVersion: z.number(),
  config: z.record(z.string()).optional(),
})

const integrationPatchSchema = z.object({
  config: z.record(z.string()).optional(),
})

function requestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createApp(store: ApiStore) {
  const app = new Hono()

  app.onError((error, c) => toErrorResponse(c, error))

  app.get("/health", (c) => c.json({ ok: true, service: "api-service" }))
  app.get("/openapi.json", (c) => c.json(openApiSpec))

  app.use("/v1/*", apiKeyAuth(store), async (c, next) => {
    const startedAt = Date.now()
    const reqId = requestId()
    let thrown = false
    c.header("x-request-id", reqId)
    try {
      await next()
    } catch (error) {
      thrown = true
      throw error
    } finally {
      const durationMs = Date.now() - startedAt
      const apiKey = c.get("apiKey")
      void store.logRequest({
        apiKey,
        method: c.req.method,
        path: c.req.path,
        statusCode: thrown ? 500 : c.res.status,
        durationMs,
        requestId: reqId,
      })
    }
  })

  app.get("/v1/me", (c) => {
    return c.json(c.get("apiAuth"))
  })

  app.get("/v1/accounts", async (c) => {
    const auth = c.get("apiAuth")
    return c.json({ accounts: await store.listAccounts(auth.userId) })
  })

  app.post("/v1/accounts", zValidator("json", accountSchema), async (c) => {
    const auth = c.get("apiAuth")
    const body = c.req.valid("json")
    const account = await store.createAccount(auth.userId, body)
    return c.json({ account }, 201)
  })

  app.post("/v1/accounts/provision", zValidator("json", accountProvisionSchema), async (c) => {
    const auth = c.get("apiAuth")
    const body = c.req.valid("json")
    const next = await provisionSmartAccount(body.chain)
    const account = await store.createAccount(auth.userId, {
      name: body.name,
      chain: body.chain,
      icon: body.icon,
      address: next.address,
      privateKey: next.privateKey,
    })
    return c.json({ account }, 201)
  })

  app.get("/v1/accounts/:accountId", async (c) => {
    const auth = c.get("apiAuth")
    const account = await store.getAccount(auth.userId, c.req.param("accountId"))
    return c.json({ account })
  })

  app.patch("/v1/accounts/:accountId", zValidator("json", accountPatchSchema), async (c) => {
    const auth = c.get("apiAuth")
    const body = c.req.valid("json")
    const account = await store.updateAccount(auth.userId, c.req.param("accountId"), body)
    return c.json({ account })
  })

  app.delete("/v1/accounts/:accountId", async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.removeAccount(auth.userId, c.req.param("accountId"))
    return c.json(result)
  })

  app.get("/v1/accounts/:accountId/transactions", async (c) => {
    const auth = c.get("apiAuth")
    const transactions = await store.listTransactionsByAccount(auth.userId, c.req.param("accountId"))
    return c.json({ transactions })
  })

  app.post("/v1/accounts/:accountId/transactions", zValidator("json", sendTransactionSchema), async (c) => {
    const auth = c.get("apiAuth")
    const accountId = c.req.param("accountId")
    const body = c.req.valid("json")
    const account = await store.getAccountWithPrivateKey(auth.userId, accountId)

    const sent = await sendKernelTransaction({
      chainSlug: account.chain,
      privateKey: account.privateKey as Hex,
      to: body.to as Hex,
      value: BigInt(body.value),
    })

    const transaction = await store.createTransaction(auth.userId, {
      accountId,
      hash: sent.hash,
      from: account.address,
      to: body.to,
      value: body.value,
      direction: "out",
      status: sent.status,
      chain: account.chain,
    }) as { _id: string; status: "progress" | "success" | "error"; hash: string }

    if (transaction.status === "progress") {
      void (async () => {
        const finalStatus = await waitKernelFinality({
          chainSlug: account.chain,
          privateKey: account.privateKey as Hex,
          hash: sent.hash as Hex,
        })
        await store.updateTransactionStatus(auth.userId, transaction._id, finalStatus)
      })()
    }

    return c.json({ transaction }, 201)
  })

  app.get("/v1/accounts/:accountId/cards", async (c) => {
    const auth = c.get("apiAuth")
    const cards = await store.listCardsByAccount(auth.userId, c.req.param("accountId"))
    return c.json({ cards })
  })

  app.post("/v1/cards", zValidator("json", cardSchema), async (c) => {
    const auth = c.get("apiAuth")
    const card = await store.createCard(auth.userId, c.req.valid("json"))
    return c.json({ card }, 201)
  })

  app.get("/v1/cards/:cardId", async (c) => {
    const auth = c.get("apiAuth")
    const card = await store.getCard(auth.userId, c.req.param("cardId"))
    return c.json({ card })
  })

  app.patch("/v1/cards/:cardId", zValidator("json", cardPatchSchema), async (c) => {
    const auth = c.get("apiAuth")
    const card = await store.updateCard(auth.userId, c.req.param("cardId"), c.req.valid("json"))
    return c.json({ card })
  })

  app.delete("/v1/cards/:cardId", async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.removeCard(auth.userId, c.req.param("cardId"))
    return c.json(result)
  })

  app.get("/v1/cards/:cardId/transactions", async (c) => {
    const auth = c.get("apiAuth")
    const transactions = await store.listCardTransactions(auth.userId, c.req.param("cardId"))
    return c.json({ transactions })
  })

  app.get("/v1/cards/:cardId/integrations", async (c) => {
    const auth = c.get("apiAuth")
    const integrations = await store.listIntegrationsByCard(auth.userId, c.req.param("cardId"))
    return c.json({ integrations })
  })

  app.post("/v1/integrations", zValidator("json", integrationSchema), async (c) => {
    const auth = c.get("apiAuth")
    const integration = await store.createIntegration(auth.userId, c.req.valid("json"))
    return c.json({ integration }, 201)
  })

  app.patch("/v1/integrations/:integrationId", zValidator("json", integrationPatchSchema), async (c) => {
    const auth = c.get("apiAuth")
    const integration = await store.updateIntegrationConfig(auth.userId, c.req.param("integrationId"), c.req.valid("json"))
    return c.json({ integration })
  })

  app.delete("/v1/integrations/:integrationId", async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.removeIntegration(auth.userId, c.req.param("integrationId"))
    return c.json(result)
  })

  app.get("/v1/contacts", async (c) => {
    const auth = c.get("apiAuth")
    const contacts = await store.listContacts(auth.userId)
    return c.json({ contacts })
  })

  app.post("/v1/contacts", zValidator("json", contactSchema), async (c) => {
    const auth = c.get("apiAuth")
    const contact = await store.createContact(auth.userId, c.req.valid("json"))
    return c.json({ contact }, 201)
  })

  app.delete("/v1/contacts/:contactId", async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.removeContact(auth.userId, c.req.param("contactId"))
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
    title: "Sigloop API Service",
    version: "0.1.0",
    description: "API-key authenticated API for full Sigloop account/card/contact/integration operations.",
  },
  servers: [{ url: "http://localhost:8788" }],
  components: {
    securitySchemes: {
      ApiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
    },
  },
  security: [{ ApiKey: [] }],
  paths: {
    "/health": { get: { summary: "Service health" } },
    "/openapi.json": { get: { summary: "OpenAPI schema" } },
    "/v1/me": { get: { summary: "Current API key context" } },
    "/v1/accounts": { get: { summary: "List accounts" }, post: { summary: "Create account" } },
    "/v1/accounts/provision": { post: { summary: "Provision and create a new Kernel smart account" } },
    "/v1/accounts/{accountId}": { get: { summary: "Get account" }, patch: { summary: "Update account" }, delete: { summary: "Delete account" } },
    "/v1/accounts/{accountId}/transactions": { get: { summary: "List account transactions" }, post: { summary: "Send transaction from account" } },
    "/v1/accounts/{accountId}/cards": { get: { summary: "List cards for account" } },
    "/v1/cards": { post: { summary: "Create card" } },
    "/v1/cards/{cardId}": { get: { summary: "Get card" }, patch: { summary: "Update card" }, delete: { summary: "Delete card" } },
    "/v1/cards/{cardId}/transactions": { get: { summary: "List card transactions" } },
    "/v1/cards/{cardId}/integrations": { get: { summary: "List card integrations" } },
    "/v1/integrations": { post: { summary: "Create integration" } },
    "/v1/integrations/{integrationId}": { patch: { summary: "Update integration config" }, delete: { summary: "Delete integration" } },
    "/v1/contacts": { get: { summary: "List contacts" }, post: { summary: "Create contact" } },
    "/v1/contacts/{contactId}": { delete: { summary: "Delete contact" } }
  },
}
