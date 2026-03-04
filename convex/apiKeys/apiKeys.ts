import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"
import { createApiKeyToken } from "../lib/apiKeys"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx, "apiKeys.list")
    const rows = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ keyHash: _, ...item }) => item)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiKeys.create")
    const next = createApiKeyToken()
    const now = Date.now()

    const id = await ctx.db.insert("apiKeys", {
      userId,
      name: args.name,
      keyHash: next.hash,
      keyPrefix: next.prefix,
      status: "active",
      createdAt: now,
    })

    return {
      id,
      apiKey: next.token,
      keyPrefix: next.prefix,
      name: args.name,
      status: "active" as const,
      createdAt: now,
    }
  },
})

export const revoke = mutation({
  args: {
    id: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiKeys.revoke")
    const key = await ctx.db.get(args.id)
    if (!key || key.userId !== userId) {
      throw new Error("API key not found")
    }

    await ctx.db.patch(args.id, {
      status: "revoked",
      revokedAt: Date.now(),
    })
  },
})
