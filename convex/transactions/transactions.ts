import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"

const txStatus = v.union(
  v.literal("progress"),
  v.literal("success"),
  v.literal("error")
)

export const create = mutation({
  args: {
    accountId: v.id("smartAccounts"),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    direction: v.string(),
    status: txStatus,
    chain: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "transactions.create")
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    return ctx.db.insert("transactions", {
      userId,
      accountId: args.accountId,
      hash: args.hash,
      from: args.from,
      to: args.to,
      value: args.value,
      direction: args.direction,
      status: args.status,
      chain: args.chain,
      createdAt: Date.now(),
    })
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("transactions"),
    status: txStatus,
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "transactions.updateStatus")
    const tx = await ctx.db.get(args.id)
    if (!tx || tx.userId !== userId) {
      throw new Error("Transaction not found")
    }
    if (tx.status === "success" || tx.status === "error") {
      return tx
    }
    await ctx.db.patch(args.id, { status: args.status })
    return { ...tx, status: args.status }
  },
})

export const migrateStatuses = mutation({
  args: {},
  handler: async (ctx) => {
    const txs = await ctx.db.query("transactions").collect()
    let changed = 0
    let untouched = 0
    for (const tx of txs) {
      let next = tx.status
      if (tx.status === "pending") next = "progress"
      if (tx.status === "confirmed") next = "success"
      if (tx.status === "failed") next = "error"
      if (tx.status === "success" || tx.status === "error" || tx.status === "progress") {
        next = tx.status
      }

      if (next !== tx.status) {
        await ctx.db.patch(tx._id, { status: next })
        changed += 1
      } else {
        untouched += 1
      }
    }
    return { total: txs.length, changed, untouched }
  },
})

export const listByAccount = query({
  args: { accountId: v.id("smartAccounts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "transactions.listByAccount")
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== userId) {
      throw new Error("Account not found")
    }
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect()

    return txs.sort((a, b) => b.createdAt - a.createdAt)
  },
})
