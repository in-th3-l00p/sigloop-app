import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  smartAccounts: defineTable({
    userId: v.string(),
    name: v.string(),
    chain: v.string(),
    icon: v.string(),
    address: v.string(),
    privateKey: v.string(),
    status: v.string(),
    createdAt: v.float64(),
  })
    .index("by_user", ["userId"])
    .index("by_address", ["address"]),

  contacts: defineTable({
    userId: v.string(),
    name: v.string(),
    address: v.string(),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.string(),
    accountId: v.id("smartAccounts"),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    direction: v.string(),
    status: v.string(),
    chain: v.string(),
    createdAt: v.float64(),
    agentCardId: v.optional(v.id("agentCards")),
    idempotencyKey: v.optional(v.string()),
  })
    .index("by_account", ["accountId"])
    .index("by_user", ["userId"])
    .index("by_card", ["agentCardId"])
    .index("by_card_idempotency", ["agentCardId", "idempotencyKey"])
    .index("by_account_idempotency", ["accountId", "idempotencyKey"]),

  agentCards: defineTable({
    userId: v.string(),
    accountId: v.id("smartAccounts"),
    name: v.string(),
    secret: v.string(),
    limit: v.optional(v.string()),
    spent: v.string(),
    status: v.string(),
    limitResetPeriod: v.optional(v.string()),
    limitResetAt: v.optional(v.float64()),
    policies: v.optional(v.array(v.object({
      type: v.string(),
      value: v.string(),
    }))),
    createdAt: v.float64(),
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_secret", ["secret"]),

  integrations: defineTable({
    userId: v.string(),
    cardId: v.id("agentCards"),
    presetId: v.string(),
    type: v.string(),
    platform: v.string(),
    name: v.string(),
    description: v.string(),
    status: v.string(),
    schemaVersion: v.float64(),
    verificationMessage: v.optional(v.string()),
    verifiedAt: v.optional(v.float64()),
    config: v.optional(v.object({
      secretRef: v.optional(v.string()),
      language: v.optional(v.string()),
      packageManager: v.optional(v.string()),
      endpointBaseUrl: v.optional(v.string()),
      toolLibrary: v.optional(v.string()),
      agentPurpose: v.optional(v.string()),
      taskScope: v.optional(v.string()),
      behavioralRules: v.optional(v.string()),
      escalationPolicy: v.optional(v.string()),
    })),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_user", ["userId"])
    .index("by_card", ["cardId"])
    .index("by_type", ["type"])
    .index("by_platform", ["platform"])
    .index("by_card_preset", ["cardId", "presetId"]),

  apiKeys: defineTable({
    userId: v.string(),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    scopes: v.array(v.string()),
    ipAllowlist: v.optional(v.array(v.string())),
    rateLimitPerMinute: v.optional(v.float64()),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("revoked")),
    lastUsedAt: v.optional(v.float64()),
    createdAt: v.float64(),
    revokedAt: v.optional(v.float64()),
  })
    .index("by_user", ["userId"])
    .index("by_hash", ["keyHash"]),

  apiRequestLogs: defineTable({
    userId: v.string(),
    apiKeyId: v.id("apiKeys"),
    method: v.string(),
    path: v.string(),
    statusCode: v.float64(),
    durationMs: v.float64(),
    requestId: v.string(),
    ipAddress: v.optional(v.string()),
    createdAt: v.float64(),
  })
    .index("by_user", ["userId"])
    .index("by_key", ["apiKeyId"]),
})
