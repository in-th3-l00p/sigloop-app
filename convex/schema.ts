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
})
