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
  })
    .index("by_account", ["accountId"])
    .index("by_user", ["userId"])
    .index("by_card", ["agentCardId"]),

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
})
