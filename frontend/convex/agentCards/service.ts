import { mutation, query } from "../_generated/server"
import { v } from "convex/values"

function normalizeAddress(address: string) {
  return address.trim().toLowerCase()
}

async function mirrorIncomingForRecipients(
  ctx: any,
  args: {
    sourceAccountId: any
    hash: string
    from: string
    to: string
    value: string
    status: "progress" | "success" | "error"
    chain: string
  }
) {
  const recipientAddress = normalizeAddress(args.to)
  const accounts = await ctx.db.query("smartAccounts").collect()
  const recipientAccounts = accounts.filter((item: any) =>
    item._id !== args.sourceAccountId && normalizeAddress(item.address) === recipientAddress
  )

  for (const recipient of recipientAccounts) {
    const recipientTxs = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q: any) => q.eq("accountId", recipient._id))
      .collect()
    const existingIncoming = recipientTxs.find((item: any) => item.hash === args.hash && item.direction === "in")
    if (existingIncoming) continue

    await ctx.db.insert("transactions", {
      userId: recipient.userId,
      accountId: recipient._id,
      hash: args.hash,
      from: args.from,
      to: args.to,
      value: args.value,
      direction: "in",
      status: args.status,
      chain: args.chain,
      createdAt: Date.now(),
    })
  }
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

function assertCardPolicyAndLimits(card: {
  status: string
  limit?: string
  spent: string
  policies?: Array<{ type: string; value: string }>
}, to: string, value: string) {
  const amount = BigInt(value)

  if (card.status !== "active") {
    throw new Error("Card paused")
  }

  if (amount <= 0n) {
    throw new Error("Invalid amount")
  }

  if (card.limit && BigInt(card.spent || "0") + amount > BigInt(card.limit)) {
    throw new Error("Card limit exceeded")
  }

  for (const policy of card.policies ?? []) {
    if (policy.type === "maxPerTx" && amount > BigInt(policy.value)) {
      throw new Error("Max per transaction exceeded")
    }

    if (policy.type === "allowedRecipient") {
      if (normalizeAddress(to) !== normalizeAddress(policy.value)) {
        throw new Error("Recipient not allowed")
      }
    }

    if (policy.type === "allowedContract") {
      if (normalizeAddress(to) !== normalizeAddress(policy.value)) {
        throw new Error("Contract not allowed")
      }
    }
  }
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
    status: v.union(v.literal("progress"), v.literal("success"), v.literal("error")),
    chain: v.string(),
    description: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
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
    const effectiveCard = { ...card, spent: spentBaseline }
    assertCardPolicyAndLimits(effectiveCard, args.to, args.value)
    const spentBefore = BigInt(spentBaseline || "0")
    const value = BigInt(args.value)

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
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    })

    if (args.direction === "out") {
      await mirrorIncomingForRecipients(ctx, {
        sourceAccountId: card.accountId,
        hash: args.hash,
        from: args.from,
        to: args.to,
        value: args.value,
        status: args.status,
        chain: args.chain,
      })
    }

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

export const prepareCardTransactionBySecret = mutation({
  args: {
    secret: v.string(),
    to: v.string(),
    value: v.string(),
    idempotencyKey: v.string(),
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

    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_card_idempotency", (q) =>
        q.eq("agentCardId", card._id).eq("idempotencyKey", args.idempotencyKey)
      )
      .first()

    if (existing) {
      if (
        normalizeAddress(existing.to) !== normalizeAddress(args.to) ||
        existing.value !== args.value
      ) {
        throw new Error("Idempotency key reuse with different payload")
      }
      return {
        mode: "existing",
        txId: existing._id,
        hash: existing.hash,
        status: existing.status,
      }
    }

    const resetPatch = applyResetIfNeeded(card)
    const spentBaseline = resetPatch ? "0" : card.spent
    const effectiveCard = { ...card, spent: spentBaseline }
    assertCardPolicyAndLimits(effectiveCard, args.to, args.value)

    const spentBefore = BigInt(spentBaseline || "0")
    const amount = BigInt(args.value)

    const txId = await ctx.db.insert("transactions", {
      userId: card.userId,
      accountId: card.accountId,
      hash: `pending:${args.idempotencyKey}`,
      from: account.address,
      to: args.to,
      value: args.value,
      direction: "out",
      status: "progress",
      chain: account.chain,
      agentCardId: card._id,
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    })

    await mirrorIncomingForRecipients(ctx, {
      sourceAccountId: card.accountId,
      hash: `pending:${args.idempotencyKey}`,
      from: account.address,
      to: args.to,
      value: args.value,
      status: "progress",
      chain: account.chain,
    })

    await ctx.db.patch(card._id, {
      spent: (spentBefore + amount).toString(),
      ...(resetPatch ?? {}),
    })

    return {
      mode: "reserved",
      txId,
      hash: `pending:${args.idempotencyKey}`,
      status: "progress",
    }
  },
})

export const finalizePreparedCardTransactionBySecret = mutation({
  args: {
    secret: v.string(),
    txId: v.id("transactions"),
    hash: v.string(),
    status: v.union(v.literal("progress"), v.literal("success"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("agentCards")
      .withIndex("by_secret", (q) => q.eq("secret", args.secret))
      .first()
    if (!card) {
      throw new Error("Card not found")
    }

    const tx = await ctx.db.get(args.txId)
    if (!tx || tx.agentCardId !== card._id) {
      throw new Error("Transaction not found")
    }

    if (tx.status === "success" || tx.status === "error") {
      return tx
    }

    const previousHash = tx.hash

    await ctx.db.patch(tx._id, {
      hash: args.hash,
      status: args.status,
    })

    const sameHashTxs = await ctx.db.query("transactions").collect()
    const mirrors = sameHashTxs.filter((item: any) =>
      item._id !== tx._id &&
      item.hash === previousHash &&
      item.status !== "success" &&
      item.status !== "error"
    )
    for (const mirror of mirrors) {
      await ctx.db.patch(mirror._id, {
        hash: args.hash,
        status: args.status,
      })
    }

    if (args.status === "error") {
      const nextSpent = BigInt(card.spent || "0") - BigInt(tx.value || "0")
      await ctx.db.patch(card._id, {
        spent: (nextSpent > 0n ? nextSpent : 0n).toString(),
      })
    }

    return { ...tx, hash: args.hash, status: args.status }
  },
})

export const setCardTransactionStatusBySecret = mutation({
  args: {
    secret: v.string(),
    hash: v.string(),
    status: v.union(v.literal("progress"), v.literal("success"), v.literal("error")),
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

    const tx = txs.find((item) => item.hash === args.hash)
    if (!tx) {
      throw new Error("Transaction not found")
    }
    if (tx.status === "success" || tx.status === "error") {
      return tx
    }

    await ctx.db.patch(tx._id, { status: args.status })

    const sameHashTxs = await ctx.db.query("transactions").collect()
    const mirrors = sameHashTxs.filter((item: any) =>
      item._id !== tx._id &&
      item.hash === tx.hash &&
      item.status !== "success" &&
      item.status !== "error"
    )
    for (const mirror of mirrors) {
      await ctx.db.patch(mirror._id, { status: args.status })
    }

    if (args.status === "error") {
      const nextSpent = BigInt(card.spent || "0") - BigInt(tx.value || "0")
      await ctx.db.patch(card._id, {
        spent: (nextSpent > 0n ? nextSpent : 0n).toString(),
      })
    }

    return { ...tx, status: args.status }
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
