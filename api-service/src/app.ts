import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import type { Hex } from "viem"
import { apiKeyAuth } from "./lib/auth.js"
import { ApiError, toErrorResponse } from "./lib/errors.js"
import type { ApiScope, ApiStore } from "./types.js"
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

const apiKeyPolicySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.enum(["read", "write", "tx", "admin"])).optional(),
  ipAllowlist: z.array(z.string()).optional(),
  rateLimitPerMinute: z.number().min(1).max(10000).optional(),
})

const apiKeyPolicyPatchSchema = z.object({
  name: z.string().min(1).optional(),
  scopes: z.array(z.enum(["read", "write", "tx", "admin"])).optional(),
  ipAllowlist: z.array(z.string()).optional(),
  rateLimitPerMinute: z.number().min(1).max(10000).optional(),
})

function requestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readClientIp(c: any): string | undefined {
  const forwarded = c.req.header("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim()
  }
  return c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip") ?? undefined
}

function scoped(scope: ApiScope, store: ApiStore) {
  return apiKeyAuth(store, scope)
}

export function createApp(store: ApiStore) {
  const app = new Hono()

  app.onError((error, c) => toErrorResponse(c, error))

  app.get("/health", (c) => c.json({ ok: true, service: "api-service" }))
  app.get("/openapi.json", (c) => c.json(openApiSpec))

  app.use("/v1/*", async (c, next) => {
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
      const apiKey = c.req.header("x-api-key")
      if (apiKey) {
        void store.logRequest({
          apiKey,
          method: c.req.method,
          path: c.req.path,
          statusCode: thrown ? 500 : c.res.status,
          durationMs,
          requestId: reqId,
          ipAddress: readClientIp(c),
        })
      }
    }
  })

  app.get("/v1/me", scoped("read", store), (c) => {
    return c.json(c.get("apiAuth"))
  })

  app.get("/v1/api-keys", scoped("admin", store), async (c) => {
    const auth = c.get("apiAuth")
    const keys = await store.listApiKeys(auth.userId)
    return c.json({ apiKeys: keys })
  })

  app.post("/v1/api-keys", scoped("admin", store), zValidator("json", apiKeyPolicySchema), async (c) => {
    const auth = c.get("apiAuth")
    const payload = c.req.valid("json")
    const apiKey = await store.createApiKey(auth.userId, payload)
    return c.json({ apiKey }, 201)
  })

  app.patch("/v1/api-keys/:apiKeyId", scoped("admin", store), zValidator("json", apiKeyPolicyPatchSchema), async (c) => {
    const auth = c.get("apiAuth")
    const apiKey = await store.updateApiKeyPolicy(auth.userId, c.req.param("apiKeyId"), c.req.valid("json"))
    return c.json({ apiKey })
  })

  app.delete("/v1/api-keys/:apiKeyId", scoped("admin", store), async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.revokeApiKey(auth.userId, c.req.param("apiKeyId"))
    return c.json(result)
  })

  app.get("/v1/accounts", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    return c.json({ accounts: await store.listAccounts(auth.userId) })
  })

  app.post("/v1/accounts", scoped("write", store), zValidator("json", accountSchema), async (c) => {
    const auth = c.get("apiAuth")
    const body = c.req.valid("json")
    const account = await store.createAccount(auth.userId, body)
    return c.json({ account }, 201)
  })

  app.post("/v1/accounts/provision", scoped("tx", store), zValidator("json", accountProvisionSchema), async (c) => {
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

  app.get("/v1/accounts/:accountId", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    const account = await store.getAccount(auth.userId, c.req.param("accountId"))
    return c.json({ account })
  })

  app.patch("/v1/accounts/:accountId", scoped("write", store), zValidator("json", accountPatchSchema), async (c) => {
    const auth = c.get("apiAuth")
    const body = c.req.valid("json")
    const account = await store.updateAccount(auth.userId, c.req.param("accountId"), body)
    return c.json({ account })
  })

  app.delete("/v1/accounts/:accountId", scoped("write", store), async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.removeAccount(auth.userId, c.req.param("accountId"))
    return c.json(result)
  })

  app.get("/v1/accounts/:accountId/transactions", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    const transactions = await store.listTransactionsByAccount(auth.userId, c.req.param("accountId"))
    return c.json({ transactions })
  })

  app.post("/v1/accounts/:accountId/transactions", scoped("tx", store), zValidator("json", sendTransactionSchema), async (c) => {
    const auth = c.get("apiAuth")
    const accountId = c.req.param("accountId")
    const body = c.req.valid("json")
    const idempotencyKey = c.req.header("idempotency-key")
    if (!idempotencyKey) {
      throw new ApiError(400, "MISSING_IDEMPOTENCY_KEY", "Missing idempotency-key header")
    }
    const account = await store.getAccountWithPrivateKey(auth.userId, accountId)

    const sent = await sendKernelTransaction({
      chainSlug: account.chain,
      privateKey: account.privateKey as Hex,
      to: body.to as Hex,
      value: BigInt(body.value),
    })

    let transaction: { _id: string; status: "progress" | "success" | "error"; hash: string }
    try {
      transaction = await store.createTransaction(auth.userId, {
        accountId,
        idempotencyKey,
        hash: sent.hash,
        from: account.address,
        to: body.to,
        value: body.value,
        direction: "out",
        status: sent.status,
        chain: account.chain,
      }) as { _id: string; status: "progress" | "success" | "error"; hash: string }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create transaction"
      if (message.includes("Idempotency key reuse with different payload")) {
        throw new ApiError(409, "IDEMPOTENCY_KEY_CONFLICT", message)
      }
      throw error
    }

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

  app.get("/v1/accounts/:accountId/cards", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    const cards = await store.listCardsByAccount(auth.userId, c.req.param("accountId"))
    return c.json({ cards })
  })

  app.post("/v1/cards", scoped("write", store), zValidator("json", cardSchema), async (c) => {
    const auth = c.get("apiAuth")
    const card = await store.createCard(auth.userId, c.req.valid("json"))
    return c.json({ card }, 201)
  })

  app.get("/v1/cards/:cardId", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    const card = await store.getCard(auth.userId, c.req.param("cardId"))
    return c.json({ card })
  })

  app.patch("/v1/cards/:cardId", scoped("write", store), zValidator("json", cardPatchSchema), async (c) => {
    const auth = c.get("apiAuth")
    const card = await store.updateCard(auth.userId, c.req.param("cardId"), c.req.valid("json"))
    return c.json({ card })
  })

  app.delete("/v1/cards/:cardId", scoped("write", store), async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.removeCard(auth.userId, c.req.param("cardId"))
    return c.json(result)
  })

  app.get("/v1/cards/:cardId/transactions", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    const transactions = await store.listCardTransactions(auth.userId, c.req.param("cardId"))
    return c.json({ transactions })
  })

  app.get("/v1/cards/:cardId/integrations", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    const integrations = await store.listIntegrationsByCard(auth.userId, c.req.param("cardId"))
    return c.json({ integrations })
  })

  app.post("/v1/integrations", scoped("write", store), zValidator("json", integrationSchema), async (c) => {
    const auth = c.get("apiAuth")
    const integration = await store.createIntegration(auth.userId, c.req.valid("json"))
    return c.json({ integration }, 201)
  })

  app.patch("/v1/integrations/:integrationId", scoped("write", store), zValidator("json", integrationPatchSchema), async (c) => {
    const auth = c.get("apiAuth")
    const integration = await store.updateIntegrationConfig(auth.userId, c.req.param("integrationId"), c.req.valid("json"))
    return c.json({ integration })
  })

  app.delete("/v1/integrations/:integrationId", scoped("write", store), async (c) => {
    const auth = c.get("apiAuth")
    const result = await store.removeIntegration(auth.userId, c.req.param("integrationId"))
    return c.json(result)
  })

  app.get("/v1/contacts", scoped("read", store), async (c) => {
    const auth = c.get("apiAuth")
    const contacts = await store.listContacts(auth.userId)
    return c.json({ contacts })
  })

  app.post("/v1/contacts", scoped("write", store), zValidator("json", contactSchema), async (c) => {
    const auth = c.get("apiAuth")
    const contact = await store.createContact(auth.userId, c.req.valid("json"))
    return c.json({ contact }, 201)
  })

  app.delete("/v1/contacts/:contactId", scoped("write", store), async (c) => {
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
    version: "0.2.0",
    description: "API-key authenticated API for Sigloop account/card/contact/integration operations with scopes, idempotency, IP allowlists, and rate limits.",
  },
  servers: [{ url: "http://localhost:8788" }],
  components: {
    securitySchemes: {
      ApiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
      IdempotencyKey: {
        type: "apiKey",
        in: "header",
        name: "idempotency-key",
      },
    },
  },
  security: [{ ApiKey: [] }],
  paths: {
    "/health": { get: { summary: "Service health" } },
    "/openapi.json": { get: { summary: "OpenAPI schema" } },
    "/v1/me": { get: { summary: "Current API key context", description: "Scope: read" } },
    "/v1/api-keys": { get: { summary: "List API keys", description: "Scope: admin" }, post: { summary: "Create API key", description: "Scope: admin" } },
    "/v1/api-keys/{apiKeyId}": { patch: { summary: "Update API key policy", description: "Scope: admin" }, delete: { summary: "Revoke API key", description: "Scope: admin" } },
    "/v1/accounts": { get: { summary: "List accounts", description: "Scope: read" }, post: { summary: "Create account", description: "Scope: write" } },
    "/v1/accounts/provision": { post: { summary: "Provision and create a new Kernel smart account", description: "Scope: tx" } },
    "/v1/accounts/{accountId}": { get: { summary: "Get account", description: "Scope: read" }, patch: { summary: "Update account", description: "Scope: write" }, delete: { summary: "Delete account", description: "Scope: write" } },
    "/v1/accounts/{accountId}/transactions": { get: { summary: "List account transactions", description: "Scope: read" }, post: { summary: "Send transaction from account", description: "Scope: tx + idempotency-key" } },
    "/v1/accounts/{accountId}/cards": { get: { summary: "List cards for account", description: "Scope: read" } },
    "/v1/cards": { post: { summary: "Create card", description: "Scope: write" } },
    "/v1/cards/{cardId}": { get: { summary: "Get card", description: "Scope: read" }, patch: { summary: "Update card", description: "Scope: write" }, delete: { summary: "Delete card", description: "Scope: write" } },
    "/v1/cards/{cardId}/transactions": { get: { summary: "List card transactions", description: "Scope: read" } },
    "/v1/cards/{cardId}/integrations": { get: { summary: "List card integrations", description: "Scope: read" } },
    "/v1/integrations": { post: { summary: "Create integration", description: "Scope: write" } },
    "/v1/integrations/{integrationId}": { patch: { summary: "Update integration config", description: "Scope: write" }, delete: { summary: "Delete integration", description: "Scope: write" } },
    "/v1/contacts": { get: { summary: "List contacts", description: "Scope: read" }, post: { summary: "Create contact", description: "Scope: write" } },
    "/v1/contacts/{contactId}": { delete: { summary: "Delete contact", description: "Scope: write" } }
  },
}
