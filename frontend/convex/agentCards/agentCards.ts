import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"

const policyValidator = v.object({
  type: v.string(),
  value: v.string(),
})

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

export const create = mutation({
  args: {
    accountId: v.id("smartAccounts"),
    name: v.string(),
    secret: v.string(),
    limit: v.optional(v.string()),
    limitResetPeriod: v.optional(v.string()),
    policies: v.optional(v.array(policyValidator)),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "agentCards.create")
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    const resetAt = args.limitResetPeriod
      ? computeResetAt(args.limitResetPeriod)
      : undefined
    return ctx.db.insert("agentCards", {
      userId,
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
  },
})

export const list = query({
  args: { accountId: v.id("smartAccounts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "agentCards.list")
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    const cards = await ctx.db
      .query("agentCards")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect()

    return cards
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ secret: _, ...rest }) => rest)
  },
})

export const get = query({
  args: { id: v.id("agentCards") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "agentCards.get")
    const card = await ctx.db.get(args.id)
    if (!card || card.userId !== userId) {
      throw new Error("Card not found")
    }
    const { secret: _, ...rest } = card
    return rest
  },
})

export const getWithSecret = query({
  args: { id: v.id("agentCards") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "agentCards.getWithSecret")
    const card = await ctx.db.get(args.id)
    if (!card || card.userId !== userId) {
      throw new Error("Card not found")
    }
    return card
  },
})

export const update = mutation({
  args: {
    id: v.id("agentCards"),
    name: v.optional(v.string()),
    limit: v.optional(v.string()),
    status: v.optional(v.string()),
    limitResetPeriod: v.optional(v.string()),
    policies: v.optional(v.array(policyValidator)),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "agentCards.update")
    const card = await ctx.db.get(args.id)
    if (!card || card.userId !== userId) {
      throw new Error("Card not found")
    }
    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.limit !== undefined) patch.limit = args.limit || undefined
    if (args.status !== undefined) patch.status = args.status
    if (args.limitResetPeriod !== undefined) {
      patch.limitResetPeriod = args.limitResetPeriod || undefined
      patch.limitResetAt = args.limitResetPeriod
        ? computeResetAt(args.limitResetPeriod)
        : undefined
    }
    if (args.policies !== undefined) patch.policies = args.policies
    await ctx.db.patch(args.id, patch)
  },
})

export const remove = mutation({
  args: { id: v.id("agentCards") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "agentCards.remove")
    const card = await ctx.db.get(args.id)
    if (!card || card.userId !== userId) {
      throw new Error("Card not found")
    }
    await ctx.db.delete(args.id)
  },
})

export const listCardTransactions = query({
  args: { cardId: v.id("agentCards") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "agentCards.listCardTransactions")
    const card = await ctx.db.get(args.cardId)
    if (!card || card.userId !== userId) {
      throw new Error("Card not found")
    }
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_card", (q) => q.eq("agentCardId", args.cardId))
      .collect()

    return txs.sort((a, b) => b.createdAt - a.createdAt)
  },
})
