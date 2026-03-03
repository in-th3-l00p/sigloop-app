import { mutation, query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"

export const create = mutation({
  args: {
    accountId: v.id("smartAccounts"),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    direction: v.string(),
    status: v.string(),
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
