import { mutation, query } from "../_generated/server"
import { v } from "convex/values"

function normalizeAddress(address: string) {
  return address.trim().toLowerCase()
}

function computeNextResetAt(period?: string): number | undefined {
  if (!period) return undefined

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

  return undefined
}

function applyResetIfNeeded(card: {
  spent: string
  limitResetAt?: number
  limitResetPeriod?: string
}) {
  const now = Date.now()
  if (card.limitResetAt && card.limitResetAt <= now) {
    return {
      spent: "0",
      limitResetAt: computeNextResetAt(card.limitResetPeriod),
    }
  }

  return null
}

export const getRuntimeContextBySecret = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("agentCards")
      .withIndex("by_secret", (q) => q.eq("secret", args.secret))
      .first()
    if (!card) {
      return null
    }

    const account = await ctx.db.get(card.accountId)
    if (!account) {
      return null
    }

    return {
      card: {
        _id: card._id,
        accountId: card.accountId,
        name: card.name,
        status: card.status,
        chain: account.chain,
        balanceAddress: account.address,
        spent: card.spent,
        limit: card.limit,
        limitResetPeriod: card.limitResetPeriod,
        limitResetAt: card.limitResetAt,
        policies: card.policies ?? [],
        createdAt: card.createdAt,
      },
      account: {
        _id: account._id,
        address: account.address,
        privateKey: account.privateKey,
        chain: account.chain,
      },
    }
  },
})

export const listTransactionsBySecret = query({
  args: {
    secret: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("agentCards")
      .withIndex("by_secret", (q) => q.eq("secret", args.secret))
      .first()
    if (!card) {
      throw new Error("Card not found")
    }

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_card", (q) => q.eq("agentCardId", card._id))
      .collect()

    const max = args.limit ?? 50
    return txs.sort((a, b) => b.createdAt - a.createdAt).slice(0, max)
  },
})

export const refreshCardSpendIfNeeded = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("agentCards")
      .withIndex("by_secret", (q) => q.eq("secret", args.secret))
      .first()
    if (!card) {
      throw new Error("Card not found")
    }

    const resetPatch = applyResetIfNeeded(card)
    if (resetPatch) {
      await ctx.db.patch(card._id, resetPatch)
      return { ...card, ...resetPatch }
    }

    return card
  },
})

export const upsertCardTransactionBySecret = mutation({
  args: {
    secret: v.string(),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    direction: v.string(),
    status: v.string(),
    chain: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("agentCards")
      .withIndex("by_secret", (q) => q.eq("secret", args.secret))
      .first()
    if (!card) {
      throw new Error("Card not found")
    }

    const account = await ctx.db.get(card.accountId)
    if (!account) {
      throw new Error("Account not found")
    }

    const resetPatch = applyResetIfNeeded(card)
    const spentBaseline = resetPatch ? "0" : card.spent
    const spentBefore = BigInt(spentBaseline || "0")
    const value = BigInt(args.value)

    if (card.status !== "active") {
      throw new Error("Card paused")
    }

    if (value <= 0n) {
      throw new Error("Invalid amount")
    }

    if (card.limit && spentBefore + value > BigInt(card.limit)) {
      throw new Error("Card limit exceeded")
    }

    for (const policy of card.policies ?? []) {
      if (policy.type === "maxPerTx" && value > BigInt(policy.value)) {
        throw new Error("Max per transaction exceeded")
      }

      if (policy.type === "allowedRecipient") {
        if (normalizeAddress(args.to) !== normalizeAddress(policy.value)) {
          throw new Error("Recipient not allowed")
        }
      }

      if (policy.type === "allowedContract") {
        if (normalizeAddress(args.to) !== normalizeAddress(policy.value)) {
          throw new Error("Contract not allowed")
        }
      }
    }

    const txId = await ctx.db.insert("transactions", {
      userId: card.userId,
      accountId: card.accountId,
      hash: args.hash,
      from: args.from,
      to: args.to,
      value: args.value,
      direction: args.direction,
      status: args.status,
      chain: args.chain,
      agentCardId: card._id,
      createdAt: Date.now(),
    })

    await ctx.db.patch(card._id, {
      spent: (spentBefore + value).toString(),
      ...(resetPatch ?? {}),
    })

    return {
      txId,
      description: args.description,
    }
  },
})

export const setCardStatusBySecret = mutation({
  args: {
    secret: v.string(),
    status: v.union(v.literal("active"), v.literal("paused")),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("agentCards")
      .withIndex("by_secret", (q) => q.eq("secret", args.secret))
      .first()
    if (!card) {
      throw new Error("Card not found")
    }

    await ctx.db.patch(card._id, {
      status: args.status,
    })

    return { status: args.status }
  },
})
