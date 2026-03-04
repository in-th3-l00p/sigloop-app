import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"
import { createApiKeyToken, DEFAULT_API_SCOPES, normalizeIp } from "../lib/apiKeys"

const scopesValidator = v.array(v.string())

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
    scopes: v.optional(scopesValidator),
    ipAllowlist: v.optional(v.array(v.string())),
    rateLimitPerMinute: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiKeys.create")
    const next = createApiKeyToken()
    const now = Date.now()

    const scopes = (args.scopes && args.scopes.length > 0) ? args.scopes : [...DEFAULT_API_SCOPES]
    const ipAllowlist = args.ipAllowlist?.map((ip) => normalizeIp(ip)).filter(Boolean) as string[] | undefined

    const id = await ctx.db.insert("apiKeys", {
      userId,
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

export const updatePolicy = mutation({
  args: {
    id: v.id("apiKeys"),
    scopes: v.optional(scopesValidator),
    ipAllowlist: v.optional(v.array(v.string())),
    rateLimitPerMinute: v.optional(v.number()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiKeys.updatePolicy")
    const key = await ctx.db.get(args.id)
    if (!key || key.userId !== userId) {
      throw new Error("API key not found")
    }

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.scopes !== undefined) patch.scopes = args.scopes
    if (args.ipAllowlist !== undefined) {
      patch.ipAllowlist = args.ipAllowlist.map((ip) => normalizeIp(ip)).filter(Boolean)
    }
    if (args.rateLimitPerMinute !== undefined) patch.rateLimitPerMinute = args.rateLimitPerMinute

    await ctx.db.patch(args.id, patch)
    return { ...key, ...patch, keyHash: undefined }
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
