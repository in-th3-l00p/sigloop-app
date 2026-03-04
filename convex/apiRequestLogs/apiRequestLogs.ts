import { query } from "../_generated/server"
import { v } from "convex/values"
import { requireAuth } from "../lib/auth"

function formatDay(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${date.getUTCDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiRequestLogs.list")
    const rows = await ctx.db
      .query("apiRequestLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const limit = args.limit ?? 100
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
  },
})

export const usage = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, "apiRequestLogs.usage")
    const days = args.days ?? 7
    const since = Date.now() - days * 24 * 60 * 60 * 1000

    const rows = await ctx.db
      .query("apiRequestLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const filtered = rows.filter((item) => item.createdAt >= since)

    const byDay = new Map<string, { total: number; success: number; error: number }>()
    for (const row of filtered) {
      const key = formatDay(row.createdAt)
      const current = byDay.get(key) ?? { total: 0, success: 0, error: 0 }
      current.total += 1
      if (row.statusCode >= 200 && row.statusCode < 400) current.success += 1
      if (row.statusCode >= 400) current.error += 1
      byDay.set(key, current)
    }

    return {
      total: filtered.length,
      success: filtered.filter((item) => item.statusCode >= 200 && item.statusCode < 400).length,
      error: filtered.filter((item) => item.statusCode >= 400).length,
      perDay: Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, value]) => ({ day, ...value })),
    }
  },
})
