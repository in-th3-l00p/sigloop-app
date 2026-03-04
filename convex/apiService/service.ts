import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { createApiKeyToken, DEFAULT_API_SCOPES, hasScope, hashApiKey, normalizeIp } from "../lib/apiKeys"

const policyValidator = v.object({
  type: v.string(),
  value: v.string(),
})

const configValidator = v.optional(v.object({
  secretRef: v.optional(v.string()),
  language: v.optional(v.string()),
  packageManager: v.optional(v.string()),
  endpointBaseUrl: v.optional(v.string()),
  toolLibrary: v.optional(v.string()),
  agentPurpose: v.optional(v.string()),
  taskScope: v.optional(v.string()),
  behavioralRules: v.optional(v.string()),
  escalationPolicy: v.optional(v.string()),
}))

async function resolveActiveKey(ctx: any, apiKey: string) {
  const keyHash = hashApiKey(apiKey)
  const key = await ctx.db
    .query("apiKeys")
    .withIndex("by_hash", (q: any) => q.eq("keyHash", keyHash))
    .first()

  if (!key || key.status !== "active") {
    return null
  }

  return key
}

function sanitizeKeyRecord(key: any) {
  const { keyHash: _, ...rest } = key
  return rest
}

function computeResetAt(period: string): number {
  const now = new Date()
  if (period === "daily") {
    const next = new Date(now)
    next.setUTCDate(next.getUTCDate() + 1)
    next.setUTCHours(0, 0, 0, 0)
    return next.getTime()
  }
  if (period === "weekly") {
    const next = new Date(now)
    const daysUntilMonday = (8 - next.getUTCDay()) % 7 || 7
    next.setUTCDate(next.getUTCDate() + daysUntilMonday)
    next.setUTCHours(0, 0, 0, 0)
    return next.getTime()
  }
  if (period === "monthly") {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    return next.getTime()
  }
  return 0
}

export const authorizeApiRequest = mutation({
  args: {
    apiKey: v.string(),
    requiredScope: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = await resolveActiveKey(ctx, args.apiKey)
    if (!key) return null
    const normalizedIp = normalizeIp(args.ipAddress)

    if (!hasScope(key.scopes ?? [], args.requiredScope)) {
      return { ok: false, reason: "INSUFFICIENT_SCOPE" as const }
    }

    if (key.ipAllowlist && key.ipAllowlist.length > 0) {
      if (!normalizedIp || !key.ipAllowlist.map((ip: string) => normalizeIp(ip)).includes(normalizedIp)) {
        return { ok: false, reason: "IP_NOT_ALLOWED" as const }
      }
    }

    const rateLimit = key.rateLimitPerMinute ?? 120
    if (rateLimit > 0) {
      const windowStart = Date.now() - 60_000
      const recentLogs = await ctx.db
        .query("apiRequestLogs")
        .withIndex("by_key", (q: any) => q.eq("apiKeyId", key._id))
        .collect()
      const count = recentLogs.filter((log: any) => log.createdAt >= windowStart).length
      if (count >= rateLimit) {
        return { ok: false, reason: "RATE_LIMITED" as const }
      }
    }

    await ctx.db.patch(key._id, {
      lastUsedAt: Date.now(),
    })

    return {
      ok: true,
      apiKeyId: key._id,
      userId: key.userId,
      keyName: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes ?? [],
      ipAllowlist: key.ipAllowlist ?? [],
      rateLimitPerMinute: key.rateLimitPerMinute ?? 120,
    }
  },
})

export const logApiRequest = mutation({
  args: {
    apiKey: v.string(),
    method: v.string(),
    path: v.string(),
    statusCode: v.number(),
    durationMs: v.number(),
    requestId: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = await resolveActiveKey(ctx, args.apiKey)
    if (!key) {
      return null
    }

    await ctx.db.insert("apiRequestLogs", {
      userId: key.userId,
      apiKeyId: key._id,
      method: args.method,
      path: args.path,
      statusCode: args.statusCode,
      durationMs: args.durationMs,
      requestId: args.requestId,
      ipAddress: normalizeIp(args.ipAddress),
      createdAt: Date.now(),
    })

    return { ok: true }
  },
})

export const listApiKeys = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    return keys.sort((a, b) => b.createdAt - a.createdAt).map(sanitizeKeyRecord)
  },
})

export const createApiKey = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    scopes: v.optional(v.array(v.string())),
    ipAllowlist: v.optional(v.array(v.string())),
    rateLimitPerMinute: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const next = createApiKeyToken()
    const now = Date.now()
    const scopes = (args.scopes && args.scopes.length > 0) ? args.scopes : [...DEFAULT_API_SCOPES]
    const ipAllowlist = args.ipAllowlist?.map((ip) => normalizeIp(ip)).filter(Boolean) as string[] | undefined

    const id = await ctx.db.insert("apiKeys", {
      userId: args.userId,
      name: args.name,
      keyHash: next.hash,
      keyPrefix: next.prefix,
      scopes,
      ipAllowlist,
      rateLimitPerMinute: args.rateLimitPerMinute,
      status: "active",
      createdAt: now,
    })

    return {
      id,
      apiKey: next.token,
      keyPrefix: next.prefix,
      name: args.name,
      scopes,
      ipAllowlist,
      rateLimitPerMinute: args.rateLimitPerMinute,
      status: "active" as const,
      createdAt: now,
    }
  },
})

export const updateApiKeyPolicy = mutation({
  args: {
    userId: v.string(),
    apiKeyId: v.id("apiKeys"),
    name: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    ipAllowlist: v.optional(v.array(v.string())),
    rateLimitPerMinute: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.apiKeyId)
    if (!key || key.userId !== args.userId) {
      throw new Error("API key not found")
    }

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.scopes !== undefined) patch.scopes = args.scopes
    if (args.ipAllowlist !== undefined) {
      patch.ipAllowlist = args.ipAllowlist.map((ip) => normalizeIp(ip)).filter(Boolean)
    }
    if (args.rateLimitPerMinute !== undefined) patch.rateLimitPerMinute = args.rateLimitPerMinute

    await ctx.db.patch(args.apiKeyId, patch)
    return sanitizeKeyRecord({ ...key, ...patch })
  },
})

export const revokeApiKey = mutation({
  args: {
    userId: v.string(),
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.apiKeyId)
    if (!key || key.userId !== args.userId) {
      throw new Error("API key not found")
    }

    await ctx.db.patch(args.apiKeyId, {
      status: "revoked",
      revokedAt: Date.now(),
    })
    return { ok: true }
  },
})

export const listAccounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("smartAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    return rows.map(({ privateKey: _, ...rest }) => rest).sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getAccount = query({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.accountId)
    if (!row || row.userId !== args.userId) {
      throw new Error("Account not found")
    }
    const { privateKey: _, ...rest } = row
    return rest
  },
})

export const getAccountWithPrivateKey = query({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.accountId)
    if (!row || row.userId !== args.userId) {
      throw new Error("Account not found")
    }
    return row
  },
})

export const createAccount = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    chain: v.string(),
    icon: v.string(),
    address: v.string(),
    privateKey: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("smartAccounts", {
      userId: args.userId,
      name: args.name,
      chain: args.chain,
      icon: args.icon,
      address: args.address,
      privateKey: args.privateKey,
      status: "active",
      createdAt: Date.now(),
    })
  },
})

export const updateAccount = mutation({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found")
    }
    const patch: Record<string, string> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.icon !== undefined) patch.icon = args.icon
    await ctx.db.patch(args.accountId, patch)
    const { privateKey: _, ...rest } = { ...account, ...patch }
    return rest
  },
})

export const removeAccount = mutation({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found")
    }
    await ctx.db.delete(args.accountId)
    return { ok: true }
  },
})

export const listContacts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    return rows.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const createContact = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("contacts", {
      userId: args.userId,
      name: args.name,
      address: args.address,
    })
    return ctx.db.get(id)
  },
})

export const removeContact = mutation({
  args: {
    userId: v.string(),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId)
    if (!contact || contact.userId !== args.userId) {
      throw new Error("Contact not found")
    }
    await ctx.db.delete(args.contactId)
    return { ok: true }
  },
})

export const listTransactionsByAccount = query({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found")
    }
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect()

    return txs.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const createTransaction = mutation({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
    idempotencyKey: v.string(),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    direction: v.string(),
    status: v.union(v.literal("progress"), v.literal("success"), v.literal("error")),
    chain: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found")
    }

    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_account_idempotency", (q) =>
        q.eq("accountId", args.accountId).eq("idempotencyKey", args.idempotencyKey)
      )
      .first()

    if (existing) {
      if (
        existing.to.toLowerCase() !== args.to.toLowerCase() ||
        existing.value !== args.value ||
        existing.direction !== args.direction
      ) {
        throw new Error("Idempotency key reuse with different payload")
      }
      return existing
    }

    const id = await ctx.db.insert("transactions", {
      userId: args.userId,
      accountId: args.accountId,
      idempotencyKey: args.idempotencyKey,
      hash: args.hash,
      from: args.from,
      to: args.to,
      value: args.value,
      direction: args.direction,
      status: args.status,
      chain: args.chain,
      createdAt: Date.now(),
    })

    return ctx.db.get(id)
  },
})

export const updateTransactionStatus = mutation({
  args: {
    userId: v.string(),
    transactionId: v.id("transactions"),
    status: v.union(v.literal("progress"), v.literal("success"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.transactionId)
    if (!tx || tx.userId !== args.userId) {
      throw new Error("Transaction not found")
    }
    if (tx.status === "success" || tx.status === "error") {
      return tx
    }

    await ctx.db.patch(args.transactionId, { status: args.status })
    return { ...tx, status: args.status }
  },
})

export const listCardsByAccount = query({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found")
    }

    const cards = await ctx.db
      .query("agentCards")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect()

    return cards.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getCard = query({
  args: {
    userId: v.string(),
    cardId: v.id("agentCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== args.userId) {
      throw new Error("Card not found")
    }
    return card
  },
})

export const createCard = mutation({
  args: {
    userId: v.string(),
    accountId: v.id("smartAccounts"),
    name: v.string(),
    secret: v.string(),
    limit: v.optional(v.string()),
    limitResetPeriod: v.optional(v.string()),
    policies: v.optional(v.array(policyValidator)),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) {
      throw new Error("Account not found")
    }

    const resetAt = args.limitResetPeriod ? computeResetAt(args.limitResetPeriod) : undefined

    const id = await ctx.db.insert("agentCards", {
      userId: args.userId,
      accountId: args.accountId,
      name: args.name,
      secret: args.secret,
      limit: args.limit,
      spent: "0",
      status: "active",
      limitResetPeriod: args.limitResetPeriod,
      limitResetAt: resetAt,
      policies: args.policies,
      createdAt: Date.now(),
    })

    return ctx.db.get(id)
  },
})

export const updateCard = mutation({
  args: {
    userId: v.string(),
    cardId: v.id("agentCards"),
    name: v.optional(v.string()),
    limit: v.optional(v.string()),
    status: v.optional(v.string()),
    limitResetPeriod: v.optional(v.string()),
    policies: v.optional(v.array(policyValidator)),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== args.userId) {
      throw new Error("Card not found")
    }

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.limit !== undefined) patch.limit = args.limit || undefined
    if (args.status !== undefined) patch.status = args.status
    if (args.limitResetPeriod !== undefined) {
      patch.limitResetPeriod = args.limitResetPeriod || undefined
      patch.limitResetAt = args.limitResetPeriod ? computeResetAt(args.limitResetPeriod) : undefined
    }
    if (args.policies !== undefined) patch.policies = args.policies

    await ctx.db.patch(args.cardId, patch)

    return { ...card, ...patch }
  },
})

export const removeCard = mutation({
  args: {
    userId: v.string(),
    cardId: v.id("agentCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== args.userId) {
      throw new Error("Card not found")
    }

    await ctx.db.delete(args.cardId)
    return { ok: true }
  },
})

export const listCardTransactions = query({
  args: {
    userId: v.string(),
    cardId: v.id("agentCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== args.userId) {
      throw new Error("Card not found")
    }

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_card", (q) => q.eq("agentCardId", args.cardId))
      .collect()

    return txs.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listIntegrationsByCard = query({
  args: {
    userId: v.string(),
    cardId: v.id("agentCards"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== args.userId) {
      throw new Error("Card not found")
    }

    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .collect()

    return integrations.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const createIntegration = mutation({
  args: {
    userId: v.string(),
    cardId: v.id("agentCards"),
    presetId: v.string(),
    type: v.string(),
    platform: v.string(),
    name: v.string(),
    description: v.string(),
    schemaVersion: v.float64(),
    config: configValidator,
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== args.userId) {
      throw new Error("Card not found")
    }

    const id = await ctx.db.insert("integrations", {
      userId: args.userId,
      cardId: args.cardId,
      presetId: args.presetId,
      type: args.type,
      platform: args.platform,
      name: args.name,
      description: args.description,
      status: "configured",
      schemaVersion: args.schemaVersion,
      config: args.config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return ctx.db.get(id)
  },
})

export const updateIntegrationConfig = mutation({
  args: {
    userId: v.string(),
    integrationId: v.id("integrations"),
    config: configValidator,
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId)
    if (!integration || integration.userId !== args.userId) {
      throw new Error("Integration not found")
    }

    const mergedConfig = {
      ...(integration.config ?? {}),
      ...(args.config ?? {}),
    }

    await ctx.db.patch(args.integrationId, {
      config: mergedConfig,
      updatedAt: Date.now(),
    })

    return {
      ...integration,
      config: mergedConfig,
    }
  },
})

export const removeIntegration = mutation({
  args: {
    userId: v.string(),
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId)
    if (!integration || integration.userId !== args.userId) {
      throw new Error("Integration not found")
    }

    await ctx.db.delete(args.integrationId)
    return { ok: true }
  },
})
