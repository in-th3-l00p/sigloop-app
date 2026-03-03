import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import type { QueryCtx, MutationCtx } from "../_generated/server"

async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }
  return identity.tokenIdentifier
}

export const create = mutation({
  args: {
    name: v.string(),
    chain: v.string(),
    icon: v.string(),
    address: v.string(),
    privateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    return ctx.db.insert("smartAccounts", {
      userId,
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

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)
    const accounts = await ctx.db
      .query("smartAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    return accounts
      .filter((a) => a.status === "active")
      .map(({ privateKey: _, ...rest }) => rest)
  },
})

export const get = query({
  args: { id: v.id("smartAccounts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const account = await ctx.db.get(args.id)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    const { privateKey: _, ...rest } = account
    return rest
  },
})

export const update = mutation({
  args: {
    id: v.id("smartAccounts"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const account = await ctx.db.get(args.id)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    const patch: Record<string, string> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.icon !== undefined) patch.icon = args.icon
    await ctx.db.patch(args.id, patch)
  },
})

export const getWithPrivateKey = query({
  args: { id: v.id("smartAccounts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const account = await ctx.db.get(args.id)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    return account
  },
})

export const remove = mutation({
  args: { id: v.id("smartAccounts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)
    const account = await ctx.db.get(args.id)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    await ctx.db.delete(args.id)
  },
})
